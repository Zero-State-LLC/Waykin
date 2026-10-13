import Foundation
import CoreLocation

// Read-only diagnosis of the research process, not a production distance seam.
@main struct HistoryIsolationProbe {
    static func main() throws {
        let args = CommandLine.arguments
        let rows = try JSONSerialization.jsonObject(with: Data(contentsOf:
            URL(fileURLWithPath: args[1]))) as! [[String: Any]]
        let mode = args[2], target = args[3]
        precondition(["apple", "mixed", "candidatePrefix"].contains(mode))
        func number(_ value: Any) -> Double {
            if let text = value as? String, text.hasPrefix("bits:") {
                return Double(bitPattern: UInt64(text.dropFirst(5), radix: 16)!)
            }
            switch value as? String {
            case "NaN": return .nan
            case "Infinity": return .infinity
            case "-Infinity": return -.infinity
            default: fatalError("Exact bits required")
            }
        }
        func bits(_ x: Double) -> String { String(format: "%016llx", x.bitPattern) }
        var results: [[String: Any]] = []
        for row in rows {
            let x = ["latitude", "longitude", "latitude2", "longitude2"].map { number(row[$0]!) }
            let valid = x.allSatisfy { $0.isFinite } && abs(x[0]) <= 90 && abs(x[2]) <= 90 && abs(x[1]) <= 180 && abs(x[3]) <= 180
            let selected = row["id"] as! String == target
            var apple = Double.nan, candidate = Double.nan
            if valid && (mode != "candidatePrefix" || selected) {
                apple = CLLocation(latitude: x[0], longitude: x[1])
                    .distance(from: CLLocation(latitude: x[2], longitude: x[3]))
            }
            if mode != "apple" { candidate = PortableGeodesic.distance(x[0], x[1], x[2], x[3]) }
            if selected { results.append(["inputBits": x.map(bits), "apple": bits(apple), "candidate": bits(candidate)]) }
        }
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: results, options: [.sortedKeys]))
    }
}
