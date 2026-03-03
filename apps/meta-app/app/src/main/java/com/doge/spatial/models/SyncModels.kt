// SyncModels.kt
// DOGE Spatial Explorer — Shared Sync Models
//
// Data models shared between Meta Quest and the cloud backend.
// These mirror the Swift models used on visionOS to ensure
// cross-platform compatibility.

package com.doge.spatial.models

import kotlinx.serialization.*

/**
 * A synchronization operation sent between platforms.
 * This is the wire format for all real-time collaboration messages.
 */
@Serializable
data class SyncOperation(
    val id: String = java.util.UUID.randomUUID().toString(),
    val type: SyncOperationType,
    val documentId: String,
    val timestamp: Long = System.currentTimeMillis(),
    val payload: String = "",
    val metadata: com.doge.spatial.collaboration.OperationMetadata? = null
)

@Serializable
enum class SyncOperationType {
    @SerialName("nodeAdded") NODE_ADDED,
    @SerialName("nodeRemoved") NODE_REMOVED,
    @SerialName("nodeTransformed") NODE_TRANSFORMED,
    @SerialName("nodePropertyChanged") NODE_PROPERTY_CHANGED,
    @SerialName("documentSaved") DOCUMENT_SAVED,
    @SerialName("documentMetadataChanged") DOCUMENT_METADATA_CHANGED,
    @SerialName("cursorUpdate") CURSOR_UPDATE,
    @SerialName("heartbeat") HEARTBEAT,
    @SerialName("fullSync") FULL_SYNC
}

/**
 * A scene node in the shared scene graph format.
 * Compatible with the Swift SceneNode type.
 */
@Serializable
data class SharedSceneNode(
    val id: String,
    val name: String,
    val type: String,
    val transform: SharedTransform,
    val isVisible: Boolean = true,
    val isLocked: Boolean = false,
    val children: List<SharedSceneNode> = emptyList(),
    val geometry: SharedGeometry? = null,
    val material: SharedMaterial? = null,
    val lockedBy: String? = null,
    val annotations: List<SharedAnnotation> = emptyList()
)

@Serializable
data class SharedTransform(
    val positionX: Float = 0f,
    val positionY: Float = 0f,
    val positionZ: Float = 0f,
    val rotationX: Float = 0f,
    val rotationY: Float = 0f,
    val rotationZ: Float = 0f,
    val rotationW: Float = 1f,
    val scaleX: Float = 1f,
    val scaleY: Float = 1f,
    val scaleZ: Float = 1f
)

@Serializable
data class SharedGeometry(
    val primitiveType: String? = null,
    val meshResourceURL: String? = null,
    val vertexCount: Int? = null,
    val triangleCount: Int? = null,
    val voxelResolution: List<Int>? = null
)

@Serializable
data class SharedMaterial(
    val type: String = "physically_based",
    val baseColorHex: String? = null,
    val roughness: Float? = null,
    val metallic: Float? = null,
    val opacity: Float? = null
)

@Serializable
data class SharedAnnotation(
    val id: String,
    val text: String,
    val author: String,
    val createdAt: Long,
    val color: String = "#4A90D9",
    val isResolved: Boolean = false
)

/**
 * Document summary for listing available projects.
 */
@Serializable
data class DocumentSummary(
    val id: String,
    val name: String,
    val description: String = "",
    val modifiedAt: Long,
    val collaboratorCount: Int = 0,
    val privacyLevel: String = "private"
)

/**
 * Privacy zone definition shared across platforms.
 */
@Serializable
data class SharedPrivacyZone(
    val id: String,
    val name: String,
    val centerX: Float,
    val centerY: Float,
    val centerZ: Float,
    val radius: Float,
    val clearanceLevel: String,
    val redactedTypes: List<String>,
    val isActive: Boolean = true
)
