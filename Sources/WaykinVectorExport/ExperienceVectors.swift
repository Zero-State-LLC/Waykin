import Foundation
import WaykinCore

extension WaykinVectorExport {
    static func eventJSON(_ event: WorldEvent) -> [String: Any] {
        ["kind": event.kind.rawValue, "intensity": event.intensity, "debugLabel": event.debugLabel,
         "occurredAt": event.occurredAt.timeIntervalSinceReferenceDate]
    }
    static func cueJSON(_ cue: AudioCue) -> [String: Any] {
        ["kind": cue.kind.rawValue, "intensity": cue.intensity,
         "spatialBias": cue.spatialBias.map { $0.rawValue as Any } ?? NSNull(), "priority": cue.priority,
         "cooldownGroup": cue.cooldownGroup, "shouldFade": cue.shouldFade, "debugLabel": cue.debugLabel]
    }
    static func experienceStateJSON(_ state: ExperienceSessionState) -> [String: Any] {
        guard case .companionWalk(let walk) = state.runtimeState else {
            return ["runtimeState": NSNull(), "narrative": state.narrative]
        }
        let world: Any = walk.worldState.map { world -> [String: Any] in
            var value = renderState(world)
            value["timeContext"] = world.timeContext.rawValue
            value["currentSpeedMetersPerSecond"] = world.currentSpeedMetersPerSecond
            value["sessionDistanceMeters"] = world.sessionDistanceMeters
            value["lastEventAt"] = world.lastEventAt.map { $0.timeIntervalSinceReferenceDate as Any } ?? NSNull()
            return value
        } ?? NSNull()
        var fired: [String: Any] = [:]
        for (kind, elapsed) in walk.lastEventElapsedByKind { fired[kind.rawValue] = elapsed }
        let value: [String: Any] = ["accumulatedBondProgress": walk.accumulatedBondProgress,
            "movementSeconds": walk.movementSeconds, "milestoneIndex": walk.milestoneIndex, "tone": walk.tone,
            "worldState": world, "pursuitState": walk.pursuitState.rawValue,
            "lastEvent": walk.lastEvent.map(eventJSON) ?? NSNull(),
            "lastEventElapsed": walk.lastEventElapsed.map { $0 as Any } ?? NSNull(),
            "lastEventElapsedByKind": fired, "eventHistory": walk.eventHistory.map(eventJSON),
            "activeAudioCues": walk.activeAudioCues.map(cueJSON),
            "lastPresentedBehavior": walk.lastPresentedBehavior.map { $0 as Any } ?? NSNull(),
            "lastBehaviorAudioElapsed": walk.lastBehaviorAudioElapsed.map { $0 as Any } ?? NSNull()]
        return ["runtimeState": ["kind": "companionWalk", "value": value], "narrative": state.narrative]
    }
    static func updateJSON(_ update: ExperienceUpdate) -> [String: Any] {
        let commands: [[String: Any]] = update.companionCommands.map { command in
            switch command {
            case .showMessage(let value): return ["kind": "showMessage", "value": value]
            case .setBehavior(let value): return ["kind": "setBehavior", "value": value]
            case .setRelativeDistance(let value): return ["kind": "setRelativeDistance", "value": value]
            case .setThreatLevel(let value): return ["kind": "setThreatLevel", "value": value]
            }
        }
        return ["state": experienceStateJSON(update.state), "companionCommands": commands,
            "audioCues": update.audioCues, "semanticAudioCues": update.semanticAudioCues.map(cueJSON),
            "narrativeEvents": update.narrativeEvents, "rewardEvents": update.rewardEvents]
    }
    static func resultJSON(_ result: ExperienceResult) -> [String: Any] {
        ["outcome": result.outcome, "bondDelta": result.bondDelta, "memoryText": result.memoryText]
    }
    static func writeExperienceVectors(outDir: String, swiftTree: String) throws {
        let experience = CompanionWalkExperience()
        let pursuits: [PursuitState] = [.inactive, .noticed, .approaching, .close, .fading]
        var runs: [[String: Any]] = []
        for (runIndex, pursuit) in pursuits.enumerated() {
            let seed: UInt64 = runIndex == 0 ? 0 : runIndex == 1 ? UInt64.max : 42
            let context = ExperienceContext(timeOfDay: runIndex % 2 == 0 ? "day" : "night", activity: .walk,
                bondLevel: 12, eventSeed: seed, activityEnergyHint: runIndex == 4 ? 0.8 : 0)
            var state = experience.start(context: context)
            if case .companionWalk(var walk) = state.runtimeState {
                walk.pursuitState = pursuit
                state.runtimeState = .companionWalk(walk)
            }
            let initial = experienceStateJSON(state)
            var steps: [[String: Any]] = []
            for index in 0..<96 {
                let paused = index % 12 >= 8
                let speed = paused ? 0.0 : index % 3 == 0 ? 0.8 : 1.5
                let delta = paused ? 0.0 : speed * 40
                let seconds = 1000.0 + Double(index) * 40
                let movement = MovementSnapshot(timestamp: Date(timeIntervalSinceReferenceDate: seconds),
                    speed: speed, distanceDelta: delta, isMoving: !paused)
                let update = experience.update(previousState: state, movement: movement, context: context)
                state = update.state
                steps.append(["index": index, "movement": ["timestamp": seconds, "speed": speed,
                    "distanceDelta": delta, "isMoving": !paused], "expected": updateJSON(update)])
            }
            runs.append(["initialPursuit": pursuit.rawValue, "context": ["timeOfDay": context.timeOfDay,
                "activity": "walk", "bondLevel": context.bondLevel, "eventSeed": String(seed),
                "activityEnergyHint": context.activityEnergyHint], "initialState": initial, "steps": steps])
        }
        let source = ["generatedBy": "WaykinVectorExport", "swiftTree": swiftTree]
        try writeFamilyVector(["schemaVersion": 1, "family": "pursuit", "vectorId": "walk-experience",
            "source": source, "runs": runs], family: "pursuit", name: "walk-experience", outDir: outDir)

        let histories: [[WorldEventKind]] = [[], [.bondMoment], [.companionObserves], [.companionDrawsNear],
            [.distantPresence], [.distantPresence, .pursuitFades],
            [.companionObserves, .companionDrawsNear, .distantPresence, .pursuitFades]]
        var results: [[String: Any]] = []
        for kinds in histories {
            for progress in [0.0, 0.9, 1, 1.999999, 2, 12.5] {
                let walk = CompanionWalkState(accumulatedBondProgress: progress, movementSeconds: 0,
                    milestoneIndex: 0, tone: "curious", eventHistory: kinds.map {
                        WorldEvent(kind: $0, occurredAt: Date(timeIntervalSinceReferenceDate: 0), intensity: 0.5, debugLabel: $0.rawValue)
                    })
                var session = MovementSession(activityType: .walk, experienceID: "companion_walk",
                    startedAt: Date(timeIntervalSinceReferenceDate: 0))
                session.distanceMeters = 123.9
                results.append(["eventKinds": kinds.map { $0.rawValue }, "progress": progress, "distanceMeters": 123.9,
                    "expected": resultJSON(experience.finish(state: ExperienceSessionState(runtimeState: .companionWalk(walk)), session: session))])
            }
        }
        let companion = CanonicalCompanionIdentity.defaultCompanion()
        try writeFamilyVector(["schemaVersion": 1, "family": "bond-memory", "vectorId": "finish-and-identity",
            "source": source, "defaultCompanion": ["id": companion.id.uuidString, "name": companion.name,
                "archetype": companion.archetype, "bondLevel": companion.bondLevel, "lastSessionID": NSNull(), "memories": []],
            "cases": results], family: "bond-memory", name: "finish-and-identity", outDir: outDir)
    }
}
