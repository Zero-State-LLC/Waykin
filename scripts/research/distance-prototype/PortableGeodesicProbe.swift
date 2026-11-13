import Foundation

@main struct PortableGeodesicProbe {
    static func main() throws {
        let rows = try JSONSerialization.jsonObject(with: Data(contentsOf:
            URL(fileURLWithPath: CommandLine.arguments[1]))) as! [[String]]
        let output = rows.map { row -> String in
            let x = row.map { Double(bitPattern: UInt64($0, radix: 16)!) }
            return String(format: "%016llx", PortableGeodesic.distance(x[0], x[1], x[2], x[3]).bitPattern)
        }
        FileHandle.standardOutput.write(try JSONSerialization.data(withJSONObject: output))
    }
}
