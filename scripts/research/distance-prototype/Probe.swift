import Foundation
import CoreLocation

// Native research backend only; geodesic.h is supplied to swiftc externally.
// This is a Swift-facing C prototype, not a pure-Swift transcription.
func candidateDistance(_ lat1: Double, _ lon1: Double, _ lat2: Double, _ lon2: Double) -> Double {
    guard [lat1, lon1, lat2, lon2].allSatisfy({ $0.isFinite }),
          abs(lat1) <= 90, abs(lat2) <= 90, abs(lon1) <= 180, abs(lon2) <= 180 else { return .nan }
    var geodesic = geod_geodesic()
    geod_init(&geodesic, 6378137.0, 1.0 / 298.257223563)
    var meters = 0.0
    geod_inverse(&geodesic, lat1, lon1, lat2, lon2, &meters, nil, nil)
    return meters
}

// Used only by the mechanically instrumented temporary processor.
var researchUseCandidate = false
func researchDistance(_ lhs: LocationSample, _ rhs: LocationSample) -> Double {
    if researchUseCandidate {
        return candidateDistance(lhs.latitude, lhs.longitude, rhs.latitude, rhs.longitude)
    }
    return CLLocation(latitude: lhs.latitude, longitude: lhs.longitude)
        .distance(from: CLLocation(latitude: rhs.latitude, longitude: rhs.longitude))
}

func number(_ value: Any?) -> Double {
    if let text = value as? String, text.hasPrefix("bits:") {
        return Double(bitPattern: UInt64(text.dropFirst(5), radix: 16)!)
    }
    if let n = value as? NSNumber { return n.doubleValue }
    switch value as? String {
    case "NaN": return .nan
    case "Infinity": return .infinity
    case "-Infinity": return -.infinity
    default: fatalError("Invalid research number")
    }
}
func encode(_ n: Double) -> Any {
    "bits:" + String(format: "%016llx", n.bitPattern)
}
func projection(_ s: StabilizedMovementSample) -> [String: Any] {
    ["sampleInterval": encode(s.sampleInterval), "distanceDelta": encode(s.distanceDelta),
     "isMoving": s.isMoving, "hasPoint": s.point != nil,
     "speed": encode(s.diagnostic.derivedSpeedMetersPerSecond),
     "disposition": s.diagnostic.disposition.rawValue,
     "accuracyBucket": s.diagnostic.accuracyBucket.rawValue,
     "accumulatedDistance": s.diagnostic.accumulatedDistance]
}
func replay(_ sequence: [String: Any], candidate: Bool) -> [[String: Any]] {
    researchUseCandidate = candidate
    var processor = MovementIntegrityProcessor()
    return (sequence["steps"] as! [[String: Any]]).map { step in
        if step["reset"] as? Bool == true { processor.resetAnchor() }
        let time = number(step["timestamp"])
        let sample = LocationSample(timestamp: Date(timeIntervalSince1970: time),
            latitude: number(step["latitude"]), longitude: number(step["longitude"]),
            horizontalAccuracy: number(step["accuracy"]),
            reportedSpeedMetersPerSecond: number(step["reportedSpeed"]))
        return projection(processor.process(sample,
            receivedAt: Date(timeIntervalSince1970: number(step["receivedAt"]))))
    }
}

@main
struct Probe {
    static func main() throws {
        let input = try JSONSerialization.jsonObject(with: Data(contentsOf:
            URL(fileURLWithPath: CommandLine.arguments[1]))) as! [String: Any]
        let distances = (input["pairs"] as! [[String: Any]]).map { row -> [String: Any] in
            let lat1 = number(row["latitude"]), lon1 = number(row["longitude"])
            let lat2 = number(row["latitude2"]), lon2 = number(row["longitude2"])
            let valid = [lat1, lon1, lat2, lon2].allSatisfy { $0.isFinite }
                && abs(lat1) <= 90 && abs(lat2) <= 90 && abs(lon1) <= 180 && abs(lon2) <= 180
            let apple = valid ? CLLocation(latitude: lat1, longitude: lon1)
                .distance(from: CLLocation(latitude: lat2, longitude: lon2)) : Double.nan
            return ["id": row["id"]!, "candidate": encode(candidateDistance(lat1, lon1, lat2, lon2)),
                    "apple": encode(apple)]
        }
        let sequences = (input["sequences"] as! [[String: Any]]).map { row in
            ["id": row["id"]!, "apple": replay(row, candidate: false),
             "candidate": replay(row, candidate: true)] as [String: Any]
        }
        let data = try JSONSerialization.data(withJSONObject:
            ["distances": distances, "sequences": sequences], options: [.sortedKeys])
        FileHandle.standardOutput.write(data)
    }
}
