import Foundation
import CoreLocation

// Research only. Select endpoint pairs close to CoreLocation's thresholds.
// Input is stdout from geodesic_reference_probe.swift, not parity fixtures.
let data = try Data(contentsOf: URL(fileURLWithPath: CommandLine.arguments[1]))
let rays = try JSONSerialization.jsonObject(with: data) as! [[String: Double]]
var rows: [[String: Double]] = []
for ray in rays where ray["constructedSphericalMeters"] == 60 {
    let latitude = ray["latitude"]!, longitude = ray["longitude"]!
    let dlat = ray["latitude2"]! - latitude
    let rawLon = ray["longitude2"]! - longitude
    let dlon = (rawLon + 540).truncatingRemainder(dividingBy: 360) - 180
    let origin = CLLocation(latitude: latitude, longitude: longitude)
    func endpoint(_ fraction: Double) -> (Double, Double, Double) {
        let lat = latitude + dlat * fraction
        let lon = (longitude + dlon * fraction + 540).truncatingRemainder(dividingBy: 360) - 180
        return (lat, lon, origin.distance(from: CLLocation(latitude: lat, longitude: lon)))
    }
    for threshold in [0.55, 1.5] {
        for offset in [-0.000001, -0.00000001, 0.00000001, 0.000001] {
            let target = threshold + offset
            var lower = 0.0, upper = 0.1
            for _ in 0..<60 {
                let mid = (lower + upper) / 2
                if endpoint(mid).2 < target { lower = mid } else { upper = mid }
            }
            let (lat, lon, apple) = endpoint((lower + upper) / 2)
            rows.append(["latitude": latitude, "longitude": longitude,
                "latitude2": lat, "longitude2": lon, "bearing": ray["bearing"]!,
                "appleMeters": apple, "targetAppleMeters": target])
        }
    }
}
FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: rows, options: [.sortedKeys]))
