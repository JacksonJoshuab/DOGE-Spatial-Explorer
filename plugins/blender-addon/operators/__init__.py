# operators/__init__.py
# DOGE Spatial Explorer — Blender Operators
#
# All Blender operators for the DOGE Spatial addon.

import bpy
import json
import os
import tempfile
import threading
import time
from pathlib import Path

try:
    import requests
    import websocket
    HAS_NETWORK = True
except ImportError:
    HAS_NETWORK = False


# ── Cloud Connection Operator ────────────────────────────────────────────

class DOGE_OT_connect_cloud(bpy.types.Operator):
    """Connect to the DOGE Spatial cloud backend"""

    bl_idname = "doge_spatial.connect_cloud"
    bl_label = "Connect to Cloud"
    bl_description = "Establish connection to the DOGE Spatial cloud backend"

    def execute(self, context):
        prefs = context.preferences.addons[__package__.rsplit('.', 1)[0]].preferences
        scene_props = context.scene.doge_spatial

        if not HAS_NETWORK:
            self.report({'ERROR'}, "Network libraries not available. Install 'requests' and 'websocket-client'.")
            return {'CANCELLED'}

        if not prefs.auth_token:
            self.report({'ERROR'}, "Please set your auth token in addon preferences.")
            return {'CANCELLED'}

        try:
            # Test connection
            response = requests.get(
                f"{prefs.cloud_url}/api/health",
                headers={"Authorization": f"Bearer {prefs.auth_token}"},
                timeout=10
            )

            if response.status_code == 200:
                scene_props.is_connected = True
                self.report({'INFO'}, "Connected to DOGE Spatial cloud")
            else:
                self.report({'WARNING'}, f"Server returned status {response.status_code}")

        except Exception as e:
            self.report({'ERROR'}, f"Connection failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}


class DOGE_OT_disconnect_cloud(bpy.types.Operator):
    """Disconnect from the DOGE Spatial cloud backend"""

    bl_idname = "doge_spatial.disconnect_cloud"
    bl_label = "Disconnect"
    bl_description = "Disconnect from the cloud backend"

    def execute(self, context):
        context.scene.doge_spatial.is_connected = False
        self.report({'INFO'}, "Disconnected from cloud")
        return {'FINISHED'}


# ── Scene Sync Operators ─────────────────────────────────────────────────

class DOGE_OT_push_scene(bpy.types.Operator):
    """Push the current Blender scene to the cloud"""

    bl_idname = "doge_spatial.push_scene"
    bl_label = "Push Scene"
    bl_description = "Upload the current scene to the DOGE Spatial cloud"

    export_format: bpy.props.EnumProperty(
        name="Format",
        items=[
            ('USDZ', 'USDZ', 'Apple USDZ format'),
            ('GLB', 'glTF', 'glTF 2.0 Binary'),
        ],
        default='USDZ',
    )

    def execute(self, context):
        prefs = context.preferences.addons[__package__.rsplit('.', 1)[0]].preferences
        scene_props = context.scene.doge_spatial

        if not scene_props.is_connected:
            self.report({'ERROR'}, "Not connected to cloud. Connect first.")
            return {'CANCELLED'}

        # Export scene to temporary file
        with tempfile.TemporaryDirectory() as tmpdir:
            if self.export_format == 'USDZ':
                filepath = os.path.join(tmpdir, "scene.usdc")
                bpy.ops.wm.usd_export(filepath=filepath)
            else:
                filepath = os.path.join(tmpdir, "scene.glb")
                bpy.ops.export_scene.gltf(filepath=filepath, export_format='GLB')

            # Also export scene graph as JSON
            scene_data = self._build_scene_graph(context)
            json_path = os.path.join(tmpdir, "scene_graph.json")
            with open(json_path, 'w') as f:
                json.dump(scene_data, f, indent=2)

            # Upload to cloud
            try:
                if HAS_NETWORK:
                    with open(filepath, 'rb') as f:
                        response = requests.post(
                            f"{prefs.cloud_url}/api/documents/{scene_props.document_id}/push",
                            headers={"Authorization": f"Bearer {prefs.auth_token}"},
                            files={
                                'scene': (os.path.basename(filepath), f),
                                'graph': ('scene_graph.json', json.dumps(scene_data)),
                            },
                            timeout=60
                        )

                    if response.status_code == 200:
                        scene_props.last_sync_time = time.strftime("%Y-%m-%d %H:%M:%S")
                        self.report({'INFO'}, "Scene pushed to cloud successfully")
                    else:
                        self.report({'WARNING'}, f"Push failed: {response.status_code}")

            except Exception as e:
                self.report({'ERROR'}, f"Push failed: {str(e)}")
                return {'CANCELLED'}

        return {'FINISHED'}

    def _build_scene_graph(self, context):
        """Convert Blender scene to the shared scene graph format."""
        nodes = []
        for obj in context.scene.objects:
            node = {
                "id": str(hash(obj.name)),
                "name": obj.name,
                "type": self._blender_type_to_node_type(obj.type),
                "transform": {
                    "positionX": obj.location.x,
                    "positionY": obj.location.z,  # Blender Z-up to Y-up
                    "positionZ": -obj.location.y,
                    "rotationX": obj.rotation_euler.x,
                    "rotationY": obj.rotation_euler.z,
                    "rotationZ": -obj.rotation_euler.y,
                    "scaleX": obj.scale.x,
                    "scaleY": obj.scale.z,
                    "scaleZ": obj.scale.y,
                },
                "isVisible": not obj.hide_viewport,
                "isLocked": obj.hide_select,
                "children": [],
            }

            # Add material info
            if obj.active_material:
                mat = obj.active_material
                node["material"] = {
                    "type": "physically_based",
                    "roughness": getattr(mat, 'roughness', 0.5),
                    "metallic": getattr(mat, 'metallic', 0.0),
                }
                if hasattr(mat, 'diffuse_color'):
                    r, g, b, a = mat.diffuse_color
                    node["material"]["baseColorHex"] = f"#{int(r*255):02x}{int(g*255):02x}{int(b*255):02x}"

            # Add geometry info
            if obj.type == 'MESH' and obj.data:
                mesh = obj.data
                node["geometry"] = {
                    "vertexCount": len(mesh.vertices),
                    "triangleCount": len(mesh.polygons),
                }

            nodes.append(node)

        return {
            "documentName": context.scene.name,
            "format": "doge_spatial_v1",
            "blenderVersion": bpy.app.version_string,
            "nodes": nodes,
            "timestamp": time.time(),
        }

    def _blender_type_to_node_type(self, blender_type):
        mapping = {
            'MESH': 'mesh',
            'LIGHT': 'light',
            'CAMERA': 'camera',
            'EMPTY': 'group',
            'ARMATURE': 'group',
            'CURVE': 'mesh',
            'SURFACE': 'mesh',
            'FONT': 'text3D',
            'SPEAKER': 'audio',
        }
        return mapping.get(blender_type, 'mesh')


class DOGE_OT_pull_scene(bpy.types.Operator):
    """Pull the latest scene from the cloud"""

    bl_idname = "doge_spatial.pull_scene"
    bl_label = "Pull Scene"
    bl_description = "Download the latest scene from the DOGE Spatial cloud"

    def execute(self, context):
        prefs = context.preferences.addons[__package__.rsplit('.', 1)[0]].preferences
        scene_props = context.scene.doge_spatial

        if not scene_props.is_connected:
            self.report({'ERROR'}, "Not connected to cloud.")
            return {'CANCELLED'}

        try:
            if HAS_NETWORK:
                # Fetch scene data
                response = requests.get(
                    f"{prefs.cloud_url}/api/documents/{scene_props.document_id}/pull",
                    headers={"Authorization": f"Bearer {prefs.auth_token}"},
                    timeout=60
                )

                if response.status_code == 200:
                    with tempfile.NamedTemporaryFile(suffix='.glb', delete=False) as f:
                        f.write(response.content)
                        temp_path = f.name

                    # Import the scene
                    bpy.ops.import_scene.gltf(filepath=temp_path)
                    os.unlink(temp_path)

                    scene_props.last_sync_time = time.strftime("%Y-%m-%d %H:%M:%S")
                    self.report({'INFO'}, "Scene pulled from cloud successfully")
                else:
                    self.report({'WARNING'}, f"Pull failed: {response.status_code}")

        except Exception as e:
            self.report({'ERROR'}, f"Pull failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}


# ── Export Operators ─────────────────────────────────────────────────────

class DOGE_OT_export_usdz(bpy.types.Operator):
    """Export scene as USDZ for Apple Vision Pro"""

    bl_idname = "doge_spatial.export_usdz"
    bl_label = "Export USDZ"
    bl_description = "Export the scene as USDZ for Apple Vision Pro"

    filepath: bpy.props.StringProperty(subtype='FILE_PATH')

    def execute(self, context):
        if not self.filepath:
            self.filepath = os.path.join(
                os.path.expanduser("~"),
                f"{context.scene.name}.usdc"
            )

        try:
            bpy.ops.wm.usd_export(filepath=self.filepath)
            self.report({'INFO'}, f"Exported USDZ to {self.filepath}")
        except Exception as e:
            self.report({'ERROR'}, f"Export failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}


class DOGE_OT_export_glb(bpy.types.Operator):
    """Export scene as GLB for Meta Quest"""

    bl_idname = "doge_spatial.export_glb"
    bl_label = "Export GLB"
    bl_description = "Export the scene as glTF Binary for Meta Quest"

    filepath: bpy.props.StringProperty(subtype='FILE_PATH')

    def execute(self, context):
        if not self.filepath:
            self.filepath = os.path.join(
                os.path.expanduser("~"),
                f"{context.scene.name}.glb"
            )

        try:
            bpy.ops.export_scene.gltf(
                filepath=self.filepath,
                export_format='GLB',
                export_apply=True,
            )
            self.report({'INFO'}, f"Exported GLB to {self.filepath}")
        except Exception as e:
            self.report({'ERROR'}, f"Export failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}

    def invoke(self, context, event):
        context.window_manager.fileselect_add(self)
        return {'RUNNING_MODAL'}


# ── Live Sync Operator ───────────────────────────────────────────────────

class DOGE_OT_start_live_sync(bpy.types.Operator):
    """Start real-time live sync with spatial devices"""

    bl_idname = "doge_spatial.start_live_sync"
    bl_label = "Start Live Sync"
    bl_description = "Begin real-time synchronization with connected spatial devices"

    _timer = None
    _ws = None
    _ws_thread = None

    def modal(self, context, event):
        if event.type == 'TIMER':
            # Check for incoming changes
            if self._ws and self._ws.connected:
                # Process any queued updates
                pass

            # Send local changes if auto-sync is enabled
            prefs = context.preferences.addons[__package__.rsplit('.', 1)[0]].preferences
            if prefs.auto_sync:
                self._send_updates(context)

        if event.type == 'ESC':
            self.cancel(context)
            return {'CANCELLED'}

        return {'PASS_THROUGH'}

    def execute(self, context):
        prefs = context.preferences.addons[__package__.rsplit('.', 1)[0]].preferences
        scene_props = context.scene.doge_spatial

        if not scene_props.is_connected:
            self.report({'ERROR'}, "Not connected to cloud.")
            return {'CANCELLED'}

        # Start WebSocket connection in background thread
        if HAS_NETWORK:
            ws_url = prefs.cloud_url.replace('https://', 'wss://').replace('http://', 'ws://')
            ws_url = f"{ws_url}/ws/collab/{scene_props.document_id}"

            try:
                self._ws = websocket.WebSocketApp(
                    ws_url,
                    header={"Authorization": f"Bearer {prefs.auth_token}"},
                    on_message=self._on_ws_message,
                    on_error=self._on_ws_error,
                    on_close=self._on_ws_close,
                )
                self._ws_thread = threading.Thread(target=self._ws.run_forever)
                self._ws_thread.daemon = True
                self._ws_thread.start()
            except Exception as e:
                self.report({'WARNING'}, f"WebSocket connection failed: {str(e)}")

        # Start modal timer
        wm = context.window_manager
        self._timer = wm.event_timer_add(prefs.sync_interval, window=context.window)
        wm.modal_handler_add(self)

        self.report({'INFO'}, "Live sync started")
        return {'RUNNING_MODAL'}

    def cancel(self, context):
        wm = context.window_manager
        if self._timer:
            wm.event_timer_remove(self._timer)

        if self._ws:
            self._ws.close()

        self.report({'INFO'}, "Live sync stopped")

    def _send_updates(self, context):
        """Detect and send local changes."""
        # In production, this would track depsgraph changes
        # and send incremental updates via WebSocket
        pass

    def _on_ws_message(self, ws, message):
        """Handle incoming WebSocket messages."""
        try:
            data = json.loads(message)
            # Queue for processing in the main thread
            # In production, use a thread-safe queue
        except json.JSONDecodeError:
            pass

    def _on_ws_error(self, ws, error):
        print(f"[DOGE Spatial] WebSocket error: {error}")

    def _on_ws_close(self, ws, close_status_code, close_msg):
        print("[DOGE Spatial] WebSocket connection closed")


class DOGE_OT_stop_live_sync(bpy.types.Operator):
    """Stop real-time live sync"""

    bl_idname = "doge_spatial.stop_live_sync"
    bl_label = "Stop Live Sync"
    bl_description = "Stop real-time synchronization"

    def execute(self, context):
        # The modal operator handles cleanup via ESC
        self.report({'INFO'}, "Use ESC to stop live sync")
        return {'FINISHED'}


# ── AI Generation Operators ──────────────────────────────────────────────

class DOGE_OT_ai_generate_model(bpy.types.Operator):
    """Generate a 3D model from text description using AI"""

    bl_idname = "doge_spatial.ai_generate_model"
    bl_label = "AI Generate Model"
    bl_description = "Generate a 3D model from a text prompt using the cloud AI service"

    prompt: bpy.props.StringProperty(
        name="Prompt",
        description="Text description of the model to generate",
        default="",
    )

    def execute(self, context):
        prefs = context.preferences.addons[__package__.rsplit('.', 1)[0]].preferences

        if not self.prompt:
            self.report({'ERROR'}, "Please provide a text prompt.")
            return {'CANCELLED'}

        try:
            if HAS_NETWORK:
                response = requests.post(
                    f"{prefs.cloud_url}/api/ai/text-to-3d",
                    headers={
                        "Authorization": f"Bearer {prefs.auth_token}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "prompt": self.prompt,
                        "style": "realistic",
                        "format": "glb",
                        "quality": "high",
                    },
                    timeout=120
                )

                if response.status_code == 200:
                    result = response.json()
                    # Download and import the generated model
                    model_response = requests.get(result['assetURL'], timeout=60)
                    with tempfile.NamedTemporaryFile(suffix='.glb', delete=False) as f:
                        f.write(model_response.content)
                        temp_path = f.name

                    bpy.ops.import_scene.gltf(filepath=temp_path)
                    os.unlink(temp_path)

                    self.report({'INFO'}, f"AI model generated and imported: {self.prompt}")
                else:
                    self.report({'WARNING'}, f"AI generation failed: {response.status_code}")

        except Exception as e:
            self.report({'ERROR'}, f"AI generation failed: {str(e)}")
            return {'CANCELLED'}

        return {'FINISHED'}

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self, width=400)


class DOGE_OT_ai_generate_texture(bpy.types.Operator):
    """Generate PBR textures from text description using AI"""

    bl_idname = "doge_spatial.ai_generate_texture"
    bl_label = "AI Generate Texture"
    bl_description = "Generate PBR texture set from a text prompt"

    prompt: bpy.props.StringProperty(
        name="Prompt",
        description="Text description of the texture to generate",
        default="",
    )

    resolution: bpy.props.IntProperty(
        name="Resolution",
        default=2048,
        min=512,
        max=4096,
    )

    def execute(self, context):
        prefs = context.preferences.addons[__package__.rsplit('.', 1)[0]].preferences

        if not self.prompt:
            self.report({'ERROR'}, "Please provide a text prompt.")
            return {'CANCELLED'}

        self.report({'INFO'}, f"Generating texture: {self.prompt} at {self.resolution}px")
        # In production, call the AI texture generation API
        return {'FINISHED'}

    def invoke(self, context, event):
        return context.window_manager.invoke_props_dialog(self, width=400)


# ── Registration ─────────────────────────────────────────────────────────

classes = [
    DOGE_OT_connect_cloud,
    DOGE_OT_disconnect_cloud,
    DOGE_OT_push_scene,
    DOGE_OT_pull_scene,
    DOGE_OT_export_usdz,
    DOGE_OT_export_glb,
    DOGE_OT_start_live_sync,
    DOGE_OT_stop_live_sync,
    DOGE_OT_ai_generate_model,
    DOGE_OT_ai_generate_texture,
]


def register():
    for cls in classes:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
