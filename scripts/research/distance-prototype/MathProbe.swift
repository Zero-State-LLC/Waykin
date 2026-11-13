import Foundation

// Diagnose identical Math inputs from JS on the native host; not a distance model.
func decodeMath(_ value: Any) -> Double {
    if let text = value as? String, text.hasPrefix("bits:") {
        return Double(bitPattern: UInt64(text.dropFirst(5), radix: 16)!)
    }
    if let n = value as? NSNumber { return n.doubleValue }
    switch value as! String {
    case "NaN": return .nan
    case "Infinity": return .infinity
    case "-Infinity": return -.infinity
    case "-0": return -0.0
    default: fatalError("Unknown number encoding")
    }
}
func encodeMath(_ value: Double) -> Any {
    if value.isNaN { return "NaN" }
    if value.isInfinite { return value > 0 ? "Infinity" : "-Infinity" }
    if value == 0 && value.sign == .minus { return "-0" }
    return value
}
@main
struct MathProbe {
    static func main() throws {
        let input = try JSONSerialization.jsonObject(with: Data(contentsOf:
            URL(fileURLWithPath: CommandLine.arguments[1]))) as! [[String: Any]]
        let results = input.map { row -> Any in
            let args = (row["args"] as! [Any]).map(decodeMath)
            let x = args[0]
            let result: Double
            switch row["name"] as! String {
            case "sin": result = sin(x)
            case "cos": result = cos(x)
            case "atan": result = atan(x)
            case "atan2": result = atan2(x, args[1])
            case "sqrt": result = sqrt(x)
            case "hypot":
                precondition(args.count == 2)
                result = hypot(x, args[1])
            case "cbrt": result = cbrt(x)
            case "atanh": result = atanh(x)
            case "log1p": result = log1p(x)
            case "log": result = log(x)
            case "exp": result = exp(x)
            case "pow": result = pow(x, args[1])
            default: fatalError("Unrecognized math function")
            }
            return ["valueBits": String(format: "%016llx", result.bitPattern),
                    "argumentBits": args.map { String(format: "%016llx", $0.bitPattern) }]
        }
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: results))
    }
}
