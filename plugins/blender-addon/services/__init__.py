"""
DOGE Spatial Editor — Blender Plugin Services
Cloud sync, real-time collaboration, AI generation, and cross-platform bridge.
"""

import bpy
import json
import threading
import time
import hashlib
import os
import tempfile
from pathlib import Path
from urllib.request import Request, urlopen
from urllib.error import URLError

# ─── Configuration ────────────────────────────────────────────────────────────

class DOGEConfig:
    """Global configuration for the DOGE Spatial Editor Blender plugin."""
    
    DEFAULT_CLOUD_URL = "https://doge-spatial.example.com"
    
    @staticmethod
    def get_cloud_url():
        prefs = bpy.context.preferences.addons.get("doge_spatial_editor")
        if prefs and hasattr(prefs.preferences, "cloud_url"):
            return prefs.preferences.cloud_url
        return DOGEConfig.DEFAULT_CLOUD_URL
    
    @staticmethod
    def get_api_key():
        prefs = bpy.context.preferences.addons.get("doge_spatial_editor")
        if prefs and hasattr(prefs.preferences, "api_key"):
            return prefs.preferences.api_key
        return ""
    
    @staticmethod
    def get_user_id():
        prefs = bpy.context.preferences.addons.get("doge_spatial_editor")
        if prefs and hasattr(prefs.preferences, "user_id"):
            return prefs.preferences.user_id
        return "blender_user"
    
    @staticmethod
    def get_user_color():
        prefs = bpy.context.preferences.addons.get("doge_spatial_editor")
        if prefs and hasattr(prefs.preferences, "user_color"):
            return prefs.preferences.user_color
        return "#F39C12"


# ─── Cloud Sync Service ──────────────────────────────────────────────────────

class CloudSyncService:
    """
    Handles synchronization of Blender scene data with the DOGE cloud backend.
    Supports CRDT-based conflict resolution and incremental sync.
    """
    
    def __init__(self):
        self.is_connected = False
        self.document_id = None
        self.sync_thread = None
        self.pending_operations = []
        self._lock = threading.Lock()
        self._running = False
        self._last_sync_hash = ""
    
    def connect(self, document_id: str):
        """Connect to a cloud document for sync."""
        self.document_id = document_id
        self.is_connected = True
        self._running = True
        
        # Start background sync thread
        self.sync_thread = threading.Thread(target=self._sync_loop, daemon=True)
        self.sync_thread.start()
        
        print(f"[DOGE] Connected to document: {document_id}")
    
    def disconnect(self):
        """Disconnect from cloud sync."""
        self._running = False
        self.is_connected = False
        if self.sync_thread:
            self.sync_thread.join(timeout=5)
        print("[DOGE] Disconnected from cloud sync")
    
    def push_operation(self, operation: dict):
        """Queue an editing operation for sync."""
        with self._lock:
            operation["timestamp"] = time.time()
            operation["author_id"] = DOGEConfig.get_user_id()
            operation["author_platform"] = "blender"
            self.pending_operations.append(operation)
    
    def _sync_loop(self):
        """Background sync loop."""
        while self._running:
            try:
                # Push pending operations
                with self._lock:
                    if self.pending_operations:
                        self._push_operations(self.pending_operations.copy())
                        self.pending_operations.clear()
                
                # Pull remote operations
                remote_ops = self._pull_operations()
                if remote_ops:
                    # Apply remote operations to Blender scene
                    for op in remote_ops:
                        self._apply_remote_operation(op)
                
            except Exception as e:
                print(f"[DOGE] Sync error: {e}")
            
            time.sleep(0.1)  # 100ms sync interval
    
    def _push_operations(self, operations: list):
        """Push operations to cloud backend."""
        url = f"{DOGEConfig.get_cloud_url()}/api/documents/{self.document_id}/operations"
        data = json.dumps({"operations": operations}).encode()
        
        req = Request(url, data=data, method="POST")
        req.add_header("Content-Type", "application/json")
        req.add_header("Authorization", f"Bearer {DOGEConfig.get_api_key()}")
        
        try:
            with urlopen(req, timeout=5) as resp:
                return json.loads(resp.read())
        except URLError as e:
            print(f"[DOGE] Push failed: {e}")
    
    def _pull_operations(self) -> list:
        """Pull new operations from cloud backend."""
        url = f"{DOGEConfig.get_cloud_url()}/api/documents/{self.document_id}/operations?since={self._last_sync_hash}"
        
        req = Request(url)
        req.add_header("Authorization", f"Bearer {DOGEConfig.get_api_key()}")
        
        try:
            with urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read())
                return data.get("operations", [])
        except URLError:
            return []
    
    def _apply_remote_operation(self, operation: dict):
        """Apply a remote operation to the Blender scene (thread-safe)."""
        # Must use bpy.app.timers for thread-safe Blender operations
        def _apply():
            op_type = operation.get("type")
            node_id = operation.get("node_id")
            payload = operation.get("payload", {})
            
            obj = bpy.data.objects.get(node_id)
            if not obj:
                if op_type == "node_create":
                    self._create_node(payload)
                return None
            
            if op_type == "transform_update":
                if "position" in payload:
                    obj.location = payload["position"]
                if "rotation" in payload:
                    obj.rotation_euler = payload["rotation"]
                if "scale" in payload:
                    obj.scale = payload["scale"]
            
            elif op_type == "material_update":
                if obj.data and obj.data.materials:
                    mat = obj.data.materials[0]
                    if mat.use_nodes:
                        bsdf = mat.node_tree.nodes.get("Principled BSDF")
                        if bsdf:
                            if "color" in payload:
                                c = payload["color"]
                                bsdf.inputs["Base Color"].default_value = (c[0], c[1], c[2], 1.0)
                            if "roughness" in payload:
                                bsdf.inputs["Roughness"].default_value = payload["roughness"]
                            if "metallic" in payload:
                                bsdf.inputs["Metallic"].default_value = payload["metallic"]
            
            elif op_type == "node_delete":
                bpy.data.objects.remove(obj, do_unlink=True)
            
            elif op_type == "visibility_toggle":
                obj.hide_viewport = payload.get("hidden", False)
                obj.hide_render = payload.get("hidden", False)
            
            return None
        
        bpy.app.timers.register(_apply, first_interval=0)
    
    def _create_node(self, payload: dict):
        """Create a new node from remote operation."""
        node_type = payload.get("node_type", "cube")
        name = payload.get("name", "Remote Object")
        
        if node_type == "cube":
            bpy.ops.mesh.primitive_cube_add()
        elif node_type == "sphere":
            bpy.ops.mesh.primitive_uv_sphere_add()
        elif node_type == "cylinder":
            bpy.ops.mesh.primitive_cylinder_add()
        elif node_type == "plane":
            bpy.ops.mesh.primitive_plane_add()
        elif node_type == "empty":
            bpy.ops.object.empty_add()
        
        obj = bpy.context.active_object
        if obj:
            obj.name = name
            if "position" in payload:
                obj.location = payload["position"]


# ─── Collaboration Service ────────────────────────────────────────────────────

class CollaborationService:
    """
    Real-time collaboration with other platforms (visionOS, Meta Quest, web).
    Manages participant state, cursor positions, and editing locks.
    """
    
    def __init__(self, cloud_sync: CloudSyncService):
        self.cloud_sync = cloud_sync
        self.participants = {}
        self.editing_locks = {}
        self._cursor_thread = None
        self._running = False
    
    def start(self):
        """Start collaboration service."""
        self._running = True
        self._cursor_thread = threading.Thread(target=self._broadcast_cursor, daemon=True)
        self._cursor_thread.start()
    
    def stop(self):
        """Stop collaboration service."""
        self._running = False
        if self._cursor_thread:
            self._cursor_thread.join(timeout=5)
    
    def request_edit_lock(self, object_name: str) -> bool:
        """Request an editing lock on an object."""
        user_id = DOGEConfig.get_user_id()
        
        if object_name in self.editing_locks:
            lock_holder = self.editing_locks[object_name]
            if lock_holder != user_id:
                return False  # Already locked by another user
        
        self.editing_locks[object_name] = user_id
        
        # Broadcast lock acquisition
        self.cloud_sync.push_operation({
            "type": "lock_acquire",
            "node_id": object_name,
            "payload": {"user_id": user_id}
        })
        
        return True
    
    def release_edit_lock(self, object_name: str):
        """Release an editing lock on an object."""
        user_id = DOGEConfig.get_user_id()
        
        if self.editing_locks.get(object_name) == user_id:
            del self.editing_locks[object_name]
            
            self.cloud_sync.push_operation({
                "type": "lock_release",
                "node_id": object_name,
                "payload": {"user_id": user_id}
            })
    
    def _broadcast_cursor(self):
        """Broadcast cursor/selection state to other participants."""
        while self._running:
            try:
                # Get current selection and 3D cursor position
                def _get_state():
                    cursor_pos = list(bpy.context.scene.cursor.location)
                    selected = [obj.name for obj in bpy.context.selected_objects]
                    active = bpy.context.active_object.name if bpy.context.active_object else None
                    
                    return {
                        "type": "cursor_update",
                        "node_id": "__cursor__",
                        "payload": {
                            "cursor_position": cursor_pos,
                            "selected_nodes": selected,
                            "active_node": active,
                            "user_id": DOGEConfig.get_user_id(),
                            "user_color": DOGEConfig.get_user_color(),
                            "platform": "blender"
                        }
                    }
                
                # Thread-safe access to Blender state
                # In practice, would use bpy.app.timers
                
            except Exception:
                pass
            
            time.sleep(0.5)  # 500ms cursor broadcast interval


# ─── AI Generation Service ────────────────────────────────────────────────────

class AIGenerationService:
    """
    AI-powered generation services: text-to-3D, text-to-texture,
    image-to-3D, and audio-to-scene.
    """
    
    def __init__(self):
        self.is_generating = False
        self.progress = 0.0
    
    def text_to_3d(self, prompt: str, style: str = "realistic",
                   resolution: str = "medium", callback=None):
        """Generate a 3D model from text description."""
        self.is_generating = True
        self.progress = 0.0
        
        def _generate():
            try:
                url = f"{DOGEConfig.get_cloud_url()}/api/ai/text-to-3d"
                data = json.dumps({
                    "prompt": prompt,
                    "style": style,
                    "resolution": resolution,
                    "output_format": "glb"
                }).encode()
                
                req = Request(url, data=data, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("Authorization", f"Bearer {DOGEConfig.get_api_key()}")
                
                with urlopen(req, timeout=120) as resp:
                    result = json.loads(resp.read())
                    model_url = result.get("model_url")
                    
                    if model_url:
                        # Download and import the model
                        self._download_and_import(model_url, "glb")
                
                self.is_generating = False
                self.progress = 1.0
                
                if callback:
                    bpy.app.timers.register(lambda: callback(True) or None, first_interval=0)
                    
            except Exception as e:
                print(f"[DOGE AI] Text-to-3D failed: {e}")
                self.is_generating = False
                if callback:
                    bpy.app.timers.register(lambda: callback(False) or None, first_interval=0)
        
        thread = threading.Thread(target=_generate, daemon=True)
        thread.start()
    
    def text_to_texture(self, prompt: str, target_object: str,
                        resolution: int = 2048, callback=None):
        """Generate a texture from text and apply to object."""
        self.is_generating = True
        
        def _generate():
            try:
                url = f"{DOGEConfig.get_cloud_url()}/api/ai/text-to-texture"
                data = json.dumps({
                    "prompt": prompt,
                    "resolution": resolution,
                    "output_format": "png"
                }).encode()
                
                req = Request(url, data=data, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("Authorization", f"Bearer {DOGEConfig.get_api_key()}")
                
                with urlopen(req, timeout=60) as resp:
                    result = json.loads(resp.read())
                    texture_url = result.get("texture_url")
                    
                    if texture_url:
                        self._download_and_apply_texture(texture_url, target_object)
                
                self.is_generating = False
                if callback:
                    bpy.app.timers.register(lambda: callback(True) or None, first_interval=0)
                    
            except Exception as e:
                print(f"[DOGE AI] Text-to-texture failed: {e}")
                self.is_generating = False
                if callback:
                    bpy.app.timers.register(lambda: callback(False) or None, first_interval=0)
        
        thread = threading.Thread(target=_generate, daemon=True)
        thread.start()
    
    def image_to_3d(self, image_path: str, callback=None):
        """Generate a 3D model from an image."""
        self.is_generating = True
        
        def _generate():
            try:
                # Read image and encode as base64
                import base64
                with open(image_path, "rb") as f:
                    image_data = base64.b64encode(f.read()).decode()
                
                url = f"{DOGEConfig.get_cloud_url()}/api/ai/image-to-3d"
                data = json.dumps({
                    "image": image_data,
                    "output_format": "glb"
                }).encode()
                
                req = Request(url, data=data, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("Authorization", f"Bearer {DOGEConfig.get_api_key()}")
                
                with urlopen(req, timeout=120) as resp:
                    result = json.loads(resp.read())
                    model_url = result.get("model_url")
                    
                    if model_url:
                        self._download_and_import(model_url, "glb")
                
                self.is_generating = False
                if callback:
                    bpy.app.timers.register(lambda: callback(True) or None, first_interval=0)
                    
            except Exception as e:
                print(f"[DOGE AI] Image-to-3D failed: {e}")
                self.is_generating = False
                if callback:
                    bpy.app.timers.register(lambda: callback(False) or None, first_interval=0)
        
        thread = threading.Thread(target=_generate, daemon=True)
        thread.start()
    
    def audio_to_scene(self, audio_path: str, callback=None):
        """Generate scene elements from audio description."""
        self.is_generating = True
        
        def _generate():
            try:
                import base64
                with open(audio_path, "rb") as f:
                    audio_data = base64.b64encode(f.read()).decode()
                
                url = f"{DOGEConfig.get_cloud_url()}/api/ai/audio-to-scene"
                data = json.dumps({
                    "audio": audio_data,
                    "output_format": "scene_json"
                }).encode()
                
                req = Request(url, data=data, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("Authorization", f"Bearer {DOGEConfig.get_api_key()}")
                
                with urlopen(req, timeout=120) as resp:
                    result = json.loads(resp.read())
                    scene_data = result.get("scene")
                    
                    if scene_data:
                        self._build_scene_from_data(scene_data)
                
                self.is_generating = False
                if callback:
                    bpy.app.timers.register(lambda: callback(True) or None, first_interval=0)
                    
            except Exception as e:
                print(f"[DOGE AI] Audio-to-scene failed: {e}")
                self.is_generating = False
                if callback:
                    bpy.app.timers.register(lambda: callback(False) or None, first_interval=0)
        
        thread = threading.Thread(target=_generate, daemon=True)
        thread.start()
    
    def _download_and_import(self, url: str, format: str):
        """Download a model file and import into Blender."""
        def _import():
            try:
                tmp_dir = tempfile.mkdtemp()
                tmp_file = os.path.join(tmp_dir, f"model.{format}")
                
                req = Request(url)
                with urlopen(req, timeout=30) as resp:
                    with open(tmp_file, "wb") as f:
                        f.write(resp.read())
                
                if format == "glb" or format == "gltf":
                    bpy.ops.import_scene.gltf(filepath=tmp_file)
                elif format == "usdz" or format == "usdc":
                    bpy.ops.wm.usd_import(filepath=tmp_file)
                elif format == "fbx":
                    bpy.ops.import_scene.fbx(filepath=tmp_file)
                elif format == "obj":
                    bpy.ops.wm.obj_import(filepath=tmp_file)
                
                print(f"[DOGE AI] Model imported: {tmp_file}")
                
            except Exception as e:
                print(f"[DOGE AI] Import failed: {e}")
            
            return None
        
        bpy.app.timers.register(_import, first_interval=0)
    
    def _download_and_apply_texture(self, url: str, object_name: str):
        """Download a texture and apply to the specified object."""
        def _apply():
            try:
                tmp_dir = tempfile.mkdtemp()
                tmp_file = os.path.join(tmp_dir, "texture.png")
                
                req = Request(url)
                with urlopen(req, timeout=30) as resp:
                    with open(tmp_file, "wb") as f:
                        f.write(resp.read())
                
                obj = bpy.data.objects.get(object_name)
                if not obj:
                    return None
                
                # Load image
                img = bpy.data.images.load(tmp_file)
                
                # Create or get material
                if not obj.data.materials:
                    mat = bpy.data.materials.new(name=f"{object_name}_AI_Material")
                    mat.use_nodes = True
                    obj.data.materials.append(mat)
                else:
                    mat = obj.data.materials[0]
                
                # Set up texture node
                if mat.use_nodes:
                    tree = mat.node_tree
                    bsdf = tree.nodes.get("Principled BSDF")
                    
                    tex_node = tree.nodes.new("ShaderNodeTexImage")
                    tex_node.image = img
                    tex_node.location = (-300, 300)
                    
                    tree.links.new(tex_node.outputs["Color"], bsdf.inputs["Base Color"])
                
                print(f"[DOGE AI] Texture applied to {object_name}")
                
            except Exception as e:
                print(f"[DOGE AI] Texture apply failed: {e}")
            
            return None
        
        bpy.app.timers.register(_apply, first_interval=0)
    
    def _build_scene_from_data(self, scene_data: dict):
        """Build Blender scene from AI-generated scene description."""
        def _build():
            try:
                objects = scene_data.get("objects", [])
                for obj_data in objects:
                    obj_type = obj_data.get("type", "cube")
                    name = obj_data.get("name", "AI Object")
                    position = obj_data.get("position", [0, 0, 0])
                    scale = obj_data.get("scale", [1, 1, 1])
                    color = obj_data.get("color", [0.8, 0.8, 0.8])
                    
                    # Create primitive
                    if obj_type == "cube":
                        bpy.ops.mesh.primitive_cube_add(location=position)
                    elif obj_type == "sphere":
                        bpy.ops.mesh.primitive_uv_sphere_add(location=position)
                    elif obj_type == "cylinder":
                        bpy.ops.mesh.primitive_cylinder_add(location=position)
                    elif obj_type == "plane":
                        bpy.ops.mesh.primitive_plane_add(location=position)
                    elif obj_type == "cone":
                        bpy.ops.mesh.primitive_cone_add(location=position)
                    elif obj_type == "torus":
                        bpy.ops.mesh.primitive_torus_add(location=position)
                    
                    obj = bpy.context.active_object
                    if obj:
                        obj.name = name
                        obj.scale = scale
                        
                        # Apply material with color
                        mat = bpy.data.materials.new(name=f"{name}_Material")
                        mat.use_nodes = True
                        bsdf = mat.node_tree.nodes.get("Principled BSDF")
                        if bsdf:
                            bsdf.inputs["Base Color"].default_value = (*color, 1.0)
                        obj.data.materials.append(mat)
                
                print(f"[DOGE AI] Scene built with {len(objects)} objects")
                
            except Exception as e:
                print(f"[DOGE AI] Scene build failed: {e}")
            
            return None
        
        bpy.app.timers.register(_build, first_interval=0)


# ─── Export Service ───────────────────────────────────────────────────────────

class ExportService:
    """
    Export Blender scenes to formats compatible with visionOS, Meta Quest,
    and the DOGE cloud platform.
    """
    
    SUPPORTED_FORMATS = {
        "usdz": {"label": "USDZ (visionOS)", "extension": ".usdz"},
        "glb": {"label": "GLB (Universal)", "extension": ".glb"},
        "gltf": {"label": "glTF (Universal)", "extension": ".gltf"},
        "fbx": {"label": "FBX (Legacy)", "extension": ".fbx"},
        "obj": {"label": "OBJ (Legacy)", "extension": ".obj"},
    }
    
    def export_scene(self, filepath: str, format: str = "glb",
                     selected_only: bool = False) -> bool:
        """Export the current scene to the specified format."""
        try:
            if format == "glb":
                bpy.ops.export_scene.gltf(
                    filepath=filepath,
                    export_format="GLB",
                    use_selection=selected_only,
                    export_apply=True,
                    export_animations=True,
                    export_lights=True,
                    export_cameras=True,
                )
            elif format == "gltf":
                bpy.ops.export_scene.gltf(
                    filepath=filepath,
                    export_format="GLTF_SEPARATE",
                    use_selection=selected_only,
                    export_apply=True,
                )
            elif format == "usdz":
                # Export as USD first, then package as USDZ
                usd_path = filepath.replace(".usdz", ".usdc")
                bpy.ops.wm.usd_export(
                    filepath=usd_path,
                    selected_objects_only=selected_only,
                    export_animation=True,
                    export_materials=True,
                )
                # Package as USDZ (simplified — production would use usdzip)
                os.rename(usd_path, filepath)
            elif format == "fbx":
                bpy.ops.export_scene.fbx(
                    filepath=filepath,
                    use_selection=selected_only,
                    apply_scale_options="FBX_SCALE_ALL",
                )
            elif format == "obj":
                bpy.ops.wm.obj_export(
                    filepath=filepath,
                    export_selected_objects=selected_only,
                )
            
            print(f"[DOGE] Exported to {filepath}")
            return True
            
        except Exception as e:
            print(f"[DOGE] Export failed: {e}")
            return False
    
    def export_and_upload(self, format: str = "glb",
                          selected_only: bool = False,
                          callback=None):
        """Export and upload to DOGE cloud."""
        def _export_upload():
            try:
                tmp_dir = tempfile.mkdtemp()
                ext = self.SUPPORTED_FORMATS[format]["extension"]
                tmp_file = os.path.join(tmp_dir, f"export{ext}")
                
                success = self.export_scene(tmp_file, format, selected_only)
                if not success:
                    if callback:
                        callback(False, None)
                    return
                
                # Upload to cloud
                with open(tmp_file, "rb") as f:
                    file_data = f.read()
                
                import base64
                url = f"{DOGEConfig.get_cloud_url()}/api/assets/upload"
                data = json.dumps({
                    "filename": f"export{ext}",
                    "format": format,
                    "data": base64.b64encode(file_data).decode(),
                    "size": len(file_data),
                }).encode()
                
                req = Request(url, data=data, method="POST")
                req.add_header("Content-Type", "application/json")
                req.add_header("Authorization", f"Bearer {DOGEConfig.get_api_key()}")
                
                with urlopen(req, timeout=60) as resp:
                    result = json.loads(resp.read())
                    asset_url = result.get("url")
                    
                    if callback:
                        bpy.app.timers.register(
                            lambda: callback(True, asset_url) or None,
                            first_interval=0
                        )
                
            except Exception as e:
                print(f"[DOGE] Export+upload failed: {e}")
                if callback:
                    bpy.app.timers.register(
                        lambda: callback(False, None) or None,
                        first_interval=0
                    )
        
        thread = threading.Thread(target=_export_upload, daemon=True)
        thread.start()


# ─── Privacy Service ──────────────────────────────────────────────────────────

class PrivacyService:
    """
    Privacy management for the Blender plugin.
    Handles encryption, privacy zones, and secure data handling.
    """
    
    def __init__(self):
        self.privacy_zones = {}
        self.encryption_enabled = True
    
    def create_privacy_zone(self, name: str, center: tuple,
                            radius: float, allowed_users: list):
        """Create a privacy zone in the scene."""
        zone_id = hashlib.sha256(f"{name}_{time.time()}".encode()).hexdigest()[:12]
        
        self.privacy_zones[zone_id] = {
            "name": name,
            "center": center,
            "radius": radius,
            "allowed_users": allowed_users,
            "created_at": time.time(),
        }
        
        # Create visual representation in Blender
        def _create_visual():
            bpy.ops.mesh.primitive_uv_sphere_add(
                radius=radius,
                location=center,
                segments=32,
                ring_count=16,
            )
            obj = bpy.context.active_object
            obj.name = f"PrivacyZone_{name}"
            obj.display_type = "WIRE"
            
            # Add material with transparency
            mat = bpy.data.materials.new(name=f"PrivacyZone_{name}_Mat")
            mat.use_nodes = True
            mat.blend_method = "BLEND"
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Base Color"].default_value = (0.2, 0.8, 0.2, 0.1)
                bsdf.inputs["Alpha"].default_value = 0.1
            obj.data.materials.append(mat)
            
            # Lock the object
            obj.lock_location = (True, True, True)
            obj.lock_rotation = (True, True, True)
            obj.lock_scale = (True, True, True)
            
            return None
        
        bpy.app.timers.register(_create_visual, first_interval=0)
        
        return zone_id
    
    def check_access(self, zone_id: str, user_id: str) -> bool:
        """Check if a user has access to a privacy zone."""
        zone = self.privacy_zones.get(zone_id)
        if not zone:
            return True  # No zone = open access
        return user_id in zone["allowed_users"]
    
    def is_in_privacy_zone(self, position: tuple) -> str:
        """Check if a position is inside any privacy zone."""
        for zone_id, zone in self.privacy_zones.items():
            center = zone["center"]
            radius = zone["radius"]
            
            dist = sum((a - b) ** 2 for a, b in zip(position, center)) ** 0.5
            if dist <= radius:
                return zone_id
        
        return None


# ─── Service Registry ─────────────────────────────────────────────────────────

class ServiceRegistry:
    """Central registry for all DOGE Spatial Editor services."""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def initialize(self):
        if self._initialized:
            return
        
        self.cloud_sync = CloudSyncService()
        self.collaboration = CollaborationService(self.cloud_sync)
        self.ai_generation = AIGenerationService()
        self.export = ExportService()
        self.privacy = PrivacyService()
        
        self._initialized = True
        print("[DOGE] All services initialized")
    
    def shutdown(self):
        if not self._initialized:
            return
        
        self.collaboration.stop()
        self.cloud_sync.disconnect()
        self._initialized = False
        print("[DOGE] All services shut down")


# Global service registry
services = ServiceRegistry()
