// RESEARCH ONLY. WGS84 inverse distance, derived from GeographicLib JS 2.2.0.
// Copyright (c) Charles Karney (2011-2025). MIT/X11; see GEOGRAPHICLIB_LICENSE.txt.
// Distance-only transcription: no direct solver, area, scales, or prolate model.
// Evaluation order follows the pinned JS source; portable primitives replace libm.
enum PortableGeodesic {
    private static let pi = PortableMath.pi
    private static let degree = pi / 180
    private static let a = 6378137.0
    private static let f = 1 / 298.257223563
    private static let f1 = 1 - f
    private static let ep2 = f * (2 - f) / (f1 * f1)
    private static let n = f / (2 - f)
    private static let b = a * f1
    private static let tol0 = Double.ulpOfOne
    private static let tol1 = 200 * tol0
    private static let tol2 = PortableMath.sqrt(tol0)
    private static let tiny = PortableMath.sqrt(Double.leastNormalMagnitude)
    private static let etol2 = 0.1 * tol2 / PortableMath.sqrt(max(0.001, abs(f)) * min(1, 1 - f / 2) / 2)
    private static func sq(_ x: Double) -> Double { x * x }
    private static func norm(_ x: Double, _ y: Double) -> Double { PortableMath.sqrt(x * x + y * y) }
    private static func sign(_ x: Double, _ s: Double) -> Double { PortableMath.signed(abs(x), s) }
    private static func roundAngle(_ x: Double) -> Double {
        let z = 1.0 / 16
        var y = abs(x)
        if y < z { y = z - (z - y) }
        return sign(y, x)
    }
    private static func remainder(_ input: Double) -> Double {
        let x = input.truncatingRemainder(dividingBy: 360)
        return x < -180 ? x + 360 : (x < 180 ? x : x - 360)
    }
    private static func sum(_ u: Double, _ v: Double) -> (Double, Double) {
        let s = u + v
        var up = s - v, vpp = s - (s - v)
        up -= u; vpp -= v
        return (s, s != 0 ? 0 - (up + vpp) : s)
    }
    private static func angleDiff(_ x: Double, _ y: Double) -> (Double, Double) {
        let first = sum(remainder(-x), remainder(y))
        let result = sum(remainder(first.0), first.1)
        var d = result.0
        let e = result.1
        if d == 0 || abs(d) == 180 { d = sign(d, e == 0 ? y - x : -e) }
        return (d, e)
    }
    private static func sincos(_ x: Double, _ extra: Double? = nil) -> (Double, Double) {
        var d = x.truncatingRemainder(dividingBy: 360)
        let q = Int((d / 90 + 0.5).rounded(.down)) // JS Math.round, including negative ties
        d = d - 90 * Double(q)
        if let e = extra { d = roundAngle(d + e) }
        let r = d * degree
        var s = PortableMath.sin(r), c = PortableMath.cos(r)
        if abs(d) == 45 { c = PortableMath.sqrt(0.5); s = sign(c, r) }
        else if abs(d) == 30 { c = PortableMath.sqrt(0.75); s = sign(0.5, r) }
        switch q & 3 {
        case 1: (s, c) = (c, -s)
        case 2: (s, c) = (-s, -c)
        case 3: (s, c) = (-c, s)
        default: break
        }
        c += 0
        if s == 0 { s = sign(s, extra == nil ? x : x + extra!) }
        return (s, c)
    }
    private static func poly(_ order: Int, _ p: [Double], _ offset: Int, _ x: Double) -> Double {
        if order < 0 { return 0 }
        var y = p[offset]
        if order > 0 { for j in 1...order { y = y * x + p[offset + j] } }
        return y
    }
    private static func series(_ s: Double, _ c: Double, _ coefficients: [Double]) -> Double {
        var k = coefficients.count, count = coefficients.count - 1
        let ar = 2 * (c - s) * (c + s)
        var y0 = 0.0, y1 = 0.0
        if count & 1 != 0 { k -= 1; y0 = coefficients[k] }
        count /= 2
        for _ in 0..<count {
            k -= 1; y1 = ar * y0 - y1 + coefficients[k]
            k -= 1; y0 = ar * y1 - y0 + coefficients[k]
        }
        return 2 * s * c * y0
    }
    private static func a1(_ eps: Double) -> Double {
        let t = poly(3, [1,4,64,0,256], 0, sq(eps)) / 256
        return (t + eps) / (1 - eps)
    }
    private static func a2(_ eps: Double) -> Double {
        let t = poly(3, [-11,-28,-192,0,256], 0, sq(eps)) / 256
        return (t - eps) / (1 + eps)
    }
    private static func c12(_ eps: Double, _ second: Bool) -> [Double] {
        let coeff: [Double] = second
            ? [1,2,16,32,35,64,384,2048,15,80,768,7,35,512,63,1280,77,2048]
            : [-1,6,-16,32,-9,64,-128,2048,9,-16,768,3,-5,512,-7,1280,-7,2048]
        var c = [Double](repeating: 0, count: 7), d = eps, o = 0
        for l in 1...6 {
            let p = (6 - l) / 2
            c[l] = d * poly(p, coeff, o, sq(eps)) / coeff[o + p + 1]
            o += p + 2; d *= eps
        }
        return c
    }
    private static let a3x: [Double] = {
        let coeff: [Double] = [-3,128,-2,-3,64,-1,-3,-1,16,3,-1,-2,8,1,-1,2,1,1]
        var result: [Double] = [], o = 0
        for j in stride(from: 5, through: 0, by: -1) {
            let p = min(6 - j - 1, j)
            result.append(poly(p, coeff, o, n) / coeff[o + p + 1]); o += p + 2
        }
        return result
    }()
    private static let c3x: [Double] = {
        let coeff: [Double] = [3,128,2,5,128,-1,3,3,64,-1,0,1,8,-1,1,4,5,256,1,3,128,-3,-2,3,64,1,-3,2,32,7,512,-10,9,384,5,-9,5,192,7,512,-14,7,512,21,2560]
        var result: [Double] = [], o = 0
        for l in 1..<6 {
            for j in stride(from: 5, through: l, by: -1) {
                let p = min(6 - j - 1, j)
                result.append(poly(p, coeff, o, n) / coeff[o + p + 1]); o += p + 2
            }
        }
        return result
    }()
    private static func a3(_ eps: Double) -> Double { poly(5, a3x, 0, eps) }
    private static func c3(_ eps: Double) -> [Double] {
        var c = [Double](repeating: 0, count: 6), mult = 1.0, o = 0
        for l in 1..<6 {
            let p = 6 - l - 1
            mult *= eps; c[l] = mult * poly(p, c3x, o, eps); o += p + 1
        }
        return c
    }
    private static func lengths(_ eps: Double, _ sig: Double, _ s1: Double, _ c1: Double,
                                _ dn1: Double, _ s2: Double, _ c2: Double, _ dn2: Double,
                                distance: Bool, reduced: Bool) -> (distance: Double, reduced: Double) {
        var A1 = a1(eps), A2 = 0.0, m0 = 0.0, J = 0.0, s = Double.nan
        let C1 = c12(eps, false)
        var C2 = [Double](repeating: 0, count: 7)
        if reduced { A2 = a2(eps); C2 = c12(eps, true); m0 = A1 - A2; A2 = 1 + A2 }
        A1 = 1 + A1
        if distance {
            let B1 = series(s2, c2, C1) - series(s1, c1, C1)
            s = A1 * (sig + B1)
            if reduced {
                let B2 = series(s2, c2, C2) - series(s1, c1, C2)
                J = m0 * sig + (A1 * B1 - A2 * B2)
            }
        } else if reduced {
            for l in 1...6 { C2[l] = A1 * C1[l] - A2 * C2[l] }
            J = m0 * sig + (series(s2, c2, C2) - series(s1, c1, C2))
        }
        let m = reduced ? dn2 * (c1 * s2) - dn1 * (s1 * c2) - c1 * c2 * J : .nan
        return (s, m)
    }
    private static func astroid(_ x: Double, _ y: Double) -> Double {
        let p = sq(x), q = sq(y), r = (p + q - 1) / 6
        if q == 0 && r <= 0 { return 0 }
        let S = p * q / 4, r2 = sq(r), r3 = r * r2, disc = S * (S + 2 * r3)
        var u = r
        if disc >= 0 {
            var T3 = S + r3
            T3 += T3 < 0 ? -PortableMath.sqrt(disc) : PortableMath.sqrt(disc)
            let T = PortableMath.cbrt(T3)
            u += T + (T != 0 ? r2 / T : 0)
        } else {
            let ang = PortableMath.atan2(PortableMath.sqrt(-disc), -(S + r3))
            u += 2 * r * PortableMath.cos(ang / 3)
        }
        let v = PortableMath.sqrt(sq(u) + q), uv = u < 0 ? q / (v - u) : u + v
        let w = (uv - q) / (2 * v)
        return uv / (PortableMath.sqrt(uv + sq(w)) + w)
    }
    private struct Start { var sig = -1.0; var sa = 0.0; var ca = 0.0; var dnm = Double.nan }
    private static func start(_ s1: Double, _ c1: Double, _ s2: Double, _ c2: Double,
                              _ lam: Double, _ slam: Double, _ clam: Double) -> Start {
        var v = Start()
        let s12 = s2 * c1 - c2 * s1, c12 = c2 * c1 + s2 * s1
        var s12a = s2 * c1; s12a += c2 * s1
        let short = c12 >= 0 && s12 < 0.5 && c2 * lam < 0.5
        var so = slam, co = clam
        if short {
            var sm2 = sq(s1 + s2); sm2 /= sm2 + sq(c1 + c2)
            v.dnm = PortableMath.sqrt(1 + ep2 * sm2)
            let omg = lam / (f1 * v.dnm)
            so = PortableMath.sin(omg); co = PortableMath.cos(omg)
        }
        v.sa = c2 * so
        v.ca = co >= 0 ? s12 + c2 * s1 * sq(so) / (1 + co) : s12a - c2 * s1 * sq(so) / (1 - co)
        let ssig = norm(v.sa, v.ca), csig = s1 * s2 + c1 * c2 * co
        if short && ssig < etol2 { v.sig = PortableMath.atan2(ssig, csig) }
        else if !(abs(n) > 0.1 || csig >= 0 || ssig >= 6 * abs(n) * pi * sq(c1)) {
            let lamx = PortableMath.atan2(-slam, -clam), k2 = sq(s1) * ep2
            let eps = k2 / (2 * (1 + PortableMath.sqrt(1 + k2)) + k2)
            let lamscale = f * c1 * a3(eps) * pi, betscale = lamscale * c1
            let x = lamx / lamscale, y = s12a / betscale
            if y > -tol1 && x > -1 - 1000 * tol2 {
                v.sa = min(1, -x); v.ca = -PortableMath.sqrt(1 - sq(v.sa))
            } else {
                let k = astroid(x, y), omga = lamscale * (-x * k / (1 + k))
                so = PortableMath.sin(omga); co = -PortableMath.cos(omga)
                v.sa = c2 * so; v.ca = s12a - c2 * s1 * sq(so) / (1 - co)
            }
        }
        if !(v.sa <= 0) { let t = norm(v.sa, v.ca); v.sa /= t; v.ca /= t }
        else { v.sa = 1; v.ca = 0 }
        return v
    }
    private struct Lambda {
        var sig = 0.0, ss1 = 0.0, cs1 = 0.0, ss2 = 0.0, cs2 = 0.0
        var eps = 0.0, lam = 0.0, derivative = Double.nan
    }
    private static func lambda(_ s1: Double, _ c1: Double, _ dn1: Double,
                               _ s2: Double, _ c2: Double, _ dn2: Double,
                               _ sa: Double, _ caInput: Double, _ slam: Double, _ clam: Double,
                               _ differentiate: Bool) -> Lambda {
        var v = Lambda(), ca = caInput
        if s1 == 0 && ca == 0 { ca = -tiny }
        let sa0 = sa * c1, ca0 = norm(ca, sa * s1)
        let so1 = sa0 * s1, co1 = ca * c1
        v.ss1 = s1; v.cs1 = co1
        var t = norm(v.ss1, v.cs1); v.ss1 /= t; v.cs1 /= t
        let ca2 = c2 != c1 || abs(s2) != -s1
            ? PortableMath.sqrt(sq(ca * c1) + (c1 < -s1 ? (c2 - c1) * (c1 + c2) : (s1 - s2) * (s1 + s2))) / c2
            : abs(ca)
        let so2 = sa0 * s2, co2 = ca2 * c2
        v.ss2 = s2; v.cs2 = co2
        t = norm(v.ss2, v.cs2); v.ss2 /= t; v.cs2 /= t
        v.sig = PortableMath.atan2(max(0, v.cs1 * v.ss2 - v.ss1 * v.cs2), v.cs1 * v.cs2 + v.ss1 * v.ss2)
        let so12 = max(0, co1 * so2 - so1 * co2), co12 = co1 * co2 + so1 * so2
        let eta = PortableMath.atan2(so12 * clam - co12 * slam, co12 * clam + so12 * slam)
        let k2 = sq(ca0) * ep2
        v.eps = k2 / (2 * (1 + PortableMath.sqrt(1 + k2)) + k2)
        let C3 = c3(v.eps), B312 = series(v.ss2, v.cs2, C3) - series(v.ss1, v.cs1, C3)
        let domg = -f * a3(v.eps) * sa0 * (v.sig + B312)
        v.lam = eta + domg
        if differentiate {
            if ca2 == 0 { v.derivative = -2 * f1 * dn1 / s1 }
            else {
                v.derivative = lengths(v.eps, v.sig, v.ss1, v.cs1, dn1, v.ss2, v.cs2, dn2, distance: false, reduced: true).reduced
                v.derivative *= f1 / (ca2 * c2)
            }
        }
        return v
    }
    static func distance(_ latitude1: Double, _ longitude1: Double, _ latitude2: Double, _ longitude2: Double) -> Double {
        guard latitude1.isFinite, latitude2.isFinite, longitude1.isFinite, longitude2.isFinite,
              abs(latitude1) <= 90, abs(latitude2) <= 90, abs(longitude1) <= 180, abs(longitude2) <= 180 else { return .nan }
        var lat1 = roundAngle(latitude1), lat2 = roundAngle(latitude2)
        var (lon, lone) = angleDiff(longitude1, longitude2)
        let lonsign = sign(1, lon); lon *= lonsign; lone *= lonsign
        let lam = lon * degree, (slam, clam) = sincos(lon, lone)
        lone = (180 - lon) - lone
        if abs(lat1) < abs(lat2) { swap(&lat1, &lat2) }
        let latsign = sign(1, -lat1); lat1 *= latsign; lat2 *= latsign
        var (s1, c1) = sincos(lat1); s1 *= f1
        var t = norm(s1, c1); s1 /= t; c1 /= t; c1 = max(tiny, c1)
        var (s2, c2) = sincos(lat2); s2 *= f1
        t = norm(s2, c2); s2 /= t; c2 /= t; c2 = max(tiny, c2)
        if c1 < -s1 { if c2 == c1 { s2 = sign(s1, s2) } }
        else if abs(s2) == -s1 { c2 = c1 }
        let dn1 = PortableMath.sqrt(1 + ep2 * sq(s1)), dn2 = PortableMath.sqrt(1 + ep2 * sq(s2))
        if lat1 == -90 || slam == 0 {
            let cs1 = clam * c1
            let sig = PortableMath.atan2(max(0, cs1 * s2 - s1 * c2), cs1 * c2 + s1 * s2)
            let v = lengths(n, sig, s1, cs1, dn1, s2, c2, dn2, distance: true, reduced: true)
            if sig < tol2 || v.reduced >= 0 {
                if sig < 3 * tiny || (sig < tol0 && (v.distance < 0 || v.reduced < 0)) { return 0 }
                return 0 + v.distance * b
            }
        }
        if s1 == 0 && lone >= f * 180 { return 0 + a * lam }
        let initial = start(s1, c1, s2, c2, lam, slam, clam)
        if initial.sig >= 0 { return 0 + initial.sig * b * initial.dnm }
        var sa = initial.sa, ca = initial.ca, saa = tiny, caa = 1.0, sab = tiny, cab = -1.0
        var tripn = false, tripb = false, result = Lambda()
        for iteration in 0...83 {
            result = lambda(s1, c1, dn1, s2, c2, dn2, sa, ca, slam, clam, iteration < 20)
            let v = result.lam, dv = result.derivative
            if !v.isFinite { return .nan }
            if tripb || !(abs(v) >= (tripn ? 8 : 1) * tol0) { break }
            // Unlike a silent best-effort answer, exhaustion is an explicit failure.
            if iteration == 83 { return .nan }
            if v > 0 && (iteration < 20 || ca / sa > cab / sab) { sab = sa; cab = ca }
            else if v < 0 && (iteration < 20 || ca / sa < caa / saa) { saa = sa; caa = ca }
            if iteration < 20 && dv > 0 {
                let delta = -v / dv
                if abs(delta) < pi {
                    let sd = PortableMath.sin(delta), cd = PortableMath.cos(delta), nsa = sa * cd + ca * sd
                    if nsa > 0 {
                        ca = ca * cd - sa * sd; sa = nsa
                        t = norm(sa, ca); sa /= t; ca /= t
                        tripn = abs(v) <= 16 * tol0
                        continue
                    }
                }
            }
            sa = (saa + sab) / 2; ca = (caa + cab) / 2
            t = norm(sa, ca); sa /= t; ca /= t; tripn = false
            tripb = abs(saa - sa) + (caa - ca) < tol0 || abs(sa - sab) + (ca - cab) < tol0
        }
        return 0 + lengths(result.eps, result.sig, result.ss1, result.cs1, dn1,
                           result.ss2, result.cs2, dn2, distance: true, reduced: false).distance * b
    }
}
