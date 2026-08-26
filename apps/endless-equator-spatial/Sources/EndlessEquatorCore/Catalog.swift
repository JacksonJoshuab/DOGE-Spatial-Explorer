import Foundation

public enum CatalogError: LocalizedError {
    case missingResource(String)
    case invalidResource(String, Error)

    public var errorDescription: String? {
        switch self {
        case .missingResource(let name): return "Missing bundled resource: \(name)"
        case .invalidResource(let name, let error): return "Could not decode \(name): \(error.localizedDescription)"
        }
    }
}

public enum ExpeditionCatalog {
    public static func loadAreas() throws -> [AreaOfInterest] {
        try ["areas-01", "areas-02", "areas-03"].flatMap { resource in
            try decode([AreaOfInterest].self, resource: resource, extension: "json")
        }
    }

    public static func loadSeedRoute() throws -> RoutePlan {
        try decode(RoutePlan.self, resource: "route-plan", extension: "json")
    }

    public static func geoJSONData() throws -> Data {
        guard let url = Bundle.module.url(forResource: "route", withExtension: "geojson") else {
            throw CatalogError.missingResource("route.geojson")
        }
        return try Data(contentsOf: url)
    }

    private static func decode<T: Decodable>(
        _ type: T.Type,
        resource: String,
        extension ext: String
    ) throws -> T {
        guard let url = Bundle.module.url(forResource: resource, withExtension: ext) else {
            throw CatalogError.missingResource("\(resource).\(ext)")
        }
        do {
            let data = try Data(contentsOf: url)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            return try decoder.decode(type, from: data)
        } catch {
            throw CatalogError.invalidResource("\(resource).\(ext)", error)
        }
    }
}
