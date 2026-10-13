// Research v0. Pure Swift; arithmetic order matches portableMath.ts.
// Never-inline elementary operations forbid multiply/add contraction across
// calls. Test both debug and optimized Swift before relying on exact parity.
enum PortableMath {
    static let pi = 3.141592653589793
    static let halfPi = pi / 2
    static let quarterPi = pi / 4
    static let twoPi = pi * 2
    static let tanPiOver8 = 0.41421356237309503
    @inline(never) static func add(_ a: Double, _ b: Double) -> Double { a + b }
    @inline(never) static func mul(_ a: Double, _ b: Double) -> Double { a * b }
    @inline(never) static func div(_ a: Double, _ b: Double) -> Double { a / b }
    static func signed(_ x: Double, _ sign: Double) -> Double { sign.sign == .minus ? -x : x }
    static func reduced(_ input: Double) -> (x: Double, cosineSign: Double) {
        var x = input
        guard x.isFinite, abs(x) <= twoPi else { return (.nan, 1) }
        if x > pi { x = add(x, -twoPi) }
        if x < -pi { x = add(x, twoPi) }
        if x > halfPi { return (add(pi, -x), -1) }
        if x < -halfPi { return (add(-pi, -x), -1) }
        return (x, 1)
    }
    static func sin(_ input: Double) -> Double {
        if input == 0 { return input }
        let x = reduced(input).x, z = mul(x, x)
        var term = x, sum = x
        for k in 1...15 {
            term = mul(term, div(-z, Double((2 * k) * (2 * k + 1))))
            sum = add(sum, term)
        }
        return sum
    }
    static func cos(_ x: Double) -> Double {
        let r = reduced(x), z = mul(r.x, r.x)
        var term = 1.0, sum = 1.0
        for k in 1...15 {
            term = mul(term, div(-z, Double((2 * k - 1) * (2 * k))))
            sum = add(sum, term)
        }
        return mul(r.cosineSign, sum)
    }
    static func atanRatio(_ r: Double) -> Double {
        let reduce = r > tanPiOver8
        let x = reduce ? div(add(r, -1), add(r, 1)) : r
        let z = mul(x, x)
        var power = x, sum = x
        for k in 1...32 {
            power = mul(power, -z)
            sum = add(sum, div(power, Double(2 * k + 1)))
        }
        return reduce ? add(quarterPi, sum) : sum
    }
    static func atan2(_ y: Double, _ x: Double) -> Double {
        if x.isNaN || y.isNaN { return .nan }
        if y == 0 { return signed(x.sign == .minus ? pi : 0, y) }
        if x == 0 { return signed(halfPi, y) }
        if !y.isFinite {
            if !x.isFinite { return signed(x > 0 ? quarterPi : mul(3, quarterPi), y) }
            return signed(halfPi, y)
        }
        if !x.isFinite { return signed(x > 0 ? 0 : pi, y) }
        let ax = abs(x), ay = abs(y)
        var a = ay > ax ? add(halfPi, -atanRatio(div(ax, ay))) : atanRatio(div(ay, ax))
        if x < 0 { a = add(pi, -a) }
        return signed(a, y)
    }
    static func sqrt(_ x: Double) -> Double { x.squareRoot() }
}
