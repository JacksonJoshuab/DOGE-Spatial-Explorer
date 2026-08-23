@preconcurrency import CoreLocation
import Foundation
import Observation

@MainActor
@Observable
public final class ExpeditionLocationService: NSObject, CLLocationManagerDelegate {
    public private(set) var authorizationStatus: CLAuthorizationStatus = .notDetermined
    public private(set) var latestLocation: CLLocation?
#if !os(visionOS)
    public private(set) var latestHeading: CLHeading?
#endif
    public var onLocation: ((CLLocation) -> Void)?

    private let manager = CLLocationManager()

    public override init() {
        super.init()
        manager.delegate = self
        manager.activityType = .automotiveNavigation
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 5
#if !os(visionOS)
        manager.headingFilter = 5
#endif
        manager.pausesLocationUpdatesAutomatically = false
    }

    public func requestAuthorizationAndStart() {
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
#if !os(visionOS)
        manager.startUpdatingHeading()
#endif
    }

    public func stop() {
        manager.stopUpdatingLocation()
#if !os(visionOS)
        manager.stopUpdatingHeading()
#endif
    }

    nonisolated public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        let status = manager.authorizationStatus
        Task { @MainActor [weak self] in
            self?.authorizationStatus = status
        }
    }

    nonisolated public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        Task { @MainActor [weak self] in
            guard let self else { return }
            latestLocation = location
            onLocation?(location)
        }
    }

#if !os(visionOS)
    nonisolated public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        Task { @MainActor [weak self] in
            self?.latestHeading = newHeading
        }
    }
#endif
}
