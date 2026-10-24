import Foundation
import WaykinCore

extension WaykinVectorExport {
    static func writeCompanionVectors(outDir: String, swiftTree: String) throws {
        let behaviors: [CompanionBehaviorState] = [.idle, .follow, .lead, .celebrate, .observe, .drawNear, .rest]
        let pursuits: [PursuitState] = [.inactive, .noticed, .approaching, .close, .fading]
        var presentations: [[String: Any]] = []
        for kind in WorldEventKind.allCases.map(Optional.some) + [nil] {
            for moving in [false, true] {
                let event = kind.map { WorldEvent(kind: $0, occurredAt: Date(timeIntervalSince1970: 0), intensity: 0.5, debugLabel: $0.rawValue) }
                let resolved = CompanionPresentationMatrix.resolve(event: event, moving: moving)
                var runtime = CompanionRuntime()
                runtime.apply(event: event)
                presentations.append([
                    "eventKind": kind.map { $0.rawValue as Any } ?? NSNull(), "moving": moving,
                    "expected": ["behavior": resolved.behavior.rawValue, "relativeDistance": resolved.relativeDistance,
                        "runtimeBehavior": runtime.state.rawValue, "runtimeDistance": runtime.relativeDistance]
                ])
            }
        }
        var overlays: [[String: Any]] = []
        for behavior in behaviors {
            for pursuit in pursuits {
                for relation in PathRelation.allCases {
                    for pressure in [0.0, 0.4.nextDown, 0.4, 0.7.nextDown, 0.7, 1.0, Double.nan] {
                        overlays.append([
                            "state": behavior.rawValue, "eventKind": NSNull(), "pursuitState": pursuit.rawValue,
                            "pathRelation": relation.rawValue, "pathIntegrityPressure": jsonDouble(pressure),
                            "expected": CompanionPresentationMatrix.arBehaviorString(state: behavior, event: nil,
                                pursuitState: pursuit, pathRelation: relation, pathIntegrityPressure: pressure)
                        ])
                    }
                }
            }
            for event in WorldEventKind.allCases {
                overlays.append([
                    "state": behavior.rawValue, "eventKind": event.rawValue, "pursuitState": "inactive",
                    "pathRelation": "offPath", "pathIntegrityPressure": 1.0,
                    "expected": CompanionPresentationMatrix.arBehaviorString(state: behavior, event: event,
                        pursuitState: .inactive, pathRelation: .offPath, pathIntegrityPressure: 1)
                ])
            }
        }
        var commands: [(CompanionCommand, [String: Any])] = behaviors.map {
            (.setBehavior($0.rawValue), ["kind": "setBehavior", "value": $0.rawValue])
        }
        commands += [(.setBehavior("FOLLOW"), ["kind": "setBehavior", "value": "FOLLOW"]),
            (.setBehavior(""), ["kind": "setBehavior", "value": ""])]
        for distance in [1.2, 0, -1, Double.nan, Double.infinity, -Double.infinity, 4] {
            commands.append((.setRelativeDistance(distance), ["kind": "setRelativeDistance", "value": jsonDouble(distance)]))
        }
        commands.append((.showMessage("hello"), ["kind": "showMessage", "value": "hello"]))
        commands.append((.setThreatLevel(0.9), ["kind": "setThreatLevel", "value": 0.9]))
        var runtime = CompanionRuntime()
        let steps: [[String: Any]] = commands.map { command, input in
            runtime.apply(command: command)
            return ["command": input, "expected": ["state": runtime.state.rawValue, "relativeDistance": runtime.relativeDistance]]
        }
        let object: [String: Any] = ["schemaVersion": 1, "family": "companion", "vectorId": "runtime-and-presentation",
            "source": ["generatedBy": "WaykinVectorExport", "swiftTree": swiftTree],
            "presentations": presentations, "overlays": overlays, "commandSteps": steps]
        try writeFamilyVector(object, family: "companion", name: "runtime-and-presentation", outDir: outDir)
    }

    static func writeFamilyVector(_ object: [String: Any], family: String, name: String, outDir: String) throws {
        let directory = URL(fileURLWithPath: outDir).appendingPathComponent(family)
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        var data = try JSONSerialization.data(withJSONObject: object, options: [.sortedKeys, .prettyPrinted, .withoutEscapingSlashes])
        data.append(0x0A)
        let url = directory.appendingPathComponent(name + ".json")
        try data.write(to: url)
        FileHandle.standardOutput.write(Data("wrote \(url.path)\n".utf8))
    }
}
