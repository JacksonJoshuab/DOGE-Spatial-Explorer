import EndlessEquatorCore
import SwiftUI

public struct PeerPairingView: View {
    @Bindable private var service: PeerSyncService
    @Environment(\.dismiss) private var dismiss
    @State private var editableCode = ""

    public init(service: PeerSyncService) {
        self.service = service
    }

    public var body: some View {
        NavigationStack {
            List {
                Section("Shared pairing code") {
                    TextField("16–64 letters or numbers", text: $editableCode)
                        .textInputAutocapitalization(.characters)
                        .autocorrectionDisabled()
                        .fontDesign(.monospaced)
                        .onSubmit { service.setPairingCode(editableCode) }
                    HStack {
                        Button("Apply code") {
                            service.setPairingCode(editableCode)
                            editableCode = service.pairingCode
                        }
                        Button("Generate new code") {
                            service.generateNewPairingCode()
                            editableCode = service.pairingCode
                        }
                    }
                    Text("Enter the same code on both devices and compare it in person. Existing peers disconnect only when the normalized code actually changes.")
                        .font(.caption)
                }

                Section("Incoming connections") {
                    Toggle("Accept the next authenticated connection", isOn: Binding(
                        get: { service.pairingWindowOpen },
                        set: { service.setPairingWindow(open: $0) }
                    ))
                    Text("The window closes only after one incoming peer proves knowledge of the shared code. Unauthenticated sockets cannot consume it.")
                        .font(.caption)
                }

                Section("Nearby expedition devices") {
                    if service.discoveredPeers.isEmpty {
                        ContentUnavailableView("No peers found", systemImage: "antenna.radiowaves.left.and.right")
                    }
                    ForEach(service.discoveredPeers) { peer in
                        Button("Connect to \(peer.displayName)") {
                            service.setPairingCode(editableCode)
                            service.connect(peer)
                        }
                    }
                }

                Section("Authenticated peers") {
                    if service.connectedPeers.isEmpty {
                        Text("No authenticated peers")
                            .foregroundStyle(.secondary)
                    }
                    ForEach(service.connectedPeers) { peer in
                        Label(peer.displayName, systemImage: "checkmark.shield.fill")
                    }
                }

                if let error = service.lastError {
                    Section("Connection notice") {
                        Label(error, systemImage: "exclamationmark.triangle")
                            .foregroundStyle(.orange)
                    }
                }
            }
            .navigationTitle("Encrypted nearby pairing")
            .toolbar { Button("Done") { dismiss() } }
            .task {
                editableCode = service.pairingCode
                service.start()
            }
        }
    }
}
