import Foundation
import WaykinCore

extension WaykinVectorExport {
    static func writeMovementVectors(outDir: String, swiftTree: String) throws {
        struct Input {
            let sample: LocationSample
            let receivedAt: Double
            let resetBefore: Bool
        }
        func sample(_ time: Double, _ longitude: Double = 0, accuracy: Double = 5,
                    speed: Double = .nan, latitude: Double = 0, receivedAt: Double? = nil,
                    reset: Bool = false) -> Input {
            Input(sample: LocationSample(timestamp: Date(timeIntervalSinceReferenceDate: time),
                latitude: latitude, longitude: longitude, altitude: 10, horizontalAccuracy: accuracy,
                reportedSpeedMetersPerSecond: speed), receivedAt: receivedAt ?? time, resetBefore: reset)
        }
        let inputs: [Input] = [
            sample(1000, latitude: .nan), sample(1000, latitude: 91), sample(1000, 181),
            sample(1000, accuracy: .infinity), sample(1000, accuracy: -1), sample(1000, accuracy: 31),
            sample(1000, receivedAt: 1016), sample(1000, receivedAt: 997),
            sample(1000, receivedAt: 1015), // age boundary establishes anchor
            sample(1000), sample(999), // duplicate and out-of-order preserve it
            sample(1001, 0.00002), sample(1002, 0.00004), sample(1003, 0.00006),
            sample(1004, 0.00006, speed: 0), sample(1005, 0.00006, speed: 0), sample(1006, 0.00006, speed: 0),
            sample(1007, 0.00008, accuracy: 10, speed: 0.55),
            sample(1008, 0.00010, accuracy: 30, speed: 0.55),
            sample(1009, 0.00012, speed: 0.55),
            sample(1010, 0.00014, speed: -1), sample(1011, 0.00016, speed: .infinity),
            sample(1012, 0.00026), // implausible speed; rejected anchor not retained
            sample(1013, 0.00020),
            sample(1029, 0.01), // stale anchor reset before distance rejection
            sample(1030, 0.01, receivedAt: 1028), // future-skew boundary
            sample(1031, 0.01, reset: true),
            sample(1032, 0.01002, speed: 0.55),
            sample(1033, 0.01002, speed: 0.25),
            sample(1034, 0.01002, speed: 0.25),
            sample(1035, 0.01002, speed: 0.25)
        ]
        var processor = MovementIntegrityProcessor()
        let steps: [[String: Any]] = inputs.enumerated().map { index, input in
            if input.resetBefore { processor.resetAnchor() }
            let sample = input.sample
            let result = processor.process(sample, receivedAt: Date(timeIntervalSinceReferenceDate: input.receivedAt))
            let point: Any = result.point.map { point -> [String: Any] in
                ["timestamp": point.timestamp.timeIntervalSinceReferenceDate,
                 "latitude": jsonDouble(point.latitude), "longitude": jsonDouble(point.longitude),
                 "altitude": point.altitude.map(jsonDouble) ?? NSNull(), "speed": jsonDouble(point.speed)]
            } ?? NSNull()
            return ["index": index, "resetBefore": input.resetBefore, "receivedAt": input.receivedAt,
                "sample": ["timestamp": sample.timestamp.timeIntervalSinceReferenceDate,
                    "latitude": jsonDouble(sample.latitude), "longitude": jsonDouble(sample.longitude),
                    "altitude": sample.altitude.map(jsonDouble) ?? NSNull(),
                    "horizontalAccuracy": jsonDouble(sample.horizontalAccuracy),
                    "reportedSpeedMetersPerSecond": jsonDouble(sample.reportedSpeedMetersPerSecond)],
                "expected": ["point": point, "sampleInterval": result.sampleInterval,
                    "distanceDelta": result.distanceDelta, "isMoving": result.isMoving,
                    "diagnostic": ["timestamp": result.diagnostic.timestamp.timeIntervalSinceReferenceDate,
                        "disposition": result.diagnostic.disposition.rawValue,
                        "accuracyBucket": result.diagnostic.accuracyBucket.rawValue,
                        "derivedSpeedMetersPerSecond": result.diagnostic.derivedSpeedMetersPerSecond,
                        "accumulatedDistance": result.diagnostic.accumulatedDistance]]]
        }
        try writeFamilyVector(["schemaVersion": 1, "family": "movement", "vectorId": "integrity-sequence",
            "source": ["generatedBy": "WaykinVectorExport", "swiftTree": swiftTree],
            "distanceToleranceMeters": 0.05, "steps": steps], family: "movement", name: "integrity-sequence", outDir: outDir)
    }
}
