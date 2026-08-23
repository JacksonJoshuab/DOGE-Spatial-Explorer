import CoreLocation
import Foundation
import Observation

@MainActor
@Observable
public final class ExpeditionLocationService: NSObject, CLLocationManagerDelegate {
    public private(set) var authorizationStatus: CLAuthorizationStatus = .notDetermined
    public private(set) var latestLocation: CLLocation?
    public private(set) var latestHeading: CLHeading?
    public var onLocation: ((CLLocation) -> Void)?

    private let manager = CLLocationManager()

    public override init() {
        super.init()
        manager.delegate = self
        manager.activityType = .automotiveNavigation
        manager.desiredAccuracy = kCLLocationAccuracyBest
        manager.distanceFilter = 5
        manager.headingFilter = 5
        manager.pausesLocationUpdatesAutomatically = false
    }

    public func requestAuthorizationAndStart() {
        manager.requestWhenInUseAuthorization()
        manager.startUpdatingLocation()
        manager.startUpdatingHeading()
    }

    public func stop() {
        manager.stopUpdatingLocation()
        manager.stopUpdatingHeading()
    }

    public func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        authorizationStatus = manager.authorizationStatus
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        latestLocation = location
        onLocation?(location)
    }

    public func locationManager(_ manager: CLLocationManager, didUpdateHeading newHeading: CLHeading) {
        latestHeading = newHeading
    }
}
