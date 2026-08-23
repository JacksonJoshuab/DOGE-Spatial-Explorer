import EndlessEquatorCore
import SwiftUI

public struct PeerPairingView: View {
    @Bindable private var service: PeerSyncService
    @Environment(\.dismiss) private var dismiss

    public init(service: PeerSyncService) { self.service = service }

    public var body: some View {
        NavigationStack {
            List {
                Section("Incoming invitations") {
                    Toggle("Accept the next encrypted invitation", isOn: Binding(
                        get: { service.pairingWindowOpen },
                        set: { service.setPairingWindow(open: $0) }
                    ))
                    Text("The window closes after one accepted invitation. Confirm the peer name in person.")
                        .font(.caption)
                }
                Section("Nearby expedition devices") {
                    if service.discoveredPeers.isEmpty {
                        ContentUnavailableView("No peers found", systemImage: "antenna.radiowaves.left.and.right")
                    }
                    ForEach(service.discoveredPeers, id: \.displayName) { peer in
                        Button("Invite \(peer.displayName)") { service.invite(peer) }
                    }
                }
                Section("Connected") {
                    ForEach(service.connectedPeers, id: \.displayName) { peer in Text(peer.displayName) }
                }
            }
            .navigationTitle("Encrypted nearby pairing")
            .toolbar { Button("Done") { dismiss() } }
            .task { service.start() }
        }
    }
}
