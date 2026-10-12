import Foundation
import WaykinCore

@main
struct WaykinVectorExport {

    // MARK: - Entry

    static func main() throws {
        var outDir = "Tests/Vectors"
        var commitArg: String?
        let args = Array(CommandLine.arguments.dropFirst())
        var i = 0
        while i < args.count {
            switch args[i] {
            case "--out":
                i += 1; if i < args.count { outDir = args[i] }
            case "--commit":
                i += 1; if i < args.count { commitArg = args[i] }
            default:
                break
            }
            i += 1
        }
        let env = ProcessInfo.processInfo.environment["WAYKIN_SWIFT_COMMIT"]
        let swiftCommit = commitArg
            ?? (env.flatMap { $0.isEmpty ? nil : $0 })
            ?? gitShortCommit()
            ?? "0000000"

        let seedDir = URL(fileURLWithPath: outDir).appendingPathComponent("seed-event")
        try FileManager.default.createDirectory(at: seedDir, withIntermediateDirectories: true)

        for v in buildAllVectors() {
            let obj = renderVector(v, swiftCommit: swiftCommit)
            let data = try JSONSerialization.data(
                withJSONObject: obj,
                options: [.sortedKeys, .prettyPrinted, .withoutEscapingSlashes]
            )
            var bytes = data
            bytes.append(0x0A)
            let url = seedDir.appendingPathComponent("\(v.vectorId).json")
            try bytes.write(to: url)
            FileHandle.standardOutput.write(Data("wrote \(url.path)\n".utf8))
        }
    }

    static func gitShortCommit() -> String? {
        let p = Process()
        p.executableURL = URL(fileURLWithPath: "/usr/bin/env")
        p.arguments = ["git", "rev-parse", "--short=12", "HEAD"]
        let out = Pipe()
        p.standardOutput = out
        p.standardError = Pipe()
        do { try p.run() } catch { return nil }
        p.waitUntilExit()
        guard p.terminationStatus == 0 else { return nil }
        let data = out.fileHandleForReading.readDataToEndOfFile()
        guard let s = String(data: data, encoding: .utf8)?
            .trimmingCharacters(in: .whitespacesAndNewlines),
              !s.isEmpty else { return nil }
        return s
    }

    // MARK: - Spec types

    struct StateSpec {
        var active: TimeInterval
        var energy: Double
        var pressure: Double
        var familiarity: Double
        var bond: Int
        var movement: MovementState
    }

    struct StepSpec {
        var state: StateSpec
        var elapsed: Double?
        var allowedKinds: Set<WorldEventKind>?
        var extLastGen: Double?
        var extFired: [WorldEventKind: Double]
        init(state: StateSpec,
             elapsed: Double? = nil,
             allowedKinds: Set<WorldEventKind>? = nil,
             extLastGen: Double? = nil,
             extFired: [WorldEventKind: Double] = [:]) {
            self.state = state
            self.elapsed = elapsed
            self.allowedKinds = allowedKinds
            self.extLastGen = extLastGen
            self.extFired = extFired
        }
    }

    struct VectorSpec {
        var vectorId: String
        var description: String
        var seed: UInt64
        var config: WorldEventGeneratorConfiguration
        var steps: [StepSpec]
    }

    static func st(_ active: TimeInterval, _ e: Double, _ p: Double, _ f: Double, _ b: Int, _ m: MovementState) -> StateSpec {
        StateSpec(active: active, energy: e, pressure: p, familiarity: f, bond: b, movement: m)
    }

    static func sp(_ s: StateSpec,
                   elapsed: Double? = nil,
                   allowed: Set<WorldEventKind>? = nil,
                   extGen: Double? = nil,
                   extFired: [WorldEventKind: Double] = [:]) -> StepSpec {
        StepSpec(state: s, elapsed: elapsed, allowedKinds: allowed, extLastGen: extGen, extFired: extFired)
    }

    // MARK: - JSON helpers

    static func jsonDouble(_ d: Double) -> Any {
        if d.isNaN { return "NaN" }
        if d.isInfinite { return d > 0 ? "Infinity" : "-Infinity" }
        return NSNumber(value: d)
    }

    static func renderConfig(_ c: WorldEventGeneratorConfiguration) -> [String: Any] {
        [
            "minimumTickSpacing": jsonDouble(c.minimumTickSpacing),
            "rules": c.rules.map { r -> [String: Any] in
                [
                    "kind": r.kind.rawValue,
                    "minimumEnergy": jsonDouble(r.minimumEnergy),
                    "minimumPressure": jsonDouble(r.minimumPressure),
                    "maximumPressure": jsonDouble(r.maximumPressure),
                    "minimumFamiliarity": jsonDouble(r.minimumFamiliarity),
                    "minimumBondLevel": r.minimumBondLevel,
                    "weight": String(r.weight),
                    "cooldown": jsonDouble(r.cooldown)
                ]
            }
        ]
    }

    static func renderState(_ s: WorldState) -> [String: Any] {
        [
            "energy": jsonDouble(s.energy),
            "pressure": jsonDouble(s.pressure),
            "familiarity": jsonDouble(s.familiarity),
            "bondLevel": s.bondLevel,
            "movementState": s.movementState.rawValue,
            "activeTime": jsonDouble(s.activeTime)
        ]
    }

    // MARK: - Rendering

    static func renderVector(_ v: VectorSpec, swiftCommit: String) -> [String: Any] {
        var streamGen = SeededRandomNumberGenerator(seed: v.seed)
        let rngStream: [String] = (0..<8).map { _ in String(streamGen.next()) }

        var G = WorldEventGenerator(seed: v.seed, configuration: v.config)
        var R = SeededRandomNumberGenerator(seed: v.seed)
        var stepsArr: [[String: Any]] = []
        for (idx, s) in v.steps.enumerated() {
            stepsArr.append(renderStep(idx: idx, s: s, config: v.config, G: &G, R: &R))
        }

        var dict: [String: Any] = [
            "schemaVersion": 1,
            "vectorId": v.vectorId,
            "description": v.description,
            "source": [
                "generatedBy": "WaykinVectorExport",
                "swiftCommit": swiftCommit
            ],
            "seed": String(v.seed),
            "config": renderConfig(v.config),
            "rngStream": rngStream,
            "steps": stepsArr
        ]
        dict = dict // silence
        return dict
    }

    static func renderStep(
        idx: Int,
        s: StepSpec,
        config: WorldEventGeneratorConfiguration,
        G: inout WorldEventGenerator,
        R: inout SeededRandomNumberGenerator
    ) -> [String: Any] {
        let nowSeconds = 1000.0 + Double(idx)
        let now = Date(timeIntervalSinceReferenceDate: nowSeconds)

        let ws = WorldState(
            timeContext: .midday,
            movementState: s.state.movement,
            currentSpeedMetersPerSecond: 0,
            sessionDistanceMeters: 0,
            activeTime: s.state.active,
            bondLevel: s.state.bond,
            familiarity: s.state.familiarity,
            energy: s.state.energy,
            pressure: s.state.pressure
        )

        var eligibleKinds: [WorldEventKind] = []
        for rule in config.rules {
            if let allowed = s.allowedKinds, !allowed.contains(rule.kind) { continue }
            var copy = G
            let probe = copy.evaluate(
                state: ws,
                now: now,
                elapsed: s.elapsed,
                lastGeneratedAtElapsed: s.extLastGen,
                lastFiredAtElapsedByKind: s.extFired,
                allowedKinds: [rule.kind]
            )
            if probe != nil { eligibleKinds.append(rule.kind) }
        }

        let event = G.evaluate(
            state: ws,
            now: now,
            elapsed: s.elapsed,
            lastGeneratedAtElapsed: s.extLastGen,
            lastFiredAtElapsedByKind: s.extFired,
            allowedKinds: s.allowedKinds
        )

        var rngDraws: [String] = []
        var totalWeightVal: Any = NSNull()
        var pickVal: Any = NSNull()
        var eventVal: Any = NSNull()

        if let ev = event {
            let draw = R.next()
            rngDraws.append(String(draw))
            let eligibleRules = eligibleKinds.compactMap { k -> WorldEventRule? in
                config.rules.first { $0.kind == k }
            }
            let total = eligibleRules.reduce(UInt64(0)) { $0 &+ $1.weight }
            let pick = draw % total
            totalWeightVal = String(total)
            pickVal = String(pick)

            var cursor: UInt64 = 0
            var chosen: WorldEventKind?
            for rule in eligibleRules {
                cursor &+= rule.weight
                if pick < cursor { chosen = rule.kind; break }
            }
            guard let c = chosen, c == ev.kind else {
                fatalError("cursor mismatch at step \(idx): chosen=\(String(describing: chosen)) kind=\(ev.kind) vectorId=\(config.rules.count)")
            }

            let eventDict: [String: Any] = [
                "kind": ev.kind.rawValue,
                "intensity": jsonDouble(ev.intensity),
                "debugLabel": ev.debugLabel
            ]
            eventVal = eventDict
        }

        let expected: [String: Any] = [
            "eligibleKinds": eligibleKinds.map { $0.rawValue },
            "rngDraws": rngDraws,
            "totalWeight": totalWeightVal,
            "pick": pickVal,
            "event": eventVal
        ]

        var stepDict: [String: Any] = [
            "index": idx,
            "nowSeconds": jsonDouble(nowSeconds),
            "state": renderState(ws),
            "expected": expected
        ]

        if let e = s.elapsed {
            stepDict["elapsed"] = jsonDouble(e)
        }
        if let a = s.allowedKinds {
            let sortedKinds = WorldEventKind.allCases.filter { a.contains($0) }
            stepDict["allowedKinds"] = sortedKinds.map { $0.rawValue }
        }
        if let g = s.extLastGen {
            stepDict["externalLastGeneratedAtElapsed"] = jsonDouble(g)
        }
        if !s.extFired.isEmpty {
            var d: [String: Any] = [:]
            for (k, v) in s.extFired { d[k.rawValue] = jsonDouble(v) }
            stepDict["externalLastFiredAtElapsedByKind"] = d
        }
        return stepDict
    }

    // MARK: - Seed search

    static func findBoundarySeed(weights: [UInt64], targetPick: UInt64) -> UInt64 {
        let total = weights.reduce(UInt64(0)) { $0 &+ $1 }
        for s in UInt64(1)...100000 {
            var r = SeededRandomNumberGenerator(seed: s)
            if r.next() % total == targetPick { return s }
        }
        fatalError("no boundary seed found for weights=\(weights) target=\(targetPick)")
    }

    // MARK: - Vectors

    static func buildAllVectors() -> [VectorSpec] {
        var out: [VectorSpec] = []
        out.append(vectorSeedZeroDefaultRules())
        out.append(vectorSeedMaxUInt64())
        out.append(vectorSeed12345Walk())
        out.append(vectorCooldownBoundary())
        out.append(vectorTickSpacingBoundary())
        out.append(vectorAllowedKinds())
        out.append(vectorExternalLastFire())
        out.append(vectorNonFiniteElapsed())
        out.append(contentsOf: vectorWeightBoundary())
        out.append(vectorMovementStates())
        return out
    }

    static func vectorSeedZeroDefaultRules() -> VectorSpec {
        let config = WorldEventGeneratorConfiguration()
        let steps: [StepSpec] = [
            sp(st(0,   0.30, 0.20, 0.10, 3,  .moving)),
            sp(st(10,  0.30, 0.20, 0.10, 3,  .moving)),
            sp(st(40,  0.35, 0.25, 0.15, 4,  .moving)),
            sp(st(45,  0.40, 0.30, 0.20, 4,  .moving)),
            sp(st(80,  0.50, 0.35, 0.25, 5,  .moving)),
            sp(st(120, 0.55, 0.40, 0.30, 6,  .moving)),
            sp(st(160, 0.60, 0.50, 0.35, 7,  .moving)),
            sp(st(200, 0.55, 0.60, 0.40, 8,  .moving)),
            sp(st(250, 0.45, 0.55, 0.45, 9,  .moving)),
            sp(st(300, 0.60, 0.65, 0.50, 10, .moving)),
            sp(st(350, 0.40, 0.30, 0.55, 11, .paused)),
            sp(st(400, 0.35, 0.20, 0.60, 12, .moving))
        ]
        return VectorSpec(
            vectorId: "seed-zero-default-rules",
            description: "Seed 0 with default rules across a 400s walk with varying state.",
            seed: 0,
            config: config,
            steps: steps
        )
    }

    static func vectorSeedMaxUInt64() -> VectorSpec {
        let config = WorldEventGeneratorConfiguration()
        let steps: [StepSpec] = [
            sp(st(0,   0.30, 0.20, 0.10, 3,  .moving)),
            sp(st(50,  0.55, 0.35, 0.20, 5,  .moving)),
            sp(st(150, 0.60, 0.65, 0.30, 8,  .moving)),
            sp(st(300, 0.50, 0.30, 0.55, 12, .paused)),
            sp(st(500, 0.35, 0.85, 0.65, 14, .moving))
        ]
        return VectorSpec(
            vectorId: "seed-max-uint64",
            description: "Seed 18446744073709551615 (UInt64.max) with default rules.",
            seed: UInt64.max,
            config: config,
            steps: steps
        )
    }

    static func vectorSeed12345Walk() -> VectorSpec {
        let config = WorldEventGeneratorConfiguration()
        var steps: [StepSpec] = []
        for i in 0..<30 {
            let active = Double(i) * 15.0
            let t = Double(i) / 29.0
            let energy = 0.05 + 0.55 * t
            let pressure = 0.05 + 0.60 * t
            let fam = min(1.0, t * 1.5)
            let bond = Int((t * 12.0).rounded(.down))
            steps.append(sp(st(active, energy, pressure, fam, bond, .moving)))
        }
        return VectorSpec(
            vectorId: "seed-12345-default-walk",
            description: "Seed 12345, 30 steps at 15s intervals with ramping state.",
            seed: 12345,
            config: config,
            steps: steps
        )
    }

    static func vectorCooldownBoundary() -> VectorSpec {
        let rule = WorldEventRule(kind: .quietInterval, weight: 1, cooldown: 20)
        let config = WorldEventGeneratorConfiguration(minimumTickSpacing: 0, rules: [rule])
        let nd = (20.0).nextDown
        let steps: [StepSpec] = [
            sp(st(0,      0.5, 0.5, 0.5, 5, .moving)),
            sp(st(19,     0.5, 0.5, 0.5, 5, .moving)),
            sp(st(nd,     0.5, 0.5, 0.5, 5, .moving)),
            sp(st(20,     0.5, 0.5, 0.5, 5, .moving)),
            sp(st(39.999, 0.5, 0.5, 0.5, 5, .moving)),
            sp(st(40,     0.5, 0.5, 0.5, 5, .moving))
        ]
        return VectorSpec(
            vectorId: "cooldown-boundary",
            description: "Cooldown boundary: exact cooldown is eligible; just under is not.",
            seed: 0,
            config: config,
            steps: steps
        )
    }

    static func vectorTickSpacingBoundary() -> VectorSpec {
        let rule = WorldEventRule(kind: .quietInterval, weight: 1, cooldown: 0)
        let config = WorldEventGeneratorConfiguration(minimumTickSpacing: 40, rules: [rule])
        let nd = (40.0).nextDown
        let steps: [StepSpec] = [
            sp(st(0,      0.5, 0.5, 0.5, 5, .moving)),
            sp(st(39,     0.5, 0.5, 0.5, 5, .moving)),
            sp(st(nd,     0.5, 0.5, 0.5, 5, .moving)),
            sp(st(40,     0.5, 0.5, 0.5, 5, .moving)),
            sp(st(79.999, 0.5, 0.5, 0.5, 5, .moving)),
            sp(st(80,     0.5, 0.5, 0.5, 5, .moving))
        ]
        return VectorSpec(
            vectorId: "tick-spacing-boundary",
            description: "Tick spacing boundary at 40s, strict less-than blocking.",
            seed: 0,
            config: config,
            steps: steps
        )
    }

    static func vectorAllowedKinds() -> VectorSpec {
        let config = WorldEventGeneratorConfiguration(minimumTickSpacing: 0)
        let steps: [StepSpec] = [
            sp(st(0, 0.30, 0.20, 0.10, 3, .moving), allowed: []),
            sp(st(1, 0.30, 0.20, 0.10, 3, .moving), allowed: [.quietInterval]),
            sp(st(2, 0.30, 0.20, 0.10, 3, .moving), allowed: [.bondMoment]),
            sp(st(3, 0.30, 0.20, 0.10, 3, .moving),
               allowed: [.quietInterval, .companionDrawsNear, .companionObserves]),
            sp(st(4, 0.30, 0.20, 0.10, 3, .moving), allowed: nil)
        ]
        return VectorSpec(
            vectorId: "allowed-kinds",
            description: "allowedKinds subsets including empty and a set with no eligible kinds.",
            seed: 0,
            config: config,
            steps: steps
        )
    }

    static func vectorExternalLastFire() -> VectorSpec {
        let rule = WorldEventRule(kind: .quietInterval, weight: 1, cooldown: 20)
        let config = WorldEventGeneratorConfiguration(minimumTickSpacing: 40, rules: [rule])
        let steps: [StepSpec] = [
            sp(st(0,   0.5, 0.5, 0.5, 5, .moving)),
            sp(st(100, 0.5, 0.5, 0.5, 5, .moving),
               extGen: 60, extFired: [.quietInterval: 50]),
            sp(st(150, 0.5, 0.5, 0.5, 5, .moving),
               extGen: 50, extFired: [.quietInterval: 20]),
            sp(st(180, 0.5, 0.5, 0.5, 5, .moving),
               extGen: 200),
            sp(st(200, 0.5, 0.5, 0.5, 5, .moving),
               extFired: [.quietInterval: 180])
        ]
        return VectorSpec(
            vectorId: "external-last-fire",
            description: "External last-fired-by-kind and last-generated, both larger and smaller than internal.",
            seed: 0,
            config: config,
            steps: steps
        )
    }

    static func vectorNonFiniteElapsed() -> VectorSpec {
        let rule = WorldEventRule(kind: .quietInterval, weight: 1, cooldown: 0)
        let config = WorldEventGeneratorConfiguration(minimumTickSpacing: 0, rules: [rule])
        let steps: [StepSpec] = [
            sp(st(0, 0.5, 0.5, 0.5, 5, .moving), elapsed: .nan),
            sp(st(0, 0.5, 0.5, 0.5, 5, .moving), elapsed: -Double.infinity),
            sp(st(0, 0.5, 0.5, 0.5, 5, .moving), elapsed: -5),
            sp(st(0, 0.5, 0.5, 0.5, 5, .moving), elapsed: Double.infinity)
        ]
        return VectorSpec(
            vectorId: "non-finite-elapsed",
            description: "Non-finite and negative elapsed values clamp to zero.",
            seed: 0,
            config: config,
            steps: steps
        )
    }

    static func vectorWeightBoundary() -> [VectorSpec] {
        let bigConfig = WorldEventGeneratorConfiguration(minimumTickSpacing: 0, rules: [
            WorldEventRule(kind: .quietInterval, weight: 1, cooldown: 0),
            WorldEventRule(kind: .companionObserves, weight: 4_611_686_018_427_387_904, cooldown: 0),
            WorldEventRule(kind: .distantPresence, weight: 3, cooldown: 0),
            WorldEventRule(kind: .companionDrawsNear, weight: 0, cooldown: 0),
            WorldEventRule(kind: .pursuitFades, minimumEnergy: 2.0, weight: 1, cooldown: 0),
            WorldEventRule(kind: .bondMoment, weight: 1, cooldown: -3)
        ])
        let big = VectorSpec(
            vectorId: "weight-boundary",
            description: "Very large and very small weights with clamped constructor inputs.",
            seed: 42,
            config: bigConfig,
            steps: [
                sp(st(0, 1.0, 0.5, 0.5, 5, .moving)),
                sp(st(1, 1.0, 0.5, 0.5, 5, .moving)),
                sp(st(2, 1.0, 0.5, 0.5, 5, .moving))
            ]
        )

        let boundarySeed = findBoundarySeed(weights: [2, 3], targetPick: 2)
        let smallConfig = WorldEventGeneratorConfiguration(minimumTickSpacing: 0, rules: [
            WorldEventRule(kind: .quietInterval, weight: 2, cooldown: 0),
            WorldEventRule(kind: .companionObserves, weight: 3, cooldown: 0)
        ])
        let small = VectorSpec(
            vectorId: "weight-boundary-pick",
            description: "Seed chosen so the first draw modulo total lands on the cursor boundary (pick == 2).",
            seed: boundarySeed,
            config: smallConfig,
            steps: [sp(st(0, 1.0, 0.5, 0.5, 5, .moving))]
        )
        return [big, small]
    }

    static func vectorMovementStates() -> VectorSpec {
        let rule = WorldEventRule(kind: .quietInterval, weight: 1, cooldown: 0)
        let config = WorldEventGeneratorConfiguration(minimumTickSpacing: 0, rules: [rule])
        let steps: [StepSpec] = [
            sp(st(0,  0.5, 0.5, 0.5, 5, .idle)),
            sp(st(10, 0.5, 0.5, 0.5, 5, .stopped)),
            sp(st(20, 0.5, 0.5, 0.5, 5, .moving)),
            sp(st(30, 0.5, 0.5, 0.5, 5, .paused))
        ]
        return VectorSpec(
            vectorId: "movement-states",
            description: "Movement-state gate: idle/stopped produce null; moving/paused fire.",
            seed: 0,
            config: config,
            steps: steps
        )
    }
}
