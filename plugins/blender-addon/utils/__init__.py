"""
DOGE Spatial Editor — Blender Plugin Utilities
Scene graph conversion, coordinate system transforms, and format helpers.
"""

import bpy
import json
import math
import hashlib
import time
from mathutils import Vector, Euler, Quaternion, Matrix


# ─── Coordinate System Conversion ─────────────────────────────────────────────

class CoordinateConverter:
    """
    Convert between Blender's Z-up right-handed coordinate system
    and other platform coordinate systems.
    
    Blender: Z-up, right-handed (X-right, Y-forward, Z-up)
    visionOS/RealityKit: Y-up, right-handed (X-right, Y-up, Z-backward)
    Meta Quest/OpenXR: Y-up, right-handed (X-right, Y-up, Z-backward)
    USD: Y-up, right-handed
    glTF: Y-up, right-handed
    """
    
    # Blender Z-up → Y-up (for visionOS, Meta, USD, glTF)
    Z_UP_TO_Y_UP = Matrix((
        (1, 0, 0, 0),
        (0, 0, 1, 0),
        (0, -1, 0, 0),
        (0, 0, 0, 1),
    ))
    
    # Y-up → Blender Z-up (from visionOS, Meta, USD, glTF)
    Y_UP_TO_Z_UP = Matrix((
        (1, 0, 0, 0),
        (0, 0, -1, 0),
        (0, 1, 0, 0),
        (0, 0, 0, 1),
    ))
    
    @staticmethod
    def blender_to_visionos(position: Vector) -> tuple:
        """Convert Blender position to visionOS coordinate system."""
        return (position.x, position.z, -position.y)
    
    @staticmethod
    def visionos_to_blender(position: tuple) -> Vector:
        """Convert visionOS position to Blender coordinate system."""
        return Vector((position[0], -position[2], position[1]))
    
    @staticmethod
    def blender_to_meta(position: Vector) -> tuple:
        """Convert Blender position to Meta Quest coordinate system."""
        # Meta Quest uses the same Y-up system as visionOS
        return (position.x, position.z, -position.y)
    
    @staticmethod
    def meta_to_blender(position: tuple) -> Vector:
        """Convert Meta Quest position to Blender coordinate system."""
        return Vector((position[0], -position[2], position[1]))
    
    @staticmethod
    def blender_rotation_to_yup(euler: Euler) -> tuple:
        """Convert Blender Euler rotation to Y-up quaternion."""
        quat = euler.to_quaternion()
        # Apply Z-up to Y-up rotation
        converted = Quaternion((quat.w, quat.x, quat.z, -quat.y))
        return (converted.x, converted.y, converted.z, converted.w)
    
    @staticmethod
    def yup_rotation_to_blender(quat_tuple: tuple) -> Euler:
        """Convert Y-up quaternion to Blender Euler rotation."""
        quat = Quaternion((quat_tuple[3], quat_tuple[0], -quat_tuple[2], quat_tuple[1]))
        return quat.to_euler()
    
    @staticmethod
    def blender_scale_to_universal(scale: Vector) -> tuple:
        """Convert Blender scale (scale is same in all systems)."""
        return (scale.x, scale.z, scale.y)
    
    @staticmethod
    def universal_scale_to_blender(scale: tuple) -> Vector:
        """Convert universal scale to Blender."""
        return Vector((scale[0], scale[2], scale[1]))


# ─── Scene Graph Serializer ───────────────────────────────────────────────────

class SceneGraphSerializer:
    """
    Serialize Blender scene graph to the DOGE Spatial Editor universal format.
    This format is shared across visionOS, Meta Quest, web, and cloud.
    """
    
    @staticmethod
    def serialize_scene(target_platform: str = "universal") -> dict:
        """Serialize the entire Blender scene to DOGE format."""
        scene = bpy.context.scene
        
        scene_data = {
            "format_version": "2.0",
            "generator": "blender_plugin",
            "blender_version": bpy.app.version_string,
            "timestamp": time.time(),
            "scene": {
                "name": scene.name,
                "frame_start": scene.frame_start,
                "frame_end": scene.frame_end,
                "frame_current": scene.frame_current,
                "fps": scene.render.fps,
                "world": SceneGraphSerializer._serialize_world(scene),
            },
            "nodes": [],
            "materials": [],
            "lights": [],
            "cameras": [],
        }
        
        # Serialize all objects
        for obj in scene.objects:
            node = SceneGraphSerializer._serialize_object(obj, target_platform)
            if node:
                scene_data["nodes"].append(node)
        
        # Serialize materials
        for mat in bpy.data.materials:
            mat_data = SceneGraphSerializer._serialize_material(mat)
            if mat_data:
                scene_data["materials"].append(mat_data)
        
        return scene_data
    
    @staticmethod
    def _serialize_object(obj, platform: str) -> dict:
        """Serialize a single Blender object."""
        converter = CoordinateConverter()
        
        # Convert position based on target platform
        if platform in ("visionos", "universal"):
            position = converter.blender_to_visionos(obj.location)
            rotation = converter.blender_rotation_to_yup(obj.rotation_euler)
            scale = converter.blender_scale_to_universal(obj.scale)
        elif platform == "meta":
            position = converter.blender_to_meta(obj.location)
            rotation = converter.blender_rotation_to_yup(obj.rotation_euler)
            scale = converter.blender_scale_to_universal(obj.scale)
        else:
            position = tuple(obj.location)
            rotation = tuple(obj.rotation_euler)
            scale = tuple(obj.scale)
        
        node = {
            "id": SceneGraphSerializer._generate_node_id(obj),
            "name": obj.name,
            "type": SceneGraphSerializer._map_object_type(obj),
            "transform": {
                "position": list(position),
                "rotation": list(rotation),
                "scale": list(scale),
            },
            "visible": not obj.hide_viewport,
            "parent": obj.parent.name if obj.parent else None,
            "children": [child.name for child in obj.children],
        }
        
        # Add mesh data reference
        if obj.type == "MESH" and obj.data:
            mesh = obj.data
            node["mesh"] = {
                "vertex_count": len(mesh.vertices),
                "polygon_count": len(mesh.polygons),
                "edge_count": len(mesh.edges),
                "has_uv": len(mesh.uv_layers) > 0,
                "has_vertex_colors": len(mesh.color_attributes) > 0,
            }
        
        # Add material references
        if obj.data and hasattr(obj.data, "materials"):
            node["materials"] = [
                mat.name for mat in obj.data.materials if mat
            ]
        
        # Add light data
        if obj.type == "LIGHT":
            light = obj.data
            node["light"] = {
                "type": light.type.lower(),
                "color": list(light.color),
                "energy": light.energy,
                "shadow": light.use_shadow,
            }
        
        # Add camera data
        if obj.type == "CAMERA":
            cam = obj.data
            node["camera"] = {
                "type": cam.type.lower(),
                "focal_length": cam.lens,
                "sensor_width": cam.sensor_width,
                "clip_start": cam.clip_start,
                "clip_end": cam.clip_end,
            }
        
        # Add custom properties
        custom_props = {}
        for key in obj.keys():
            if key.startswith("_"):
                continue
            try:
                val = obj[key]
                if isinstance(val, (int, float, str, bool)):
                    custom_props[key] = val
            except Exception:
                pass
        
        if custom_props:
            node["custom_properties"] = custom_props
        
        return node
    
    @staticmethod
    def _serialize_material(mat) -> dict:
        """Serialize a Blender material."""
        if not mat:
            return None
        
        mat_data = {
            "name": mat.name,
            "use_nodes": mat.use_nodes,
        }
        
        if mat.use_nodes:
            bsdf = mat.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                mat_data["pbr"] = {
                    "base_color": list(bsdf.inputs["Base Color"].default_value),
                    "metallic": bsdf.inputs["Metallic"].default_value,
                    "roughness": bsdf.inputs["Roughness"].default_value,
                    "ior": bsdf.inputs.get("IOR", type("", (), {"default_value": 1.45})).default_value,
                    "alpha": bsdf.inputs["Alpha"].default_value,
                }
                
                # Check for texture maps
                textures = {}
                for link in mat.node_tree.links:
                    if link.to_node == bsdf and link.from_node.type == "TEX_IMAGE":
                        input_name = link.to_socket.name
                        img = link.from_node.image
                        if img:
                            textures[input_name.lower().replace(" ", "_")] = {
                                "name": img.name,
                                "filepath": img.filepath,
                                "size": list(img.size),
                            }
                
                if textures:
                    mat_data["textures"] = textures
        
        return mat_data
    
    @staticmethod
    def _serialize_world(scene) -> dict:
        """Serialize world/environment settings."""
        world_data = {}
        
        if scene.world:
            world = scene.world
            world_data["name"] = world.name
            
            if world.use_nodes:
                bg_node = world.node_tree.nodes.get("Background")
                if bg_node:
                    world_data["background_color"] = list(bg_node.inputs["Color"].default_value)
                    world_data["background_strength"] = bg_node.inputs["Strength"].default_value
        
        return world_data
    
    @staticmethod
    def _generate_node_id(obj) -> str:
        """Generate a stable unique ID for a Blender object."""
        raw = f"{obj.name}_{obj.type}_{id(obj)}"
        return hashlib.md5(raw.encode()).hexdigest()[:16]
    
    @staticmethod
    def _map_object_type(obj) -> str:
        """Map Blender object type to DOGE universal type."""
        type_map = {
            "MESH": "mesh",
            "CURVE": "curve",
            "SURFACE": "surface",
            "META": "metaball",
            "FONT": "text",
            "ARMATURE": "skeleton",
            "LATTICE": "lattice",
            "EMPTY": "group",
            "GPENCIL": "grease_pencil",
            "CAMERA": "camera",
            "LIGHT": "light",
            "SPEAKER": "audio_source",
            "LIGHT_PROBE": "light_probe",
            "VOLUME": "volume",
        }
        return type_map.get(obj.type, "unknown")
    
    @staticmethod
    def deserialize_node(node_data: dict, platform: str = "universal"):
        """Create a Blender object from DOGE node data."""
        converter = CoordinateConverter()
        
        # Convert position from target platform to Blender
        pos = node_data["transform"]["position"]
        rot = node_data["transform"].get("rotation", [0, 0, 0, 1])
        scl = node_data["transform"]["scale"]
        
        if platform in ("visionos", "universal", "meta"):
            blender_pos = converter.visionos_to_blender(pos)
            blender_rot = converter.yup_rotation_to_blender(rot)
            blender_scl = converter.universal_scale_to_blender(scl)
        else:
            blender_pos = Vector(pos)
            blender_rot = Euler(rot[:3])
            blender_scl = Vector(scl)
        
        node_type = node_data.get("type", "mesh")
        name = node_data.get("name", "Imported Node")
        
        # Create object based on type
        if node_type == "mesh":
            bpy.ops.mesh.primitive_cube_add(location=blender_pos)
        elif node_type == "group":
            bpy.ops.object.empty_add(location=blender_pos)
        elif node_type == "light":
            light_type = node_data.get("light", {}).get("type", "point").upper()
            bpy.ops.object.light_add(type=light_type, location=blender_pos)
        elif node_type == "camera":
            bpy.ops.object.camera_add(location=blender_pos)
        else:
            bpy.ops.mesh.primitive_cube_add(location=blender_pos)
        
        obj = bpy.context.active_object
        if obj:
            obj.name = name
            obj.rotation_euler = blender_rot
            obj.scale = blender_scl
            
            # Apply material if provided
            materials = node_data.get("materials", [])
            if materials and "pbr" in node_data.get("material_data", {}):
                pbr = node_data["material_data"]["pbr"]
                mat = bpy.data.materials.new(name=f"{name}_Material")
                mat.use_nodes = True
                bsdf = mat.node_tree.nodes.get("Principled BSDF")
                if bsdf:
                    bsdf.inputs["Base Color"].default_value = pbr.get("base_color", [0.8, 0.8, 0.8, 1.0])
                    bsdf.inputs["Metallic"].default_value = pbr.get("metallic", 0.0)
                    bsdf.inputs["Roughness"].default_value = pbr.get("roughness", 0.5)
                obj.data.materials.append(mat)
        
        return obj


# ─── Diff Engine ──────────────────────────────────────────────────────────────

class SceneDiffEngine:
    """
    Compute diffs between scene states for efficient sync.
    Only changed properties are transmitted over the network.
    """
    
    def __init__(self):
        self._last_snapshot = {}
    
    def compute_diff(self) -> list:
        """Compute diff between current scene and last snapshot."""
        current = self._take_snapshot()
        operations = []
        
        # Find new objects
        for name, data in current.items():
            if name not in self._last_snapshot:
                operations.append({
                    "type": "node_create",
                    "node_id": name,
                    "payload": data,
                })
        
        # Find deleted objects
        for name in self._last_snapshot:
            if name not in current:
                operations.append({
                    "type": "node_delete",
                    "node_id": name,
                    "payload": {},
                })
        
        # Find modified objects
        for name, data in current.items():
            if name in self._last_snapshot:
                old_data = self._last_snapshot[name]
                
                # Check transform changes
                if data.get("position") != old_data.get("position") or \
                   data.get("rotation") != old_data.get("rotation") or \
                   data.get("scale") != old_data.get("scale"):
                    operations.append({
                        "type": "transform_update",
                        "node_id": name,
                        "payload": {
                            "position": data.get("position"),
                            "rotation": data.get("rotation"),
                            "scale": data.get("scale"),
                        },
                    })
                
                # Check visibility changes
                if data.get("visible") != old_data.get("visible"):
                    operations.append({
                        "type": "visibility_toggle",
                        "node_id": name,
                        "payload": {"hidden": not data.get("visible", True)},
                    })
        
        self._last_snapshot = current
        return operations
    
    def _take_snapshot(self) -> dict:
        """Take a snapshot of the current scene state."""
        snapshot = {}
        for obj in bpy.context.scene.objects:
            snapshot[obj.name] = {
                "position": list(obj.location),
                "rotation": list(obj.rotation_euler),
                "scale": list(obj.scale),
                "visible": not obj.hide_viewport,
                "type": obj.type,
            }
        return snapshot


# ─── Scene Change Watcher ─────────────────────────────────────────────────────

class SceneChangeWatcher:
    """
    Watch for scene changes and push them to the cloud sync service.
    Uses Blender's depsgraph update handler.
    """
    
    def __init__(self, cloud_sync_service):
        self.cloud_sync = cloud_sync_service
        self.diff_engine = SceneDiffEngine()
        self._handler_registered = False
    
    def start_watching(self):
        """Start watching for scene changes."""
        if self._handler_registered:
            return
        
        bpy.app.handlers.depsgraph_update_post.append(self._on_depsgraph_update)
        self._handler_registered = True
        print("[DOGE] Scene change watcher started")
    
    def stop_watching(self):
        """Stop watching for scene changes."""
        if not self._handler_registered:
            return
        
        if self._on_depsgraph_update in bpy.app.handlers.depsgraph_update_post:
            bpy.app.handlers.depsgraph_update_post.remove(self._on_depsgraph_update)
        
        self._handler_registered = False
        print("[DOGE] Scene change watcher stopped")
    
    def _on_depsgraph_update(self, scene, depsgraph):
        """Handler called when the dependency graph is updated."""
        if not self.cloud_sync.is_connected:
            return
        
        # Compute diff
        operations = self.diff_engine.compute_diff()
        
        # Push operations to cloud
        for op in operations:
            self.cloud_sync.push_operation(op)


# ─── Format Helpers ───────────────────────────────────────────────────────────

def get_scene_stats() -> dict:
    """Get statistics about the current Blender scene."""
    scene = bpy.context.scene
    
    total_verts = 0
    total_faces = 0
    total_edges = 0
    mesh_count = 0
    light_count = 0
    camera_count = 0
    
    for obj in scene.objects:
        if obj.type == "MESH" and obj.data:
            total_verts += len(obj.data.vertices)
            total_faces += len(obj.data.polygons)
            total_edges += len(obj.data.edges)
            mesh_count += 1
        elif obj.type == "LIGHT":
            light_count += 1
        elif obj.type == "CAMERA":
            camera_count += 1
    
    return {
        "object_count": len(scene.objects),
        "mesh_count": mesh_count,
        "light_count": light_count,
        "camera_count": camera_count,
        "total_vertices": total_verts,
        "total_faces": total_faces,
        "total_edges": total_edges,
        "material_count": len(bpy.data.materials),
        "texture_count": len(bpy.data.images),
        "frame_range": (scene.frame_start, scene.frame_end),
        "fps": scene.render.fps,
        "render_engine": scene.render.engine,
    }


def validate_scene_for_export(target: str = "visionos") -> list:
    """Validate scene for export to target platform."""
    issues = []
    
    for obj in bpy.context.scene.objects:
        if obj.type == "MESH" and obj.data:
            mesh = obj.data
            
            # Check for ngons (visionOS prefers triangulated meshes)
            if target == "visionos":
                for poly in mesh.polygons:
                    if poly.loop_total > 4:
                        issues.append({
                            "severity": "warning",
                            "object": obj.name,
                            "message": f"N-gon detected ({poly.loop_total} vertices). Consider triangulating for visionOS.",
                        })
                        break
            
            # Check for missing UVs
            if not mesh.uv_layers:
                issues.append({
                    "severity": "warning",
                    "object": obj.name,
                    "message": "No UV map found. Textures may not display correctly.",
                })
            
            # Check for negative scale
            if any(s < 0 for s in obj.scale):
                issues.append({
                    "severity": "error",
                    "object": obj.name,
                    "message": "Negative scale detected. Apply scale before export.",
                })
            
            # Check vertex count
            if len(mesh.vertices) > 100000:
                issues.append({
                    "severity": "warning",
                    "object": obj.name,
                    "message": f"High vertex count ({len(mesh.vertices)}). Consider decimation for mobile XR.",
                })
        
        # Check for unsupported modifiers
        if target in ("visionos", "meta"):
            for mod in obj.modifiers:
                if mod.type in ("FLUID", "CLOTH", "SOFT_BODY", "DYNAMIC_PAINT"):
                    issues.append({
                        "severity": "info",
                        "object": obj.name,
                        "message": f"Simulation modifier '{mod.name}' will be baked on export.",
                    })
    
    return issues
