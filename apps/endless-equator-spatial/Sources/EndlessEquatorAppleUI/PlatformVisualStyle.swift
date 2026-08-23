import SwiftUI

public extension View {
    @ViewBuilder
    func endlessEquatorGlassCard(cornerRadius: CGFloat = 20) -> some View {
#if os(visionOS)
        self
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: cornerRadius, style: .continuous))
#else
        self
            .glassEffect(.regular, in: .rect(cornerRadius: cornerRadius))
#endif
    }

    @ViewBuilder
    func endlessEquatorGlassCapsule() -> some View {
#if os(visionOS)
        self
            .background(.regularMaterial, in: Capsule())
#else
        self
            .glassEffect(.regular, in: .capsule)
#endif
    }
}
