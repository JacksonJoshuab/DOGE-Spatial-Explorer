import Foundation
@preconcurrency import MultipeerConnectivity
import Observation

@MainActor
@Observable
public final class PeerSyncService: NSObject {
    public private(set) var discoveredPeers: [MCPeerID] = []
    public private(set) var connectedPeers: [MCPeerID] = []
    public private(set) var latestPacket: NavigationSyncPacket?
    public private(set) var lastError: String?
    public private(set) var pairingWindowOpen = false

    private let localPeer: MCPeerID
    private let session: MCSession
    private let advertiser: MCNearbyServiceAdvertiser
    private let browser: MCNearbyServiceBrowser
    private let serviceType = "eq-nav"

    public init(displayName: String) {
        localPeer = MCPeerID(displayName: displayName)
        session = MCSession(peer: localPeer, securityIdentity: nil, encryptionPreference: .required)
        advertiser = MCNearbyServiceAdvertiser(peer: localPeer, discoveryInfo: ["app": "endless-equator"], serviceType: serviceType)
        browser = MCNearbyServiceBrowser(peer: localPeer, serviceType: serviceType)
        super.init()
        session.delegate = self
        advertiser.delegate = self
        browser.delegate = self
    }

    public func start() {
        advertiser.startAdvertisingPeer()
        browser.startBrowsingForPeers()
    }

    public func stop() {
        advertiser.stopAdvertisingPeer()
        browser.stopBrowsingForPeers()
        session.disconnect()
    }

    public func setPairingWindow(open: Bool) {
        pairingWindowOpen = open
    }

    public func invite(_ peer: MCPeerID) {
        browser.invitePeer(peer, to: session, withContext: nil, timeout: 20)
    }

    public func send(_ packet: NavigationSyncPacket) throws {
        guard !session.connectedPeers.isEmpty else { return }
        let data = try JSONEncoder().encode(packet)
        try session.send(data, toPeers: session.connectedPeers, with: .reliable)
    }
}

extension PeerSyncService: MCSessionDelegate, MCNearbyServiceAdvertiserDelegate, MCNearbyServiceBrowserDelegate {
    nonisolated public func session(_ session: MCSession, peer peerID: MCPeerID, didChange state: MCSessionState) {
        Task { @MainActor in self.connectedPeers = session.connectedPeers }
    }

    nonisolated public func session(_ session: MCSession, didReceive data: Data, fromPeer peerID: MCPeerID) {
        do {
            let packet = try JSONDecoder().decode(NavigationSyncPacket.self, from: data)
            Task { @MainActor in self.latestPacket = packet }
        } catch {
            Task { @MainActor in self.lastError = error.localizedDescription }
        }
    }

    nonisolated public func session(_ session: MCSession, didReceive stream: InputStream, withName streamName: String, fromPeer peerID: MCPeerID) {}
    nonisolated public func session(_ session: MCSession, didStartReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, with progress: Progress) {}
    nonisolated public func session(_ session: MCSession, didFinishReceivingResourceWithName resourceName: String, fromPeer peerID: MCPeerID, at localURL: URL?, withError error: Error?) {}

    nonisolated public func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didReceiveInvitationFromPeer peerID: MCPeerID, withContext context: Data?, invitationHandler: @escaping (Bool, MCSession?) -> Void) {
        Task { @MainActor [weak self] in
            guard let self else { invitationHandler(false, nil); return }
            let accept = self.pairingWindowOpen
            invitationHandler(accept, accept ? self.session : nil)
            if accept { self.pairingWindowOpen = false }
        }
    }

    nonisolated public func advertiser(_ advertiser: MCNearbyServiceAdvertiser, didNotStartAdvertisingPeer error: Error) {
        Task { @MainActor in self.lastError = error.localizedDescription }
    }

    nonisolated public func browser(_ browser: MCNearbyServiceBrowser, foundPeer peerID: MCPeerID, withDiscoveryInfo info: [String: String]?) {
        Task { @MainActor in
            if !self.discoveredPeers.contains(peerID) { self.discoveredPeers.append(peerID) }
        }
    }

    nonisolated public func browser(_ browser: MCNearbyServiceBrowser, lostPeer peerID: MCPeerID) {
        Task { @MainActor in self.discoveredPeers.removeAll { $0 == peerID } }
    }

    nonisolated public func browser(_ browser: MCNearbyServiceBrowser, didNotStartBrowsingForPeers error: Error) {
        Task { @MainActor in self.lastError = error.localizedDescription }
    }
}
