# __init__.py
# DOGE Spatial Explorer — Blender Addon
#
# Blender plugin for bidirectional sync with the DOGE Spatial Explorer
# cloud backend. Enables professional 3D artists to:
# - Import/export scenes from spatial editing sessions
# - Real-time collaborative editing with visionOS and Meta Quest users
# - Push/pull assets, materials, and animations
# - Live preview of spatial edits in Blender viewport
# - Cloud rendering and asset processing
#
# Compatible with Blender 4.0+ on Windows, macOS, and Linux.
# Also supports Blender Cloud and headless rendering pipelines.

bl_info = {
    "name": "DOGE Spatial Explorer",
    "author": "DOGE Spatial Team",
    "version": (1, 0, 0),
    "blender": (4, 0, 0),
    "location": "View3D > Sidebar > DOGE Spatial",
    "description": "Cross-platform spatial editing bridge for visionOS, Meta Quest, and cloud collaboration",
    "category": "3D View",
    "doc_url": "https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer",
    "tracker_url": "https://github.com/JacksonJoshuab/DOGE-Spatial-Explorer/issues",
}

import bpy
from bpy.props import (
    StringProperty,
    BoolProperty,
    IntProperty,
    FloatProperty,
    EnumProperty,
    PointerProperty,
)

# ── Addon Preferences ────────────────────────────────────────────────────

class DOGESpatialPreferences(bpy.types.AddonPreferences):
    """Addon preferences for cloud connection and authentication."""

    bl_idname = __name__

    cloud_url: StringProperty(
        name="Cloud URL",
        description="DOGE Spatial Explorer cloud backend URL",
        default="https://api.doge-spatial.example.com",
    )

    auth_token: StringProperty(
        name="Auth Token",
        description="Authentication token for cloud access",
        default="",
        subtype='PASSWORD',
    )

    auto_sync: BoolProperty(
        name="Auto Sync",
        description="Automatically sync changes to the cloud",
        default=True,
    )

    sync_interval: FloatProperty(
        name="Sync Interval (seconds)",
        description="How often to sync with the cloud",
        default=5.0,
        min=1.0,
        max=60.0,
    )

    export_format: EnumProperty(
        name="Export Format",
        description="Default format for exporting to spatial devices",
        items=[
            ('USDZ', 'USDZ', 'Apple Universal Scene Description (visionOS)'),
            ('GLB', 'glTF Binary', 'glTF 2.0 Binary (Meta Quest / Web)'),
            ('USD', 'USD', 'Universal Scene Description (Universal)'),
            ('FBX', 'FBX', 'Autodesk FBX (Legacy)'),
        ],
        default='USDZ',
    )

    def draw(self, context):
        layout = self.layout

        box = layout.box()
        box.label(text="Cloud Connection", icon='WORLD')
        box.prop(self, "cloud_url")
        box.prop(self, "auth_token")

        box = layout.box()
        box.label(text="Sync Settings", icon='FILE_REFRESH')
        box.prop(self, "auto_sync")
        box.prop(self, "sync_interval")
        box.prop(self, "export_format")


# ── Scene Properties ─────────────────────────────────────────────────────

class DOGESpatialSceneProperties(bpy.types.PropertyGroup):
    """Per-scene properties for DOGE Spatial integration."""

    document_id: StringProperty(
        name="Document ID",
        description="Cloud document ID for this scene",
        default="",
    )

    document_name: StringProperty(
        name="Document Name",
        description="Name of the spatial document",
        default="",
    )

    is_connected: BoolProperty(
        name="Connected",
        description="Whether this scene is connected to the cloud",
        default=False,
    )

    privacy_level: EnumProperty(
        name="Privacy Level",
        items=[
            ('PRIVATE', 'Private', 'Only you can access'),
            ('TEAM', 'Team', 'Team members can access'),
            ('ORGANIZATION', 'Organization', 'Organization members can access'),
            ('PUBLIC', 'Public', 'Anyone with the link can access'),
        ],
        default='PRIVATE',
    )

    collaborator_count: IntProperty(
        name="Collaborators",
        default=0,
    )

    last_sync_time: StringProperty(
        name="Last Sync",
        default="Never",
    )


# ── Registration ─────────────────────────────────────────────────────────

# Import submodules
from . import operators
from . import panels

# All classes to register
classes = [
    DOGESpatialPreferences,
    DOGESpatialSceneProperties,
]


def register():
    """Register the addon classes and submodules."""
    for cls in classes:
        bpy.utils.register_class(cls)

    # Register scene properties
    bpy.types.Scene.doge_spatial = PointerProperty(type=DOGESpatialSceneProperties)

    # Register submodules
    operators.register()
    panels.register()

    print("[DOGE Spatial] Addon registered successfully")


def unregister():
    """Unregister the addon classes and submodules."""
    panels.unregister()
    operators.unregister()

    del bpy.types.Scene.doge_spatial

    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)

    print("[DOGE Spatial] Addon unregistered")


if __name__ == "__main__":
    register()
