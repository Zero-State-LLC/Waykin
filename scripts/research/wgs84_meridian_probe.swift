import Foundation
import CoreLocation

// Isolated mathematical experiment, not production code or parity fixtures.
// On a meridian, ellipsoidal distance is the integral of the meridional
// radius of curvature M(phi) = a(1-e²)/(1-e² sin²(phi))^(3/2).
let a = 6378137.0
let f = 1.0 / 298.257223563
let e2 = f * (2 - f)
func radius(_ phi: Double) -> Double {
    a * (1 - e2) / pow(1 - e2 * pow(sin(phi), 2), 1.5)
}
func meridian(_ start: Double, _ end: Double) -> Double {
    let n = 64
    let h = (end - start) / Double(n)
    var sum = radius(start) + radius(end)
    for i in 1..<n { sum += Double(i % 2 == 0 ? 2 : 4) * radius(start + Double(i) * h) }
    return abs(sum * h / 3)
}
var worst = 0.0
var count = 0
print("latitude,sphericalMeters,appleMeters,wgs84MeridianMeters,absoluteErrorMeters")
for latitude in [-80.0, -37.7749, 0, 37.7749, 80] {
    for meters in [-60.0, 0.551, 1.502, 10, 60, 500] {
        let start = latitude * .pi / 180
        let end = start + meters / 6371008.8
        let destination = end * 180 / .pi
        let apple = CLLocation(latitude: latitude, longitude: 0)
            .distance(from: CLLocation(latitude: destination, longitude: 0))
        let ellipsoid = meridian(start, end)
        let error = abs(apple - ellipsoid)
        worst = max(worst, error)
        count += 1
        print("\(latitude),\(meters),\(apple),\(ellipsoid),\(error)")
    }
}
print("SUMMARY cases=\(count) maximumAbsoluteErrorMeters=\(worst)")
