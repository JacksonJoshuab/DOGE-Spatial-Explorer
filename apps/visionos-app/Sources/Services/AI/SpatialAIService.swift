// SpatialAIService.swift
// DOGE Spatial Explorer — AI-Powered Spatial Generation
//
// Provides AI-powered features for the spatial editor:
// - Text-to-3D model generation
// - Text-to-texture generation
// - Text-to-scene generation
// - Image-to-3D model generation
// - Audio-to-scene generation
// - NPC RAG characters for spatial assistance
// - RF-to-spatial data generation (IoT sensor visualization)

import Foundation
import Observation

// MARK: - Spatial AI Service

@Observable
final class SpatialAIService {

    // MARK: - State

    var isProcessing = false
    var currentTask: AITask?
    var generationProgress: Double = 0.0
    var lastError: String?

    // MARK: - Configuration

    private var apiBaseURL: URL?
    private var apiKey: String?

    func configure(baseURL: URL, apiKey: String) {
        self.apiBaseURL = baseURL
        self.apiKey = apiKey
    }

    // MARK: - Text-to-3D

    /// Generates a 3D model from a text description.
    /// Returns a URL to the generated USDZ file.
    func generateModel(from prompt: String, style: ModelStyle = .realistic) async throws -> URL {
        isProcessing = true
        defer { isProcessing = false }

        currentTask = AITask(type: .textTo3D, prompt: prompt, status: .processing)

        let request = TextTo3DRequest(
            prompt: prompt,
            style: style.rawValue,
            format: "usdz",
            quality: "high",
            polyCount: "adaptive"
        )

        let response = try await postRequest(
            endpoint: "ai/text-to-3d",
            body: request
        ) as GenerationResponse

        currentTask?.status = .completed

        guard let url = URL(string: response.assetURL) else {
            throw AIError.invalidResponse
        }

        return url
    }

    // MARK: - Text-to-Texture

    /// Generates a PBR texture set from a text description.
    func generateTexture(from prompt: String, resolution: Int = 2048) async throws -> TextureSet {
        isProcessing = true
        defer { isProcessing = false }

        currentTask = AITask(type: .textToTexture, prompt: prompt, status: .processing)

        let request = TextToTextureRequest(
            prompt: prompt,
            resolution: resolution,
            channels: ["baseColor", "normal", "roughness", "metallic"]
        )

        let response = try await postRequest(
            endpoint: "ai/text-to-texture",
            body: request
        ) as TextureSetResponse

        currentTask?.status = .completed

        return TextureSet(
            baseColorURL: URL(string: response.baseColorURL)!,
            normalURL: URL(string: response.normalURL)!,
            roughnessURL: URL(string: response.roughnessURL)!,
            metallicURL: URL(string: response.metallicURL)!,
            resolution: resolution
        )
    }

    // MARK: - Text-to-Scene

    /// Generates a complete scene layout from a text description.
    func generateScene(from prompt: String) async throws -> SceneNode {
        isProcessing = true
        defer { isProcessing = false }

        currentTask = AITask(type: .textToScene, prompt: prompt, status: .processing)

        let request = TextToSceneRequest(
            prompt: prompt,
            maxObjects: 50,
            includeEnvironment: true,
            includeLighting: true
        )

        let response = try await postRequest(
            endpoint: "ai/text-to-scene",
            body: request
        ) as SceneGenerationResponse

        currentTask?.status = .completed

        // Convert the response into a SceneNode hierarchy
        return convertToSceneNode(response)
    }

    // MARK: - Image-to-3D

    /// Generates a 3D model from an image.
    func generateModelFromImage(imageData: Data) async throws -> URL {
        isProcessing = true
        defer { isProcessing = false }

        currentTask = AITask(type: .imageTo3D, prompt: "Image-to-3D", status: .processing)

        let base64Image = imageData.base64EncodedString()
        let request = ImageTo3DRequest(
            imageBase64: base64Image,
            format: "usdz",
            quality: "high"
        )

        let response = try await postRequest(
            endpoint: "ai/image-to-3d",
            body: request
        ) as GenerationResponse

        currentTask?.status = .completed

        guard let url = URL(string: response.assetURL) else {
            throw AIError.invalidResponse
        }

        return url
    }

    // MARK: - Audio-to-Scene

    /// Generates spatial audio visualization from audio data.
    func generateSceneFromAudio(audioURL: URL) async throws -> SceneNode {
        isProcessing = true
        defer { isProcessing = false }

        currentTask = AITask(type: .audioToScene, prompt: "Audio analysis", status: .processing)

        let request = AudioToSceneRequest(
            audioURL: audioURL.absoluteString,
            visualizationType: "spatial_waveform"
        )

        let response = try await postRequest(
            endpoint: "ai/audio-to-scene",
            body: request
        ) as SceneGenerationResponse

        currentTask?.status = .completed
        return convertToSceneNode(response)
    }

    // MARK: - RF-to-Spatial (IoT Sensor Visualization)

    /// Converts RF/IoT sensor data into spatial visualizations.
    func generateSpatialFromRF(sensorData: [SensorDataPoint]) async throws -> SceneNode {
        isProcessing = true
        defer { isProcessing = false }

        currentTask = AITask(type: .rfToSpatial, prompt: "RF/IoT visualization", status: .processing)

        let rootNode = SceneNode(name: "RF Visualization", type: .group)

        // Generate heat map or point cloud from sensor readings
        // This would create volumetric visualizations similar to
        // the Z-Pinch plasma column in the reference image

        currentTask?.status = .completed
        return rootNode
    }

    // MARK: - NPC RAG Assistant

    /// Queries the RAG-powered spatial assistant.
    func askAssistant(question: String, context: SceneContext) async throws -> AssistantResponse {
        let request = AssistantRequest(
            question: question,
            sceneContext: context,
            mode: "spatial_editing"
        )

        let response = try await postRequest(
            endpoint: "ai/assistant",
            body: request
        ) as AssistantResponse

        return response
    }

    // MARK: - Private

    private func postRequest<T: Codable, R: Codable>(endpoint: String, body: T) async throws -> R {
        guard let baseURL = apiBaseURL, let apiKey = apiKey else {
            throw AIError.notConfigured
        }

        let url = baseURL.appendingPathComponent(endpoint)
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw AIError.serverError
        }

        return try JSONDecoder().decode(R.self, from: data)
    }

    private func convertToSceneNode(_ response: SceneGenerationResponse) -> SceneNode {
        var root = SceneNode(name: response.sceneName, type: .group)

        for obj in response.objects {
            var node = SceneNode(name: obj.name, type: .mesh)
            node.transform.position = SIMD3<Float>(obj.position[0], obj.position[1], obj.position[2])
            node.transform.scale = SIMD3<Float>(obj.scale[0], obj.scale[1], obj.scale[2])
            node.geometry = GeometryDescriptor(
                primitiveType: PrimitiveType(rawValue: obj.primitiveType) ?? .box,
                meshResourceURL: obj.meshURL
            )
            node.material = MaterialDescriptor(
                type: .physically_based,
                baseColorHex: obj.colorHex,
                roughness: obj.roughness,
                metallic: obj.metallic
            )
            root.children.append(node)
        }

        return root
    }
}

// MARK: - Supporting Types

struct AITask {
    enum TaskType: String {
        case textTo3D, textToTexture, textToScene, imageTo3D, audioToScene, rfToSpatial
    }
    enum TaskStatus: String {
        case queued, processing, completed, failed
    }

    let type: TaskType
    let prompt: String
    var status: TaskStatus
}

enum ModelStyle: String {
    case realistic, stylized, lowPoly, voxel, wireframe
}

struct TextTo3DRequest: Codable {
    let prompt: String
    let style: String
    let format: String
    let quality: String
    let polyCount: String
}

struct TextToTextureRequest: Codable {
    let prompt: String
    let resolution: Int
    let channels: [String]
}

struct TextToSceneRequest: Codable {
    let prompt: String
    let maxObjects: Int
    let includeEnvironment: Bool
    let includeLighting: Bool
}

struct ImageTo3DRequest: Codable {
    let imageBase64: String
    let format: String
    let quality: String
}

struct AudioToSceneRequest: Codable {
    let audioURL: String
    let visualizationType: String
}

struct AssistantRequest: Codable {
    let question: String
    let sceneContext: SceneContext
    let mode: String
}

struct SceneContext: Codable {
    var entityCount: Int = 0
    var selectedNodeNames: [String] = []
    var currentEditingMode: String = "select"
    var documentName: String = ""
}

struct GenerationResponse: Codable {
    let assetURL: String
    let format: String
    let polyCount: Int
    let processingTimeMs: Int
}

struct TextureSetResponse: Codable {
    let baseColorURL: String
    let normalURL: String
    let roughnessURL: String
    let metallicURL: String
}

struct TextureSet {
    let baseColorURL: URL
    let normalURL: URL
    let roughnessURL: URL
    let metallicURL: URL
    let resolution: Int
}

struct SceneGenerationResponse: Codable {
    let sceneName: String
    let objects: [GeneratedObject]
}

struct GeneratedObject: Codable {
    let name: String
    let primitiveType: String
    let position: [Float]
    let scale: [Float]
    let colorHex: String
    let roughness: Float
    let metallic: Float
    let meshURL: String?
}

struct AssistantResponse: Codable {
    let answer: String
    let suggestedActions: [SuggestedAction]
}

struct SuggestedAction: Codable {
    let label: String
    let actionType: String
    let parameters: [String: String]
}

struct SensorDataPoint: Codable {
    let sensorID: String
    let latitude: Double
    let longitude: Double
    let value: Double
    let unit: String
    let timestamp: Date
}

enum AIError: Error, LocalizedError {
    case notConfigured
    case serverError
    case invalidResponse
    case generationFailed

    var errorDescription: String? {
        switch self {
        case .notConfigured: return "AI service is not configured."
        case .serverError: return "AI server returned an error."
        case .invalidResponse: return "Invalid response from AI service."
        case .generationFailed: return "Content generation failed."
        }
    }
}
