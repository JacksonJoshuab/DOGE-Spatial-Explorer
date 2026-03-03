// MetaSceneManager.kt
// DOGE Spatial Explorer — Scene Manager for Meta Quest
//
// Manages the local scene graph on Meta Quest devices.
// Bridges between the shared scene format and Meta Spatial SDK entities.

package com.doge.spatial.services

import android.util.Log
import com.doge.spatial.models.*
import kotlinx.coroutines.flow.*
import kotlinx.serialization.json.Json
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.encodeToString

class MetaSceneManager {

    companion object {
        private const val TAG = "MetaSceneManager"
    }

    // ── State ───────────────────────────────────────────────────────────

    var activeDocumentId: String = ""
        private set

    var localUserId: String = "meta-user-${System.currentTimeMillis()}"
        private set

    var selectedNodeIds: Set<String> = emptySet()
        private set

    private val _sceneNodes = MutableStateFlow<Map<String, SharedSceneNode>>(emptyMap())
    val sceneNodes: StateFlow<Map<String, SharedSceneNode>> = _sceneNodes.asStateFlow()

    private val json = Json { ignoreUnknownKeys = true; isLenient = true }

    // ── Document Lifecycle ──────────────────────────────────────────────

    fun loadDocument(documentJson: String) {
        try {
            val nodes = json.decodeFromString<List<SharedSceneNode>>(documentJson)
            val nodeMap = mutableMapOf<String, SharedSceneNode>()
            flattenNodes(nodes, nodeMap)
            _sceneNodes.value = nodeMap
            Log.i(TAG, "Loaded document with ${nodeMap.size} nodes")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to load document: ${e.message}")
        }
    }

    // ── Selection ───────────────────────────────────────────────────────

    fun selectNode(nodeId: String, additive: Boolean = false) {
        selectedNodeIds = if (additive) {
            if (selectedNodeIds.contains(nodeId)) {
                selectedNodeIds - nodeId
            } else {
                selectedNodeIds + nodeId
            }
        } else {
            setOf(nodeId)
        }
    }

    fun clearSelection() {
        selectedNodeIds = emptySet()
    }

    // ── Remote Operation Handlers ───────────────────────────────────────

    fun handleRemoteNodeAdded(operation: SyncOperation) {
        try {
            val node = json.decodeFromString<SharedSceneNode>(operation.payload)
            _sceneNodes.value = _sceneNodes.value + (node.id to node)
            Log.d(TAG, "Remote node added: ${node.name}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle remote node added: ${e.message}")
        }
    }

    fun handleRemoteNodeRemoved(operation: SyncOperation) {
        try {
            val nodeId = json.decodeFromString<String>(operation.payload)
            _sceneNodes.value = _sceneNodes.value - nodeId
            selectedNodeIds = selectedNodeIds - nodeId
            Log.d(TAG, "Remote node removed: $nodeId")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle remote node removed: ${e.message}")
        }
    }

    fun handleRemoteNodeTransformed(operation: SyncOperation) {
        try {
            val payload = json.decodeFromString<TransformUpdatePayload>(operation.payload)
            val existing = _sceneNodes.value[payload.nodeId] ?: return
            val updated = existing.copy(transform = payload.transform)
            _sceneNodes.value = _sceneNodes.value + (payload.nodeId to updated)
            Log.d(TAG, "Remote node transformed: ${payload.nodeId}")
        } catch (e: Exception) {
            Log.e(TAG, "Failed to handle remote node transformed: ${e.message}")
        }
    }

    // ── Local Operations ────────────────────────────────────────────────

    fun addNode(node: SharedSceneNode): SyncOperation {
        _sceneNodes.value = _sceneNodes.value + (node.id to node)
        return SyncOperation(
            type = SyncOperationType.NODE_ADDED,
            documentId = activeDocumentId,
            payload = json.encodeToString(node)
        )
    }

    fun removeNode(nodeId: String): SyncOperation {
        _sceneNodes.value = _sceneNodes.value - nodeId
        selectedNodeIds = selectedNodeIds - nodeId
        return SyncOperation(
            type = SyncOperationType.NODE_REMOVED,
            documentId = activeDocumentId,
            payload = json.encodeToString(nodeId)
        )
    }

    fun updateTransform(nodeId: String, transform: SharedTransform): SyncOperation {
        val existing = _sceneNodes.value[nodeId]
        if (existing != null) {
            val updated = existing.copy(transform = transform)
            _sceneNodes.value = _sceneNodes.value + (nodeId to updated)
        }
        return SyncOperation(
            type = SyncOperationType.NODE_TRANSFORMED,
            documentId = activeDocumentId,
            payload = json.encodeToString(TransformUpdatePayload(nodeId, transform))
        )
    }

    // ── Private ─────────────────────────────────────────────────────────

    private fun flattenNodes(nodes: List<SharedSceneNode>, map: MutableMap<String, SharedSceneNode>) {
        for (node in nodes) {
            map[node.id] = node
            flattenNodes(node.children, map)
        }
    }
}

@kotlinx.serialization.Serializable
data class TransformUpdatePayload(
    val nodeId: String,
    val transform: SharedTransform
)
