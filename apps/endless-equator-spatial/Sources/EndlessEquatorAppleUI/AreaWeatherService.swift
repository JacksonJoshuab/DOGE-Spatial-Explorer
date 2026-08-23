import CoreLocation
import EndlessEquatorCore
import Foundation
import WeatherKit

public actor AreaWeatherService {
    public init() {}

    public func currentWeather(at coordinate: GeoCoordinate) async throws -> WeatherSummary {
        let location = CLLocation(latitude: coordinate.latitude, longitude: coordinate.longitude)
        let weather = try await WeatherService.shared.weather(for: location)
        let current = weather.currentWeather
        return WeatherSummary(
            temperatureCelsius: current.temperature.converted(to: .celsius).value,
            apparentTemperatureCelsius: current.apparentTemperature.converted(to: .celsius).value,
            condition: current.condition.description,
            precipitationChance: weather.hourlyForecast.first?.precipitationChance ?? 0,
            windKPH: current.wind.speed.converted(to: .kilometersPerHour).value,
            observedAt: current.date
        )
    }
}
