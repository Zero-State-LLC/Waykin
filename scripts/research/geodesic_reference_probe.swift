import Foundation
import CoreLocation

// Research only: writes stdout, never canonical Tests/Vectors.
// Spherical forward construction selects endpoints, not expected distances.
let radius = 6371008.8
var rows: [[String: Double]] = []
for latitude in [-89.999, -80, -37.7749, 0, 37.7749, 80, 89.999] {
    for longitude in [-179.999, 0, 179.999] {
        for bearing in stride(from: 0.0, to: 360.0, by: 45.0) {
            for distance in [0.549, 0.55, 0.551, 1.499, 1.5, 1.502, 60, 500] {
                let phi = latitude * .pi / 180
                let lambda = longitude * .pi / 180
                let theta = bearing * .pi / 180
                let delta = distance / radius
                let phi2 = asin(sin(phi) * cos(delta) + cos(phi) * sin(delta) * cos(theta))
                let lambda2 = lambda + atan2(sin(theta) * sin(delta) * cos(phi), cos(delta) - sin(phi) * sin(phi2))
                let lat2 = phi2 * 180 / .pi
                let lon2 = (lambda2 * 180 / .pi + 540).truncatingRemainder(dividingBy: 360) - 180
                let apple = CLLocation(latitude: latitude, longitude: longitude)
                    .distance(from: CLLocation(latitude: lat2, longitude: lon2))
                rows.append(["latitude": latitude, "longitude": longitude,
                    "latitude2": lat2, "longitude2": lon2, "bearing": bearing,
                    "constructedSphericalMeters": distance, "appleMeters": apple])
            }
        }
    }
}
let data = try JSONSerialization.data(withJSONObject: rows, options: [.sortedKeys])
FileHandle.standardOutput.write(data)
