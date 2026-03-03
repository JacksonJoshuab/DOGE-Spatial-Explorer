// HandTrackingService.swift
// DOGE Spatial Editor — visionOS
// Advanced hand tracking and gesture recognition for spatial editing

import ARKit
import RealityKit
import Combine

// MARK: - Hand Tracking Service

@MainActor
class HandTrackingService: ObservableObject {
    
    // MARK: - Published State
    
    @Published var leftHandPosition: SIMD3<Float>?
    @Published var rightHandPosition: SIMD3<Float>?
    @Published var currentGesture: SpatialGesture = .none
    @Published var isPinching: Bool = false
    @Published var pinchStrength: Float = 0
    @Published var isTracking: Bool = false
    
    // MARK: - Private Properties
    
    private var handTrackingProvider: HandTrackingProvider?
    private var session: ARKitSession?
    private var cancellables = Set<AnyCancellable>()
    
    // Gesture recognition state
    private var gestureHistory: [SpatialGesture] = []
    private var lastPinchTime: Date?
    private var pinchStartPosition: SIMD3<Float>?
    private var twoHandDistance: Float?
    
    // MARK: - Initialization
    
    init() {}
    
    // MARK: - Start Tracking
    
    func startTracking() async throws {
        let session = ARKitSession()
        let handTracking = HandTrackingProvider()
        
        // Check authorization
        let authStatus = await session.queryAuthorization(for: [.handTracking])
        guard authStatus[.handTracking] == .allowed else {
            throw HandTrackingError.notAuthorized
        }
        
        try await session.run([handTracking])
        
        self.session = session
        self.handTrackingProvider = handTracking
        self.isTracking = true
        
        // Start processing hand updates
        Task {
            await processHandUpdates()
        }
    }
    
    // MARK: - Process Hand Updates
    
    private func processHandUpdates() async {
        guard let provider = handTrackingProvider else { return }
        
        for await update in provider.anchorUpdates {
            let anchor = update.anchor
            
            guard anchor.isTracked else { continue }
            
            switch anchor.chirality {
            case .left:
                await processLeftHand(anchor)
            case .right:
                await processRightHand(anchor)
            @unknown default:
                break
            }
            
            // Recognize gestures from both hands
            await recognizeGestures()
        }
    }
    
    // MARK: - Hand Processing
    
    private func processLeftHand(_ anchor: HandAnchor) async {
        guard let skeleton = anchor.handSkeleton else { return }
        
        // Get wrist position as hand center
        let wristTransform = anchor.originFromAnchorTransform
        leftHandPosition = SIMD3<Float>(
            wristTransform.columns.3.x,
            wristTransform.columns.3.y,
            wristTransform.columns.3.z
        )
        
        // Check for pinch gesture (thumb tip to index tip)
        let thumbTip = skeleton.joint(.thumbTip)
        let indexTip = skeleton.joint(.indexFingerTip)
        
        if thumbTip.isTracked && indexTip.isTracked {
            let thumbPos = matrix_multiply(anchor.originFromAnchorTransform, thumbTip.anchorFromJointTransform).columns.3
            let indexPos = matrix_multiply(anchor.originFromAnchorTransform, indexTip.anchorFromJointTransform).columns.3
            
            let distance = simd_distance(
                SIMD3<Float>(thumbPos.x, thumbPos.y, thumbPos.z),
                SIMD3<Float>(indexPos.x, indexPos.y, indexPos.z)
            )
            
            // Pinch threshold: ~2cm
            let leftPinching = distance < 0.02
            if leftPinching {
                pinchStrength = max(0, 1.0 - (distance / 0.02))
            }
        }
    }
    
    private func processRightHand(_ anchor: HandAnchor) async {
        guard let skeleton = anchor.handSkeleton else { return }
        
        let wristTransform = anchor.originFromAnchorTransform
        rightHandPosition = SIMD3<Float>(
            wristTransform.columns.3.x,
            wristTransform.columns.3.y,
            wristTransform.columns.3.z
        )
        
        // Check for pinch gesture
        let thumbTip = skeleton.joint(.thumbTip)
        let indexTip = skeleton.joint(.indexFingerTip)
        
        if thumbTip.isTracked && indexTip.isTracked {
            let thumbPos = matrix_multiply(anchor.originFromAnchorTransform, thumbTip.anchorFromJointTransform).columns.3
            let indexPos = matrix_multiply(anchor.originFromAnchorTransform, indexTip.anchorFromJointTransform).columns.3
            
            let distance = simd_distance(
                SIMD3<Float>(thumbPos.x, thumbPos.y, thumbPos.z),
                SIMD3<Float>(indexPos.x, indexPos.y, indexPos.z)
            )
            
            isPinching = distance < 0.02
            if isPinching {
                pinchStrength = max(0, 1.0 - (distance / 0.02))
                
                if pinchStartPosition == nil {
                    pinchStartPosition = rightHandPosition
                    lastPinchTime = Date()
                }
            } else {
                // Check for tap (quick pinch and release)
                if let startTime = lastPinchTime,
                   Date().timeIntervalSince(startTime) < 0.3 {
                    currentGesture = .tap
                }
                pinchStartPosition = nil
                lastPinchTime = nil
            }
        }
    }
    
    // MARK: - Gesture Recognition
    
    private func recognizeGestures() async {
        guard let leftPos = leftHandPosition,
              let rightPos = rightHandPosition else {
            return
        }
        
        let handDistance = simd_distance(leftPos, rightPos)
        
        // Two-hand scale gesture
        if let prevDistance = twoHandDistance {
            let scaleDelta = handDistance - prevDistance
            if abs(scaleDelta) > 0.005 {
                currentGesture = scaleDelta > 0 ? .scaleUp : .scaleDown
            }
        }
        twoHandDistance = handDistance
        
        // Detect rotation gesture (hands moving in opposite vertical directions)
        // This is simplified — production would use full joint tracking
        
        // Update gesture history for pattern recognition
        gestureHistory.append(currentGesture)
        if gestureHistory.count > 30 {
            gestureHistory.removeFirst()
        }
    }
    
    // MARK: - Stop Tracking
    
    func stopTracking() {
        session?.stop()
        isTracking = false
        leftHandPosition = nil
        rightHandPosition = nil
        currentGesture = .none
    }
}

// MARK: - Spatial Gesture Types

enum SpatialGesture: String {
    case none
    case tap
    case doubleTap
    case pinchAndDrag
    case pinchAndRotate
    case scaleUp
    case scaleDown
    case swipeLeft
    case swipeRight
    case grab
    case release
    case point
    case palmUp
    case palmDown
    
    var displayName: String {
        switch self {
        case .none: return "None"
        case .tap: return "Tap"
        case .doubleTap: return "Double Tap"
        case .pinchAndDrag: return "Pinch & Drag"
        case .pinchAndRotate: return "Pinch & Rotate"
        case .scaleUp: return "Scale Up"
        case .scaleDown: return "Scale Down"
        case .swipeLeft: return "Swipe Left"
        case .swipeRight: return "Swipe Right"
        case .grab: return "Grab"
        case .release: return "Release"
        case .point: return "Point"
        case .palmUp: return "Palm Up"
        case .palmDown: return "Palm Down"
        }
    }
    
    var iconName: String {
        switch self {
        case .none: return "hand.raised.slash"
        case .tap: return "hand.tap"
        case .doubleTap: return "hand.tap"
        case .pinchAndDrag: return "hand.pinch"
        case .pinchAndRotate: return "arrow.triangle.2.circlepath"
        case .scaleUp: return "arrow.up.left.and.arrow.down.right"
        case .scaleDown: return "arrow.down.right.and.arrow.up.left"
        case .swipeLeft: return "hand.draw"
        case .swipeRight: return "hand.draw"
        case .grab: return "hand.raised.fill"
        case .release: return "hand.raised"
        case .point: return "hand.point.up.left"
        case .palmUp: return "hand.raised"
        case .palmDown: return "hand.raised.fill"
        }
    }
}

// MARK: - Errors

enum HandTrackingError: LocalizedError {
    case notAuthorized
    case notAvailable
    case trackingFailed
    
    var errorDescription: String? {
        switch self {
        case .notAuthorized: return "Hand tracking authorization denied"
        case .notAvailable: return "Hand tracking not available on this device"
        case .trackingFailed: return "Hand tracking failed to initialize"
        }
    }
}
