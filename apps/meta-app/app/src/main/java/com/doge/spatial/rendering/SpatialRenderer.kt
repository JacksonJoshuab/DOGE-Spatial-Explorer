// SpatialRenderer.kt
// DOGE Spatial Editor — Meta Quest
// OpenXR-based spatial rendering engine with passthrough and Gaussian splat support

package com.doge.spatial.rendering

import android.opengl.GLES30
import android.opengl.Matrix
import java.nio.ByteBuffer
import java.nio.ByteOrder
import java.nio.FloatBuffer
import java.nio.ShortBuffer

/**
 * SpatialRenderer — Core rendering engine for Meta Quest spatial editing.
 * Supports passthrough mixed reality, Gaussian splatting, volumetric rendering,
 * and real-time collaboration overlays.
 */
class SpatialRenderer {

    // ── Shader Programs ──────────────────────────────────────────────────────

    private var gridShaderProgram: Int = 0
    private var entityShaderProgram: Int = 0
    private var gaussianSplatProgram: Int = 0
    private var collaborationOverlayProgram: Int = 0
    private var privacyZoneProgram: Int = 0

    // ── Matrices ─────────────────────────────────────────────────────────────

    private val modelMatrix = FloatArray(16)
    private val viewMatrix = FloatArray(16)
    private val projectionMatrix = FloatArray(16)
    private val mvpMatrix = FloatArray(16)

    // ── Scene State ──────────────────────────────────────────────────────────

    private val entities = mutableListOf<RenderableEntity>()
    private val collaboratorCursors = mutableListOf<CollaboratorCursor>()
    private val privacyZones = mutableListOf<PrivacyZone>()
    private val spatialAnnotations = mutableListOf<SpatialAnnotation>()

    // ── Grid Geometry ────────────────────────────────────────────────────────

    private var gridVertexBuffer: FloatBuffer? = null
    private var gridVertexCount: Int = 0

    // ── Initialization ───────────────────────────────────────────────────────

    fun initialize() {
        // Compile shader programs
        gridShaderProgram = createShaderProgram(GRID_VERTEX_SHADER, GRID_FRAGMENT_SHADER)
        entityShaderProgram = createShaderProgram(ENTITY_VERTEX_SHADER, ENTITY_FRAGMENT_SHADER)
        gaussianSplatProgram = createShaderProgram(GAUSSIAN_SPLAT_VERTEX_SHADER, GAUSSIAN_SPLAT_FRAGMENT_SHADER)
        collaborationOverlayProgram = createShaderProgram(OVERLAY_VERTEX_SHADER, OVERLAY_FRAGMENT_SHADER)
        privacyZoneProgram = createShaderProgram(PRIVACY_ZONE_VERTEX_SHADER, PRIVACY_ZONE_FRAGMENT_SHADER)

        // Generate grid geometry
        generateGrid()

        // Enable depth testing and blending
        GLES30.glEnable(GLES30.GL_DEPTH_TEST)
        GLES30.glEnable(GLES30.GL_BLEND)
        GLES30.glBlendFunc(GLES30.GL_SRC_ALPHA, GLES30.GL_ONE_MINUS_SRC_ALPHA)
    }

    // ── Render Frame ─────────────────────────────────────────────────────────

    fun renderFrame(
        viewMat: FloatArray,
        projMat: FloatArray,
        eyeIndex: Int
    ) {
        System.arraycopy(viewMat, 0, viewMatrix, 0, 16)
        System.arraycopy(projMat, 0, projectionMatrix, 0, 16)

        // Clear
        GLES30.glClearColor(0f, 0f, 0f, 0f) // Transparent for passthrough
        GLES30.glClear(GLES30.GL_COLOR_BUFFER_BIT or GLES30.GL_DEPTH_BUFFER_BIT)

        // 1. Render spatial grid
        renderGrid()

        // 2. Render scene entities
        for (entity in entities) {
            renderEntity(entity)
        }

        // 3. Render privacy zones (translucent boundaries)
        for (zone in privacyZones) {
            renderPrivacyZone(zone)
        }

        // 4. Render collaborator cursors and annotations
        for (cursor in collaboratorCursors) {
            renderCollaboratorCursor(cursor)
        }

        // 5. Render spatial annotations
        for (annotation in spatialAnnotations) {
            renderAnnotation(annotation)
        }
    }

    // ── Grid Rendering ───────────────────────────────────────────────────────

    private fun renderGrid() {
        GLES30.glUseProgram(gridShaderProgram)

        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, viewMatrix, 0, modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, mvpMatrix, 0)

        val mvpHandle = GLES30.glGetUniformLocation(gridShaderProgram, "uMVPMatrix")
        GLES30.glUniformMatrix4fv(mvpHandle, 1, false, mvpMatrix, 0)

        val alphaHandle = GLES30.glGetUniformLocation(gridShaderProgram, "uAlpha")
        GLES30.glUniform1f(alphaHandle, 0.15f)

        val posHandle = GLES30.glGetAttribLocation(gridShaderProgram, "aPosition")
        GLES30.glEnableVertexAttribArray(posHandle)
        GLES30.glVertexAttribPointer(posHandle, 3, GLES30.GL_FLOAT, false, 0, gridVertexBuffer)

        GLES30.glDrawArrays(GLES30.GL_LINES, 0, gridVertexCount)
        GLES30.glDisableVertexAttribArray(posHandle)
    }

    // ── Entity Rendering ─────────────────────────────────────────────────────

    private fun renderEntity(entity: RenderableEntity) {
        GLES30.glUseProgram(entityShaderProgram)

        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.translateM(modelMatrix, 0, entity.position[0], entity.position[1], entity.position[2])
        Matrix.scaleM(modelMatrix, 0, entity.scale[0], entity.scale[1], entity.scale[2])

        val tempMatrix = FloatArray(16)
        Matrix.multiplyMM(tempMatrix, 0, viewMatrix, 0, modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, tempMatrix, 0)

        val mvpHandle = GLES30.glGetUniformLocation(entityShaderProgram, "uMVPMatrix")
        GLES30.glUniformMatrix4fv(mvpHandle, 1, false, mvpMatrix, 0)

        val colorHandle = GLES30.glGetUniformLocation(entityShaderProgram, "uColor")
        GLES30.glUniform4fv(colorHandle, 1, entity.color, 0)

        // Selection highlight
        val selectedHandle = GLES30.glGetUniformLocation(entityShaderProgram, "uSelected")
        GLES30.glUniform1i(selectedHandle, if (entity.isSelected) 1 else 0)

        // Editor color (for collaboration)
        if (entity.editorColor != null) {
            val editorColorHandle = GLES30.glGetUniformLocation(entityShaderProgram, "uEditorColor")
            GLES30.glUniform4fv(editorColorHandle, 1, entity.editorColor, 0)
        }

        entity.draw()
    }

    // ── Privacy Zone Rendering ───────────────────────────────────────────────

    private fun renderPrivacyZone(zone: PrivacyZone) {
        GLES30.glUseProgram(privacyZoneProgram)

        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.translateM(modelMatrix, 0, zone.center[0], zone.center[1], zone.center[2])
        Matrix.scaleM(modelMatrix, 0, zone.radius, zone.radius, zone.radius)

        val tempMatrix = FloatArray(16)
        Matrix.multiplyMM(tempMatrix, 0, viewMatrix, 0, modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, tempMatrix, 0)

        val mvpHandle = GLES30.glGetUniformLocation(privacyZoneProgram, "uMVPMatrix")
        GLES30.glUniformMatrix4fv(mvpHandle, 1, false, mvpMatrix, 0)

        val accessHandle = GLES30.glGetUniformLocation(privacyZoneProgram, "uHasAccess")
        GLES30.glUniform1i(accessHandle, if (zone.hasAccess) 1 else 0)

        // Render translucent sphere boundary
        zone.draw()
    }

    // ── Collaborator Cursor Rendering ────────────────────────────────────────

    private fun renderCollaboratorCursor(cursor: CollaboratorCursor) {
        GLES30.glUseProgram(collaborationOverlayProgram)

        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.translateM(modelMatrix, 0, cursor.position[0], cursor.position[1], cursor.position[2])
        Matrix.scaleM(modelMatrix, 0, 0.02f, 0.02f, 0.02f)

        val tempMatrix = FloatArray(16)
        Matrix.multiplyMM(tempMatrix, 0, viewMatrix, 0, modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, tempMatrix, 0)

        val mvpHandle = GLES30.glGetUniformLocation(collaborationOverlayProgram, "uMVPMatrix")
        GLES30.glUniformMatrix4fv(mvpHandle, 1, false, mvpMatrix, 0)

        val colorHandle = GLES30.glGetUniformLocation(collaborationOverlayProgram, "uColor")
        GLES30.glUniform4fv(colorHandle, 1, cursor.color, 0)

        cursor.draw()
    }

    // ── Annotation Rendering ─────────────────────────────────────────────────

    private fun renderAnnotation(annotation: SpatialAnnotation) {
        // Billboard-style annotation rendering
        GLES30.glUseProgram(collaborationOverlayProgram)

        Matrix.setIdentityM(modelMatrix, 0)
        Matrix.translateM(modelMatrix, 0, annotation.position[0], annotation.position[1], annotation.position[2])

        // Billboard: face the camera
        modelMatrix[0] = viewMatrix[0]; modelMatrix[1] = viewMatrix[4]; modelMatrix[2] = viewMatrix[8]
        modelMatrix[4] = viewMatrix[1]; modelMatrix[5] = viewMatrix[5]; modelMatrix[6] = viewMatrix[9]
        modelMatrix[8] = viewMatrix[2]; modelMatrix[9] = viewMatrix[6]; modelMatrix[10] = viewMatrix[10]

        val tempMatrix = FloatArray(16)
        Matrix.multiplyMM(tempMatrix, 0, viewMatrix, 0, modelMatrix, 0)
        Matrix.multiplyMM(mvpMatrix, 0, projectionMatrix, 0, tempMatrix, 0)

        val mvpHandle = GLES30.glGetUniformLocation(collaborationOverlayProgram, "uMVPMatrix")
        GLES30.glUniformMatrix4fv(mvpHandle, 1, false, mvpMatrix, 0)

        annotation.draw()
    }

    // ── Scene Management ─────────────────────────────────────────────────────

    fun addEntity(entity: RenderableEntity) {
        entities.add(entity)
    }

    fun removeEntity(id: String) {
        entities.removeAll { it.id == id }
    }

    fun updateCollaboratorCursors(cursors: List<CollaboratorCursor>) {
        collaboratorCursors.clear()
        collaboratorCursors.addAll(cursors)
    }

    fun updatePrivacyZones(zones: List<PrivacyZone>) {
        privacyZones.clear()
        privacyZones.addAll(zones)
    }

    fun addAnnotation(annotation: SpatialAnnotation) {
        spatialAnnotations.add(annotation)
    }

    // ── Grid Generation ──────────────────────────────────────────────────────

    private fun generateGrid() {
        val gridSize = 10f
        val gridStep = 0.5f
        val lines = mutableListOf<Float>()

        var i = -gridSize
        while (i <= gridSize) {
            // X-axis lines
            lines.addAll(listOf(i, 0f, -gridSize, i, 0f, gridSize))
            // Z-axis lines
            lines.addAll(listOf(-gridSize, 0f, i, gridSize, 0f, i))
            i += gridStep
        }

        gridVertexCount = lines.size / 3
        gridVertexBuffer = ByteBuffer.allocateDirect(lines.size * 4)
            .order(ByteOrder.nativeOrder())
            .asFloatBuffer()
            .put(lines.toFloatArray())
        gridVertexBuffer?.position(0)
    }

    // ── Shader Compilation ───────────────────────────────────────────────────

    private fun createShaderProgram(vertexSource: String, fragmentSource: String): Int {
        val vertexShader = compileShader(GLES30.GL_VERTEX_SHADER, vertexSource)
        val fragmentShader = compileShader(GLES30.GL_FRAGMENT_SHADER, fragmentSource)

        val program = GLES30.glCreateProgram()
        GLES30.glAttachShader(program, vertexShader)
        GLES30.glAttachShader(program, fragmentShader)
        GLES30.glLinkProgram(program)

        GLES30.glDeleteShader(vertexShader)
        GLES30.glDeleteShader(fragmentShader)

        return program
    }

    private fun compileShader(type: Int, source: String): Int {
        val shader = GLES30.glCreateShader(type)
        GLES30.glShaderSource(shader, source)
        GLES30.glCompileShader(shader)
        return shader
    }

    // ── Cleanup ──────────────────────────────────────────────────────────────

    fun destroy() {
        GLES30.glDeleteProgram(gridShaderProgram)
        GLES30.glDeleteProgram(entityShaderProgram)
        GLES30.glDeleteProgram(gaussianSplatProgram)
        GLES30.glDeleteProgram(collaborationOverlayProgram)
        GLES30.glDeleteProgram(privacyZoneProgram)
        entities.clear()
    }

    // ── Shader Sources ───────────────────────────────────────────────────────

    companion object {
        private const val GRID_VERTEX_SHADER = """
            #version 300 es
            uniform mat4 uMVPMatrix;
            in vec3 aPosition;
            void main() {
                gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
            }
        """

        private const val GRID_FRAGMENT_SHADER = """
            #version 300 es
            precision mediump float;
            uniform float uAlpha;
            out vec4 fragColor;
            void main() {
                fragColor = vec4(1.0, 1.0, 1.0, uAlpha);
            }
        """

        private const val ENTITY_VERTEX_SHADER = """
            #version 300 es
            uniform mat4 uMVPMatrix;
            in vec3 aPosition;
            in vec3 aNormal;
            out vec3 vNormal;
            out vec3 vPosition;
            void main() {
                vNormal = aNormal;
                vPosition = aPosition;
                gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
            }
        """

        private const val ENTITY_FRAGMENT_SHADER = """
            #version 300 es
            precision mediump float;
            uniform vec4 uColor;
            uniform int uSelected;
            in vec3 vNormal;
            in vec3 vPosition;
            out vec4 fragColor;
            void main() {
                vec3 lightDir = normalize(vec3(0.5, 1.0, 0.3));
                float diff = max(dot(normalize(vNormal), lightDir), 0.0);
                vec3 ambient = uColor.rgb * 0.3;
                vec3 diffuse = uColor.rgb * diff * 0.7;
                vec3 color = ambient + diffuse;
                if (uSelected == 1) {
                    color = mix(color, vec3(0.3, 0.6, 1.0), 0.3);
                }
                fragColor = vec4(color, uColor.a);
            }
        """

        private const val GAUSSIAN_SPLAT_VERTEX_SHADER = """
            #version 300 es
            uniform mat4 uMVPMatrix;
            uniform mat4 uViewMatrix;
            in vec3 aPosition;
            in vec3 aScale;
            in vec4 aRotation;
            in vec4 aColor;
            in float aOpacity;
            out vec4 vColor;
            out float vOpacity;
            out vec2 vOffset;
            void main() {
                vColor = aColor;
                vOpacity = aOpacity;
                gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
                gl_PointSize = max(1.0, aScale.x * 100.0 / gl_Position.w);
            }
        """

        private const val GAUSSIAN_SPLAT_FRAGMENT_SHADER = """
            #version 300 es
            precision mediump float;
            in vec4 vColor;
            in float vOpacity;
            out vec4 fragColor;
            void main() {
                vec2 coord = gl_PointCoord - vec2(0.5);
                float r2 = dot(coord, coord);
                float alpha = exp(-r2 * 8.0) * vOpacity;
                if (alpha < 0.01) discard;
                fragColor = vec4(vColor.rgb, alpha);
            }
        """

        private const val OVERLAY_VERTEX_SHADER = """
            #version 300 es
            uniform mat4 uMVPMatrix;
            in vec3 aPosition;
            void main() {
                gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
            }
        """

        private const val OVERLAY_FRAGMENT_SHADER = """
            #version 300 es
            precision mediump float;
            uniform vec4 uColor;
            out vec4 fragColor;
            void main() {
                fragColor = uColor;
            }
        """

        private const val PRIVACY_ZONE_VERTEX_SHADER = """
            #version 300 es
            uniform mat4 uMVPMatrix;
            in vec3 aPosition;
            out vec3 vPosition;
            void main() {
                vPosition = aPosition;
                gl_Position = uMVPMatrix * vec4(aPosition, 1.0);
            }
        """

        private const val PRIVACY_ZONE_FRAGMENT_SHADER = """
            #version 300 es
            precision mediump float;
            uniform int uHasAccess;
            in vec3 vPosition;
            out vec4 fragColor;
            void main() {
                float dist = length(vPosition);
                float edge = smoothstep(0.9, 1.0, dist);
                vec3 color;
                float alpha;
                if (uHasAccess == 1) {
                    color = vec3(0.2, 0.8, 0.2);
                    alpha = edge * 0.3;
                } else {
                    color = vec3(0.8, 0.2, 0.2);
                    alpha = edge * 0.5 + 0.1;
                }
                fragColor = vec4(color, alpha);
            }
        """
    }
}

// ── Data Classes ─────────────────────────────────────────────────────────────

data class RenderableEntity(
    val id: String,
    val name: String,
    val position: FloatArray = floatArrayOf(0f, 0f, 0f),
    val rotation: FloatArray = floatArrayOf(0f, 0f, 0f, 1f),
    val scale: FloatArray = floatArrayOf(1f, 1f, 1f),
    val color: FloatArray = floatArrayOf(0.8f, 0.8f, 0.8f, 1f),
    val isSelected: Boolean = false,
    val editorColor: FloatArray? = null,
    val vertexBuffer: FloatBuffer? = null,
    val indexBuffer: ShortBuffer? = null,
    val vertexCount: Int = 0,
    val indexCount: Int = 0
) {
    fun draw() {
        vertexBuffer?.let { vb ->
            val posHandle = GLES30.glGetAttribLocation(0, "aPosition")
            GLES30.glEnableVertexAttribArray(posHandle)
            GLES30.glVertexAttribPointer(posHandle, 3, GLES30.GL_FLOAT, false, 24, vb)

            val normalHandle = GLES30.glGetAttribLocation(0, "aNormal")
            GLES30.glEnableVertexAttribArray(normalHandle)
            vb.position(3)
            GLES30.glVertexAttribPointer(normalHandle, 3, GLES30.GL_FLOAT, false, 24, vb)
            vb.position(0)

            indexBuffer?.let { ib ->
                GLES30.glDrawElements(GLES30.GL_TRIANGLES, indexCount, GLES30.GL_UNSIGNED_SHORT, ib)
            } ?: run {
                GLES30.glDrawArrays(GLES30.GL_TRIANGLES, 0, vertexCount)
            }

            GLES30.glDisableVertexAttribArray(posHandle)
            GLES30.glDisableVertexAttribArray(normalHandle)
        }
    }
}

data class CollaboratorCursor(
    val participantId: String,
    val name: String,
    val position: FloatArray,
    val color: FloatArray,
    val platform: String
) {
    fun draw() {
        // Draw a small sphere or pointer at cursor position
        // Simplified: would use pre-generated sphere geometry
    }
}

data class PrivacyZone(
    val id: String,
    val center: FloatArray,
    val radius: Float,
    val hasAccess: Boolean,
    val allowedUsers: List<String>
) {
    fun draw() {
        // Draw translucent sphere boundary
        // Simplified: would use pre-generated sphere geometry
    }
}

data class SpatialAnnotation(
    val id: String,
    val text: String,
    val position: FloatArray,
    val authorId: String,
    val authorColor: FloatArray,
    val timestamp: Long
) {
    fun draw() {
        // Draw billboard text annotation
        // Simplified: would use text texture rendering
    }
}
