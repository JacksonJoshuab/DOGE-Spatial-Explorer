import CryptoKit
import Foundation
@preconcurrency import Network
import Observation

public struct NearbyExpeditionPeer: Identifiable, Hashable, Sendable {
    public let id: String
    public let displayName: String

    public init(id: String, displayName: String) {
        self.id = id
        self.displayName = displayName
    }
}

public enum PeerSyncError: LocalizedError {
    case pairingCodeRequired
    case peerUnavailable
    case encryptionFailed
    case invalidFrame

    public var errorDescription: String? {
        switch self {
        case .pairingCodeRequired:
            "Enter the same pairing code on both expedition devices before connecting."
        case .peerUnavailable:
            "The nearby expedition device is no longer available."
        case .encryptionFailed:
            "The expedition sync message could not be encrypted."
        case .invalidFrame:
            "The expedition sync message was invalid or used a different pairing code."
        }
    }
}

@MainActor
@Observable
public final class PeerSyncService {
    public private(set) var discoveredPeers: [NearbyExpeditionPeer] = []
    public private(set) var connectedPeers: [NearbyExpeditionPeer] = []
    public private(set) var latestPacket: NavigationSyncPacket?
    public private(set) var lastError: String?
    public private(set) var pairingWindowOpen = false
    public private(set) var pairingCode: String

    @ObservationIgnored private let transport: PeerTransport

    public init(displayName: String) {
        let initialCode = Self.makePairingCode()
        pairingCode = initialCode
        transport = PeerTransport(displayName: displayName, pairingCode: initialCode)

        transport.onDiscoveredPeers = { [weak self] peers in
            Task { @MainActor [weak self] in self?.discoveredPeers = peers }
        }
        transport.onConnectedPeers = { [weak self] peers in
            Task { @MainActor [weak self] in self?.connectedPeers = peers }
        }
        transport.onPacket = { [weak self] packet in
            Task { @MainActor [weak self] in self?.latestPacket = packet }
        }
        transport.onError = { [weak self] message in
            Task { @MainActor [weak self] in self?.lastError = message }
        }
        transport.onPairingWindowConsumed = { [weak self] in
            Task { @MainActor [weak self] in self?.pairingWindowOpen = false }
        }
    }

    public func start() {
        transport.start()
    }

    public func stop() {
        transport.stop()
        discoveredPeers = []
        connectedPeers = []
    }

    public func setPairingWindow(open: Bool) {
        pairingWindowOpen = open
        transport.setPairingWindow(open: open)
    }

    public func setPairingCode(_ value: String) {
        let normalized = Self.normalizePairingCode(value)
        pairingCode = normalized
        connectedPeers = []
        transport.setPairingCode(normalized)
    }

    public func generateNewPairingCode() {
        setPairingCode(Self.makePairingCode())
    }

    public func connect(_ peer: NearbyExpeditionPeer) {
        do {
            guard pairingCode.count >= 16 else { throw PeerSyncError.pairingCodeRequired }
            try transport.connect(to: peer)
        } catch {
            lastError = error.localizedDescription
        }
    }

    public func send(_ packet: NavigationSyncPacket) throws {
        guard pairingCode.count >= 16 else { throw PeerSyncError.pairingCodeRequired }
        try transport.send(packet: packet, pairingCode: pairingCode)
    }

    private static func makePairingCode() -> String {
        String(UUID().uuidString.replacingOccurrences(of: "-", with: "").prefix(24))
    }

    private static func normalizePairingCode(_ value: String) -> String {
        String(value.uppercased().filter { character in
            character.isLetter || character.isNumber
        }.prefix(64))
    }
}

private final class PeerTransport: @unchecked Sendable {
    private static let serviceType = "_eq-nav._tcp"
    private static let maximumFrameBytes = 1_048_576

    private let displayName: String
    private let queue = DispatchQueue(label: "com.gonzosocialclub.endlessequator.peer-sync")
    private var listener: NWListener?
    private var browser: NWBrowser?
    private var endpoints: [String: NWEndpoint] = [:]
    private var connections: [String: ConnectionContext] = [:]
    private var pairingCode: String
    private var pairingWindowOpen = false

    var onDiscoveredPeers: @Sendable ([NearbyExpeditionPeer]) -> Void = { _ in }
    var onConnectedPeers: @Sendable ([NearbyExpeditionPeer]) -> Void = { _ in }
    var onPacket: @Sendable (NavigationSyncPacket) -> Void = { _ in }
    var onError: @Sendable (String) -> Void = { _ in }
    var onPairingWindowConsumed: @Sendable () -> Void = {}

    init(displayName: String, pairingCode: String) {
        self.displayName = displayName
        self.pairingCode = pairingCode
    }

    func start() {
        queue.async { [weak self] in self?.startOnQueue() }
    }

    func stop() {
        queue.async { [weak self] in
            guard let self else { return }
            listener?.cancel()
            browser?.cancel()
            connections.values.forEach { $0.connection.cancel() }
            listener = nil
            browser = nil
            endpoints = [:]
            connections = [:]
            onDiscoveredPeers([])
            onConnectedPeers([])
        }
    }

    func setPairingWindow(open: Bool) {
        queue.async { [weak self] in self?.pairingWindowOpen = open }
    }

    func setPairingCode(_ code: String) {
        queue.async { [weak self] in
            guard let self else { return }
            pairingCode = code
            connections.values.forEach { $0.connection.cancel() }
            connections = [:]
            onConnectedPeers([])
        }
    }

    func connect(to peer: NearbyExpeditionPeer) throws {
        guard !peer.id.isEmpty else { throw PeerSyncError.peerUnavailable }
        queue.async { [weak self] in
            guard let self, let endpoint = endpoints[peer.id] else {
                self?.onError(PeerSyncError.peerUnavailable.localizedDescription)
                return
            }
            registerConnection(NWConnection(to: endpoint, using: makeParameters()), peer: peer)
        }
    }

    func send(packet: NavigationSyncPacket, pairingCode: String) throws {
        let envelope = WireEnvelope(kind: .packet, displayName: displayName, packet: packet)
        let frame = try Self.makeFrame(envelope: envelope, pairingCode: pairingCode)
        queue.async { [weak self] in
            guard let self else { return }
            for context in connections.values where context.authenticated {
                context.connection.send(content: frame, completion: .contentProcessed { [weak self] error in
                    if let error { self?.onError(error.localizedDescription) }
                })
            }
        }
    }

    private func startOnQueue() {
        guard listener == nil, browser == nil else { return }
        do {
            let parameters = makeParameters()
            let newListener = try NWListener(using: parameters)
            newListener.service = NWListener.Service(name: displayName, type: Self.serviceType)
            newListener.stateUpdateHandler = { [weak self] state in self?.handleListenerState(state) }
            newListener.newConnectionHandler = { [weak self] connection in self?.handleIncoming(connection) }
            listener = newListener
            newListener.start(queue: queue)

            let newBrowser = NWBrowser(for: .bonjour(type: Self.serviceType, domain: nil), using: makeParameters())
            newBrowser.stateUpdateHandler = { [weak self] state in self?.handleBrowserState(state) }
            newBrowser.browseResultsChangedHandler = { [weak self] results, _ in self?.handleBrowseResults(results) }
            browser = newBrowser
            newBrowser.start(queue: queue)
        } catch {
            onError(error.localizedDescription)
        }
    }

    private func makeParameters() -> NWParameters {
        let parameters = NWParameters.tcp
        parameters.includePeerToPeer = true
        return parameters
    }

    private func handleListenerState(_ state: NWListener.State) {
        switch state {
        case .failed(let error):
            onError(error.localizedDescription)
            listener?.cancel()
            listener = nil
        case .cancelled:
            listener = nil
        default:
            break
        }
    }

    private func handleBrowserState(_ state: NWBrowser.State) {
        switch state {
        case .failed(let error):
            onError(error.localizedDescription)
            browser?.cancel()
            browser = nil
        case .cancelled:
            browser = nil
        default:
            break
        }
    }

    private func handleBrowseResults(_ results: Set<NWBrowser.Result>) {
        var nextEndpoints: [String: NWEndpoint] = [:]
        var peers: [NearbyExpeditionPeer] = []
        for result in results {
            let endpoint = result.endpoint
            let id = endpoint.debugDescription
            let peerName: String
            if case let .service(name, _, _, _) = endpoint {
                peerName = name
            } else {
                peerName = id
            }
            guard peerName != displayName else { continue }
            nextEndpoints[id] = endpoint
            peers.append(NearbyExpeditionPeer(id: id, displayName: peerName))
        }
        endpoints = nextEndpoints
        onDiscoveredPeers(peers.sorted {
            $0.displayName.localizedCaseInsensitiveCompare($1.displayName) == .orderedAscending
        })
    }

    private func handleIncoming(_ connection: NWConnection) {
        guard pairingWindowOpen else {
            connection.cancel()
            return
        }
        pairingWindowOpen = false
        onPairingWindowConsumed()
        registerConnection(connection, peer: peerDescriptor(for: connection.endpoint))
    }

    private func registerConnection(_ connection: NWConnection, peer: NearbyExpeditionPeer) {
        connections[peer.id]?.connection.cancel()
        let context = ConnectionContext(peer: peer, connection: connection)
        connections[peer.id] = context
        connection.stateUpdateHandler = { [weak self, weak context] state in
            guard let self, let context else { return }
            handleConnectionState(state, context: context)
        }
        connection.start(queue: queue)
        receiveNext(on: context)
    }

    private func handleConnectionState(_ state: NWConnection.State, context: ConnectionContext) {
        switch state {
        case .ready:
            do {
                let hello = WireEnvelope(kind: .hello, displayName: displayName, packet: nil)
                let frame = try Self.makeFrame(envelope: hello, pairingCode: pairingCode)
                context.connection.send(content: frame, completion: .contentProcessed { [weak self] error in
                    if let error { self?.onError(error.localizedDescription) }
                })
            } catch {
                onError(error.localizedDescription)
                context.connection.cancel()
            }
        case .failed(let error):
            onError(error.localizedDescription)
            remove(context)
        case .cancelled:
            remove(context)
        default:
            break
        }
    }

    private func receiveNext(on context: ConnectionContext) {
        context.connection.receive(minimumIncompleteLength: 1, maximumLength: 65_536) { [weak self, weak context] data, _, isComplete, error in
            guard let self, let context else { return }
            if let data, !data.isEmpty {
                context.buffer.append(data)
                processFrames(on: context)
            }
            if let error {
                onError(error.localizedDescription)
                context.connection.cancel()
                return
            }
            if isComplete {
                context.connection.cancel()
            } else {
                receiveNext(on: context)
            }
        }
    }

    private func processFrames(on context: ConnectionContext) {
        while context.buffer.count >= 4 {
            let length = context.buffer.prefix(4).reduce(UInt32(0)) { ($0 << 8) | UInt32($1) }
            guard length > 0, length <= UInt32(Self.maximumFrameBytes) else {
                onError(PeerSyncError.invalidFrame.localizedDescription)
                context.connection.cancel()
                return
            }
            let fullLength = 4 + Int(length)
            guard context.buffer.count >= fullLength else { return }
            let encrypted = context.buffer.subdata(in: 4..<fullLength)
            context.buffer.removeSubrange(0..<fullLength)
            do {
                let envelope = try Self.openFrame(encrypted, pairingCode: pairingCode)
                context.authenticated = true
                context.peer = NearbyExpeditionPeer(id: context.peer.id, displayName: envelope.displayName)
                publishConnectedPeers()
                if envelope.kind == .packet, let packet = envelope.packet {
                    onPacket(packet)
                }
            } catch {
                onError(PeerSyncError.invalidFrame.localizedDescription)
                context.connection.cancel()
                return
            }
        }
    }

    private func remove(_ context: ConnectionContext) {
        connections.removeValue(forKey: context.peer.id)
        publishConnectedPeers()
    }

    private func publishConnectedPeers() {
        let peers = connections.values
            .filter(\.authenticated)
            .map(\.peer)
            .sorted { $0.displayName.localizedCaseInsensitiveCompare($1.displayName) == .orderedAscending }
        onConnectedPeers(peers)
    }

    private func peerDescriptor(for endpoint: NWEndpoint) -> NearbyExpeditionPeer {
        let id = endpoint.debugDescription
        if case let .service(name, _, _, _) = endpoint {
            return NearbyExpeditionPeer(id: id, displayName: name)
        }
        return NearbyExpeditionPeer(id: id, displayName: "Nearby expedition device")
    }

    private static func makeFrame(envelope: WireEnvelope, pairingCode: String) throws -> Data {
        let payload = try JSONEncoder().encode(envelope)
        let sealed = try ChaChaPoly.seal(payload, using: key(for: pairingCode))
        let encrypted = sealed.combined
        guard encrypted.count <= maximumFrameBytes else { throw PeerSyncError.encryptionFailed }
        var length = UInt32(encrypted.count).bigEndian
        var frame = Data(bytes: &length, count: MemoryLayout<UInt32>.size)
        frame.append(encrypted)
        return frame
    }

    private static func openFrame(_ encrypted: Data, pairingCode: String) throws -> WireEnvelope {
        let sealed = try ChaChaPoly.SealedBox(combined: encrypted)
        let payload = try ChaChaPoly.open(sealed, using: key(for: pairingCode))
        return try JSONDecoder().decode(WireEnvelope.self, from: payload)
    }

    private static func key(for pairingCode: String) -> SymmetricKey {
        let digest = SHA256.hash(data: Data(pairingCode.utf8))
        return SymmetricKey(data: Data(digest))
    }
}

private final class ConnectionContext: @unchecked Sendable {
    var peer: NearbyExpeditionPeer
    let connection: NWConnection
    var buffer = Data()
    var authenticated = false

    init(peer: NearbyExpeditionPeer, connection: NWConnection) {
        self.peer = peer
        self.connection = connection
    }
}

private struct WireEnvelope: Codable, Sendable {
    enum Kind: String, Codable, Sendable {
        case hello
        case packet
    }

    let kind: Kind
    let displayName: String
    let packet: NavigationSyncPacket?
}
