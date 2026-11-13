import Foundation
import CoreLocation
import CoreFoundation

var researchUseCandidate = false
func researchDistance(_ lhs: LocationSample, _ rhs: LocationSample) -> Double {
    researchUseCandidate
        ? PortableGeodesic.distance(lhs.latitude, lhs.longitude, rhs.latitude, rhs.longitude)
        : CLLocation(latitude: lhs.latitude, longitude: lhs.longitude)
            .distance(from: CLLocation(latitude: rhs.latitude, longitude: rhs.longitude))
}
func number(_ value: Any?) -> Double {
    guard let text = value as? String, text.hasPrefix("bits:"),
          let bits = UInt64(text.dropFirst(5), radix: 16) else { fatalError("Expected exact input bits") }
    return Double(bitPattern: bits)
}
func encoded(_ value: Any) -> Any {
    if let v = value as? [String: Any] { return v.mapValues(encoded) }
    if let v = value as? [Any] { return v.map(encoded) }
    if let v = value as? NSNumber, CFGetTypeID(v) != CFBooleanGetTypeID() {
        return "bits:" + String(format: "%016llx", v.doubleValue.bitPattern)
    }
    return value
}
final class ResearchClock: ClockProviding { var now = Date(timeIntervalSinceReferenceDate: 0) }
func pointJSON(_ p: RoutePoint) -> [String: Any] {
    ["timestamp": p.timestamp.timeIntervalSinceReferenceDate, "latitude": p.latitude,
     "longitude": p.longitude, "altitude": p.altitude.map { $0 as Any } ?? NSNull(), "speed": p.speed]
}
func sessionJSON(_ s: MovementSession?) -> Any {
    guard let s else { return NSNull() }
    return ["activityType": s.activityType.rawValue, "experienceID": s.experienceID,
        "startedAt": s.startedAt.timeIntervalSinceReferenceDate,
        "endedAt": s.endedAt.map { $0.timeIntervalSinceReferenceDate as Any } ?? NSNull(),
        "elapsedTime": s.elapsedTime, "activeTime": s.activeTime, "distanceMeters": s.distanceMeters,
        "currentSpeedMetersPerSecond": s.currentSpeedMetersPerSecond,
        "averageSpeedMetersPerSecond": s.averageSpeedMetersPerSecond,
        "movementState": s.movementState.rawValue, "routeCount": s.routePoints.count,
        "lastPoint": s.routePoints.last.map(pointJSON) ?? NSNull()] as [String: Any]
}
func errorJSON(_ error: Error) -> String {
    guard let e = error as? MovementError else { fatalError("Unexpected error: \(error)") }
    switch e {
    case .noActiveSession: return "noActiveSession"
    case .sessionAlreadyActive: return "sessionAlreadyActive"
    case .invalidTransition(let from, let to): return "invalidTransition:\(from.rawValue):\(to.rawValue)"
    }
}
func replay(_ input: [String: Any], candidate: Bool) -> [[String: Any]] {
    researchUseCandidate = candidate
    let clock = ResearchClock(), engine = MovementEngine(clock: clock), experience = CompanionWalkExperience()
    let context = ExperienceContext(timeOfDay: input["timeOfDay"] as! String, activity: .walk,
        bondLevel: 12, eventSeed: UInt64(input["seed"] as! String)!)
    var state = experience.start(context: context)
    return (input["steps"] as! [[String: Any]]).map { step in
        clock.now = Date(timeIntervalSinceReferenceDate: number(step["time"]))
        var error: Any = NSNull(), update: Any = NSNull(), result: Any = NSNull(), ended: Any = NSNull()
        var diagnostic: Any = NSNull(), snapshot: Any = NSNull(), endedRoute: Any = NSNull()
        do {
            switch step["op"] as! String {
            case "start":
                try engine.startSession(activity: .walk, experienceID: "companion_walk")
                state = experience.start(context: context)
            case "pause": try engine.pauseSession()
            case "resume": try engine.resumeSession()
            case "end":
                let session = try engine.endSession()
                ended = sessionJSON(session); endedRoute = session.routePoints.map(pointJSON)
                result = WaykinVectorExport.resultJSON(experience.finish(state: state, session: session))
            case "sample":
                let sample = LocationSample(timestamp: clock.now, latitude: number(step["latitude"]),
                    longitude: number(step["longitude"]), horizontalAccuracy: number(step["accuracy"]),
                    reportedSpeedMetersPerSecond: number(step["speed"]))
                let r = engine.ingestRealLocationSample(sample,
                    receivedAt: Date(timeIntervalSinceReferenceDate: number(step["receivedAt"])))
                diagnostic = ["timestamp": r.diagnostic.timestamp.timeIntervalSinceReferenceDate,
                    "disposition": r.diagnostic.disposition.rawValue,
                    "accuracyBucket": r.diagnostic.accuracyBucket.rawValue,
                    "derivedSpeedMetersPerSecond": r.diagnostic.derivedSpeedMetersPerSecond,
                    "accumulatedDistance": r.diagnostic.accumulatedDistance]
                if let movement = r.snapshot {
                    snapshot = ["timestamp": movement.timestamp.timeIntervalSinceReferenceDate,
                        "speed": movement.speed, "distanceDelta": movement.distanceDelta, "isMoving": movement.isMoving]
                    let next = experience.update(previousState: state, movement: movement, context: context)
                    state = next.state; update = WaykinVectorExport.updateJSON(next)
                }
            default: fatalError("Unknown operation")
            }
        } catch let caught { error = errorJSON(caught) }
        return ["error": error, "session": sessionJSON(engine.currentSession), "ended": ended,
            "endedRoute": endedRoute, "result": result, "diagnostic": diagnostic, "snapshot": snapshot,
            "update": update, "experience": WaykinVectorExport.experienceStateJSON(state),
            "accepted": engine.acceptedSampleCount, "rejected": engine.rejectedSampleCount]
    }
}
@main struct LifecycleProbe {
    static func main() throws {
        let input = try JSONSerialization.jsonObject(with: Data(contentsOf:
            URL(fileURLWithPath: CommandLine.arguments[1]))) as! [[String: Any]]
        precondition(input.count == 1, "Each lifecycle case requires a fresh process")
        let output = input.map { row in
            let prefix = row["applePrefix"] as! [[String: Any]]
            let warmup = prefix.map { pair in
                CLLocation(latitude: number(pair["latitude"]), longitude: number(pair["longitude"]))
                    .distance(from: CLLocation(latitude: number(pair["latitude2"]), longitude: number(pair["longitude2"])))
            }
            return ["id": row["id"]!, "warmup": warmup, "apple": replay(row, candidate: false),
                "candidate": replay(row, candidate: true)] as [String: Any]
        }
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: encoded(output), options: [.sortedKeys]))
    }
}
