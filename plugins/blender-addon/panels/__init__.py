# panels/__init__.py
# DOGE Spatial Explorer — Blender UI Panels
#
# Sidebar panels for the 3D viewport providing cloud connection,
# scene sync, collaboration status, export tools, and AI generation.

import bpy


# ── Main Panel ───────────────────────────────────────────────────────────

class DOGE_PT_main_panel(bpy.types.Panel):
    """DOGE Spatial Explorer main panel"""

    bl_label = "DOGE Spatial Explorer"
    bl_idname = "DOGE_PT_main_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "DOGE Spatial"

    def draw(self, context):
        layout = self.layout
        scene_props = context.scene.doge_spatial

        # Connection status
        box = layout.box()
        row = box.row()
        if scene_props.is_connected:
            row.label(text="Connected", icon='CHECKMARK')
            row.operator("doge_spatial.disconnect_cloud", text="", icon='X')
        else:
            row.label(text="Disconnected", icon='ERROR')
            row.operator("doge_spatial.connect_cloud", text="Connect", icon='WORLD')

        if scene_props.is_connected:
            col = box.column(align=True)
            col.label(text=f"Document: {scene_props.document_name or 'None'}")
            col.label(text=f"Privacy: {scene_props.privacy_level}")
            col.label(text=f"Collaborators: {scene_props.collaborator_count}")
            col.label(text=f"Last Sync: {scene_props.last_sync_time}")


# ── Sync Panel ───────────────────────────────────────────────────────────

class DOGE_PT_sync_panel(bpy.types.Panel):
    """Scene synchronization controls"""

    bl_label = "Scene Sync"
    bl_idname = "DOGE_PT_sync_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "DOGE Spatial"
    bl_parent_id = "DOGE_PT_main_panel"
    bl_options = {'DEFAULT_CLOSED'}

    def draw(self, context):
        layout = self.layout
        scene_props = context.scene.doge_spatial

        col = layout.column(align=True)
        row = col.row(align=True)
        row.operator("doge_spatial.push_scene", text="Push", icon='EXPORT')
        row.operator("doge_spatial.pull_scene", text="Pull", icon='IMPORT')

        col.separator()

        row = col.row(align=True)
        row.operator("doge_spatial.start_live_sync", text="Start Live Sync", icon='PLAY')
        row.operator("doge_spatial.stop_live_sync", text="", icon='PAUSE')

        col.separator()
        col.prop(scene_props, "document_id")
        col.prop(scene_props, "document_name")
        col.prop(scene_props, "privacy_level")


# ── Export Panel ─────────────────────────────────────────────────────────

class DOGE_PT_export_panel(bpy.types.Panel):
    """Export tools for spatial platforms"""

    bl_label = "Export"
    bl_idname = "DOGE_PT_export_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "DOGE Spatial"
    bl_parent_id = "DOGE_PT_main_panel"
    bl_options = {'DEFAULT_CLOSED'}

    def draw(self, context):
        layout = self.layout

        col = layout.column(align=True)
        col.label(text="Platform Export:", icon='EXPORT')
        col.operator("doge_spatial.export_usdz", text="Export USDZ (visionOS)", icon='FILE')
        col.operator("doge_spatial.export_glb", text="Export GLB (Meta Quest)", icon='FILE')

        col.separator()
        col.label(text="Quick Export:", icon='PACKAGE')

        row = col.row(align=True)
        row.label(text="visionOS", icon='HIDE_OFF')
        row.label(text="Meta Quest", icon='HIDE_OFF')
        row.label(text="Web", icon='WORLD')


# ── AI Generation Panel ─────────────────────────────────────────────────

class DOGE_PT_ai_panel(bpy.types.Panel):
    """AI-powered generation tools"""

    bl_label = "AI Generation"
    bl_idname = "DOGE_PT_ai_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "DOGE Spatial"
    bl_parent_id = "DOGE_PT_main_panel"
    bl_options = {'DEFAULT_CLOSED'}

    def draw(self, context):
        layout = self.layout

        col = layout.column(align=True)
        col.label(text="Text-to-3D:", icon='MESH_MONKEY')
        col.operator("doge_spatial.ai_generate_model", text="Generate 3D Model", icon='ADD')

        col.separator()
        col.label(text="Text-to-Texture:", icon='TEXTURE')
        col.operator("doge_spatial.ai_generate_texture", text="Generate PBR Textures", icon='ADD')

        col.separator()
        col.label(text="Capabilities:", icon='INFO')
        box = col.box()
        box.label(text="• Text-to-3D Model Generation")
        box.label(text="• Text-to-PBR Texture Generation")
        box.label(text="• Image-to-3D Reconstruction")
        box.label(text="• Audio-to-Scene Visualization")
        box.label(text="• RF/IoT Spatial Mapping")


# ── Collaboration Panel ──────────────────────────────────────────────────

class DOGE_PT_collab_panel(bpy.types.Panel):
    """Collaboration status and controls"""

    bl_label = "Collaboration"
    bl_idname = "DOGE_PT_collab_panel"
    bl_space_type = 'VIEW_3D'
    bl_region_type = 'UI'
    bl_category = "DOGE Spatial"
    bl_parent_id = "DOGE_PT_main_panel"
    bl_options = {'DEFAULT_CLOSED'}

    def draw(self, context):
        layout = self.layout
        scene_props = context.scene.doge_spatial

        col = layout.column(align=True)

        if scene_props.is_connected:
            col.label(text=f"Collaborators: {scene_props.collaborator_count}", icon='COMMUNITY')

            box = col.box()
            box.label(text="Connected Platforms:")
            row = box.row()
            row.label(text="visionOS", icon='HIDE_OFF')
            row.label(text="Meta Quest", icon='HIDE_OFF')
            row.label(text="iPad", icon='HIDE_OFF')

            col.separator()
            col.label(text="Privacy:", icon='LOCKED')
            col.prop(scene_props, "privacy_level", text="")
        else:
            col.label(text="Connect to cloud to see collaborators", icon='INFO')


# ── Registration ─────────────────────────────────────────────────────────

classes = [
    DOGE_PT_main_panel,
    DOGE_PT_sync_panel,
    DOGE_PT_export_panel,
    DOGE_PT_ai_panel,
    DOGE_PT_collab_panel,
]


def register():
    for cls in classes:
        bpy.utils.register_class(cls)


def unregister():
    for cls in reversed(classes):
        bpy.utils.unregister_class(cls)
