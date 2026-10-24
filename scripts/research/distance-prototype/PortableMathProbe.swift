import Foundation

@main
struct PortableMathProbe {
    static func main() throws {
        let input = try JSONSerialization.jsonObject(with: Data(contentsOf:
            URL(fileURLWithPath: CommandLine.arguments[1]))) as! [[String: Any]]
        let results = input.map { row -> [String: Any] in
            let args = (row["bits"] as! [String]).map { Double(bitPattern: UInt64($0, radix: 16)!) }
            let result: Double, native: Double
            switch row["name"] as! String {
            case "sin": result = PortableMath.sin(args[0]); native = sin(args[0])
            case "cos": result = PortableMath.cos(args[0]); native = cos(args[0])
            case "atan2": result = PortableMath.atan2(args[0], args[1]); native = atan2(args[0], args[1])
            case "sqrt": result = PortableMath.sqrt(args[0]); native = sqrt(args[0])
            case "cbrt": result = PortableMath.cbrt(args[0]); native = cbrt(args[0])
            default: fatalError("Unsupported portable primitive")
            }
            return ["bits": args.map { String(format: "%016llx", $0.bitPattern) },
                    "result": String(format: "%016llx", result.bitPattern),
                    "native": String(format: "%016llx", native.bitPattern)]
        }
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: results, options: [.sortedKeys]))
    }
}
