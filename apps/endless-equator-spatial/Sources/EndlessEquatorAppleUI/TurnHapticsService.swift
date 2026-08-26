import Foundation

@MainActor
public final class TurnHapticsService {
    public init() {}

    public func turnAdvanced() {
        #if os(iOS)
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.success)
        #endif
    }

    public func offRouteWarning() {
        #if os(iOS)
        let generator = UINotificationFeedbackGenerator()
        generator.prepare()
        generator.notificationOccurred(.warning)
        #endif
    }
}

#if os(iOS)
import UIKit
#endif
