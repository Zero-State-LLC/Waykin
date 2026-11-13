import Foundation
import WaykinCore

extension WaykinVectorExport {
    /// Demo owns real clock/UUID creation in Swift. They do not affect gameplay;
    /// omit only those nondeterministic event-time fields from this projection.
    static func withoutEventClock(_ value: Any) -> Any {
        if let dictionary = value as? [String: Any] {
            return dictionary.filter { !["occurredAt", "lastEventAt"].contains($0.key) }
                .mapValues(withoutEventClock)
        }
        if let array = value as? [Any] { return array.map(withoutEventClock) }
        return value
    }
    @MainActor
    static func demoSnapshot(_ demo: DemoSessionController) -> [String: Any] {
        let walk: Any = demo.companionWalkState.map {
            withoutEventClock(experienceStateJSON(ExperienceSessionState(runtimeState: .companionWalk($0)))["runtimeState"]!)
        } ?? NSNull()
        let session: Any = demo.movementEngine.currentSession.map { session -> [String: Any] in
            ["movementState": session.movementState.rawValue, "elapsedTime": session.elapsedTime,
             "activeTime": session.activeTime, "distanceMeters": session.distanceMeters,
             "currentSpeedMetersPerSecond": session.currentSpeedMetersPerSecond,
             "averageSpeedMetersPerSecond": session.averageSpeedMetersPerSecond,
             "route": session.routePoints.map { ["latitude": $0.latitude, "longitude": $0.longitude,
                "altitude": $0.altitude.map { $0 as Any } ?? NSNull(), "speed": $0.speed] }]
        } ?? NSNull()
        return ["isRunning": demo.isRunning, "isPaused": demo.isPaused, "tickIndex": demo.tickIndex,
            "scenarioID": demo.currentScenario.map { $0.id.rawValue as Any } ?? NSNull(),
            "currentEvent": demo.currentEvent.map { withoutEventClock(eventJSON($0)) } ?? NSNull(),
            "currentAudioCue": demo.currentAudioCue.map(cueJSON) ?? NSNull(),
            "companionRuntime": ["state": demo.companionRuntime.state.rawValue, "relativeDistance": demo.companionRuntime.relativeDistance],
            "walk": walk, "session": session]
    }
    @MainActor
    static func writeDemoVectors(outDir: String, swiftTree: String) throws {
        let demo = DemoSessionController(movementEngine: MovementEngine())
        let actions = ["start", "pause", "runToEnd", "resume", "advance", "pause", "advance", "runToEnd", "resume"]
            + Array(repeating: "advance", count: 6) + ["runToEnd", "end", "end"]
        var frames: [[String: Any]] = []
        for action in actions {
            var ended: Any = NSNull()
            switch action {
            case "start": try demo.start(scenarioID: .calmDayWalk)
            case "pause": demo.pause()
            case "resume": demo.resume()
            case "advance": demo.advanceOneTick()
            case "runToEnd": demo.runToEnd()
            case "end":
                let (_, result, summary) = demo.end()
                ended = ["result": result.map { resultJSON($0) as Any } ?? NSNull(),
                    "summary": summary.map { summary -> Any in
                        ["activity": summary.activity.rawValue, "experience": summary.experience,
                         "variant": summary.variant, "duration": summary.duration, "activeTime": summary.activeTime,
                         "distanceMeters": summary.distanceMeters, "averageSpeed": summary.averageSpeed,
                         "outcome": summary.outcome, "bondDelta": summary.bondDelta, "memoryText": summary.memory.text]
                    } ?? NSNull()]
            default: preconditionFailure("Unknown demo vector action")
            }
            frames.append(["action": action, "expected": demoSnapshot(demo), "ended": ended])
        }
        try writeFamilyVector(["schemaVersion": 1, "family": "demo", "vectorId": "pause-and-complete",
            "source": ["generatedBy": "WaykinVectorExport", "swiftTree": swiftTree], "frames": frames],
            family: "demo", name: "pause-and-complete", outDir: outDir)
    }
}
