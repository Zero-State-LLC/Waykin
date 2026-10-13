// RESEARCH ONLY. WGS84 inverse distance, derived from GeographicLib JS 2.2.0.
// Copyright (c) Charles Karney (2011-2025). MIT/X11; see GEOGRAPHICLIB_LICENSE.txt.
// Distance-only transcription matched to PortableGeodesic.swift, not production.
import {portableSin as sin, portableCos as cos, portableAtan2 as atan2,
  portableSqrt as sqrt, portableCbrt as cbrt} from './portableMath.js';

const pi = 3.141592653589793, degree = pi / 180;
const a = 6378137, f = 1 / 298.257223563, f1 = 1 - f;
const ep2 = f * (2 - f) / (f1 * f1), n = f / (2 - f), b = a * f1;
const tol0 = Number.EPSILON, tol1 = 200 * tol0, tol2 = sqrt(tol0);
const tiny = sqrt(2.2250738585072014e-308);
const etol2 = 0.1 * tol2 / sqrt(Math.max(0.001, Math.abs(f)) * Math.min(1, 1 - f / 2) / 2);
const sq = (x: number): number => x * x;
const norm = (x: number, y: number): number => sqrt(x * x + y * y);
const sign = (x: number, s: number): number => s < 0 || Object.is(s, -0) ? -Math.abs(x) : Math.abs(x);
function roundAngle(x: number): number {
  const z = 1 / 16;
  let y = Math.abs(x);
  if (y < z) y = z - (z - y);
  return sign(y, x);
}
function remainder(input: number): number {
  const x = input % 360;
  return x < -180 ? x + 360 : x < 180 ? x : x - 360;
}
function sum(u: number, v: number): [number, number] {
  const s = u + v;
  let up = s - v, vpp = s - (s - v);
  up -= u; vpp -= v;
  return [s, s !== 0 ? 0 - (up + vpp) : s];
}
function angleDiff(x: number, y: number): [number, number] {
  const first = sum(remainder(-x), remainder(y));
  let [d, e] = sum(remainder(first[0]), first[1]);
  if (d === 0 || Math.abs(d) === 180) d = sign(d, e === 0 ? y - x : -e);
  return [d, e];
}
function sincos(x: number, extra?: number): [number, number] {
  let d = x % 360;
  const q = Math.floor(d / 90 + 0.5);
  d = d - 90 * q;
  if (extra !== undefined) d = roundAngle(d + extra);
  const r = d * degree;
  let s = sin(r), c = cos(r);
  if (Math.abs(d) === 45) { c = sqrt(0.5); s = sign(c, r); }
  else if (Math.abs(d) === 30) { c = sqrt(0.75); s = sign(0.5, r); }
  switch (q & 3) {
    case 1: [s, c] = [c, -s]; break;
    case 2: [s, c] = [-s, -c]; break;
    case 3: [s, c] = [-c, s]; break;
  }
  c += 0;
  if (s === 0) s = sign(s, extra === undefined ? x : x + extra);
  return [s, c];
}
function poly(order: number, p: number[], offset: number, x: number): number {
  if (order < 0) return 0;
  // Private callers pass fixed coefficient tables and bounded order/offsets.
  let y = p[offset]!;
  for (let j = 1; j <= order; j++) y = y * x + p[offset + j]!;
  return y;
}
function series(s: number, c: number, coefficients: number[]): number {
  let k = coefficients.length, count = coefficients.length - 1;
  const ar = 2 * (c - s) * (c + s);
  let y0 = 0, y1 = 0;
  // k walks only the populated coefficients; index zero is intentionally unused.
  if ((count & 1) !== 0) { k--; y0 = coefficients[k]!; }
  count = Math.floor(count / 2);
  for (let i = 0; i < count; i++) {
    k--; y1 = ar * y0 - y1 + coefficients[k]!;
    k--; y0 = ar * y1 - y0 + coefficients[k]!;
  }
  return 2 * s * c * y0;
}
function a1(eps: number): number {
  const t = poly(3, [1,4,64,0,256], 0, sq(eps)) / 256;
  return (t + eps) / (1 - eps);
}
function a2(eps: number): number {
  const t = poly(3, [-11,-28,-192,0,256], 0, sq(eps)) / 256;
  return (t - eps) / (1 + eps);
}
function c12(eps: number, second: boolean): number[] {
  const coeff = second
    ? [1,2,16,32,35,64,384,2048,15,80,768,7,35,512,63,1280,77,2048]
    : [-1,6,-16,32,-9,64,-128,2048,9,-16,768,3,-5,512,-7,1280,-7,2048];
  const c = Array<number>(7).fill(0);
  let d = eps, o = 0;
  for (let l = 1; l <= 6; l++) {
    const p = Math.floor((6 - l) / 2);
    c[l] = d * poly(p, coeff, o, sq(eps)) / coeff[o + p + 1]!;
    o += p + 2; d *= eps;
  }
  return c;
}
const a3x = (() => {
  const coeff = [-3,128,-2,-3,64,-1,-3,-1,16,3,-1,-2,8,1,-1,2,1,1];
  const result: number[] = [];
  let o = 0;
  for (let j = 5; j >= 0; j--) {
    const p = Math.min(6 - j - 1, j);
    result.push(poly(p, coeff, o, n) / coeff[o + p + 1]!); o += p + 2;
  }
  return result;
})();
const c3x = (() => {
  const coeff = [3,128,2,5,128,-1,3,3,64,-1,0,1,8,-1,1,4,5,256,1,3,128,-3,-2,3,64,1,-3,2,32,7,512,-10,9,384,5,-9,5,192,7,512,-14,7,512,21,2560];
  const result: number[] = [];
  let o = 0;
  for (let l = 1; l < 6; l++) for (let j = 5; j >= l; j--) {
    const p = Math.min(6 - j - 1, j);
    result.push(poly(p, coeff, o, n) / coeff[o + p + 1]!); o += p + 2;
  }
  return result;
})();
const a3 = (eps: number): number => poly(5, a3x, 0, eps);
function c3(eps: number): number[] {
  const c = Array<number>(6).fill(0);
  let mult = 1, o = 0;
  for (let l = 1; l < 6; l++) {
    const p = 6 - l - 1;
    mult *= eps; c[l] = mult * poly(p, c3x, o, eps); o += p + 1;
  }
  return c;
}
function lengths(eps: number, sig: number, s1: number, c1: number, dn1: number,
  s2: number, c2: number, dn2: number, distance: boolean, reduced: boolean): {distance: number; reduced: number} {
  let A1 = a1(eps), A2 = 0, m0 = 0, J = 0, s = NaN;
  const C1 = c12(eps, false);
  let C2 = Array<number>(7).fill(0);
  if (reduced) { A2 = a2(eps); C2 = c12(eps, true); m0 = A1 - A2; A2 = 1 + A2; }
  A1 = 1 + A1;
  if (distance) {
    const B1 = series(s2, c2, C1) - series(s1, c1, C1);
    s = A1 * (sig + B1);
    if (reduced) {
      const B2 = series(s2, c2, C2) - series(s1, c1, C2);
      J = m0 * sig + (A1 * B1 - A2 * B2);
    }
  } else if (reduced) {
    for (let l = 1; l <= 6; l++) C2[l] = A1 * C1[l]! - A2 * C2[l]!;
    J = m0 * sig + (series(s2, c2, C2) - series(s1, c1, C2));
  }
  const m = reduced ? dn2 * (c1 * s2) - dn1 * (s1 * c2) - c1 * c2 * J : NaN;
  return {distance: s, reduced: m};
}
function astroid(x: number, y: number): number {
  const p = sq(x), q = sq(y), r = (p + q - 1) / 6;
  if (q === 0 && r <= 0) return 0;
  const S = p * q / 4, r2 = sq(r), r3 = r * r2, disc = S * (S + 2 * r3);
  let u = r;
  if (disc >= 0) {
    let T3 = S + r3;
    T3 += T3 < 0 ? -sqrt(disc) : sqrt(disc);
    const T = cbrt(T3);
    u += T + (T !== 0 ? r2 / T : 0);
  } else {
    const ang = atan2(sqrt(-disc), -(S + r3));
    u += 2 * r * cos(ang / 3);
  }
  const v = sqrt(sq(u) + q), uv = u < 0 ? q / (v - u) : u + v;
  const w = (uv - q) / (2 * v);
  return uv / (sqrt(uv + sq(w)) + w);
}
function start(s1: number, c1: number, s2: number, c2: number, lam: number, slam: number, clam: number) {
  const v = {sig: -1, sa: 0, ca: 0, dnm: NaN};
  const s12 = s2 * c1 - c2 * s1, c12 = c2 * c1 + s2 * s1;
  let s12a = s2 * c1; s12a += c2 * s1;
  const short = c12 >= 0 && s12 < 0.5 && c2 * lam < 0.5;
  let so = slam, co = clam;
  if (short) {
    let sm2 = sq(s1 + s2); sm2 /= sm2 + sq(c1 + c2);
    v.dnm = sqrt(1 + ep2 * sm2);
    const omg = lam / (f1 * v.dnm);
    so = sin(omg); co = cos(omg);
  }
  v.sa = c2 * so;
  v.ca = co >= 0 ? s12 + c2 * s1 * sq(so) / (1 + co) : s12a - c2 * s1 * sq(so) / (1 - co);
  const ssig = norm(v.sa, v.ca), csig = s1 * s2 + c1 * c2 * co;
  if (short && ssig < etol2) v.sig = atan2(ssig, csig);
  else if (!(Math.abs(n) > 0.1 || csig >= 0 || ssig >= 6 * Math.abs(n) * pi * sq(c1))) {
    const lamx = atan2(-slam, -clam), k2 = sq(s1) * ep2;
    const eps = k2 / (2 * (1 + sqrt(1 + k2)) + k2);
    const lamscale = f * c1 * a3(eps) * pi, betscale = lamscale * c1;
    const x = lamx / lamscale, y = s12a / betscale;
    if (y > -tol1 && x > -1 - 1000 * tol2) {
      v.sa = Math.min(1, -x); v.ca = -sqrt(1 - sq(v.sa));
    } else {
      const k = astroid(x, y), omga = lamscale * (-x * k / (1 + k));
      so = sin(omga); co = -cos(omga);
      v.sa = c2 * so; v.ca = s12a - c2 * s1 * sq(so) / (1 - co);
    }
  }
  if (!(v.sa <= 0)) { const t = norm(v.sa, v.ca); v.sa /= t; v.ca /= t; }
  else { v.sa = 1; v.ca = 0; }
  return v;
}
const emptyLambda = () => ({sig: 0, ss1: 0, cs1: 0, ss2: 0, cs2: 0, eps: 0, lam: 0, derivative: NaN});
function lambda(s1: number, c1: number, dn1: number, s2: number, c2: number, dn2: number,
  sa: number, caInput: number, slam: number, clam: number, differentiate: boolean) {
  const v = emptyLambda();
  let ca = caInput;
  if (s1 === 0 && ca === 0) ca = -tiny;
  const sa0 = sa * c1, ca0 = norm(ca, sa * s1);
  const so1 = sa0 * s1, co1 = ca * c1;
  v.ss1 = s1; v.cs1 = co1;
  let t = norm(v.ss1, v.cs1); v.ss1 /= t; v.cs1 /= t;
  const ca2 = c2 !== c1 || Math.abs(s2) !== -s1
    ? sqrt(sq(ca * c1) + (c1 < -s1 ? (c2 - c1) * (c1 + c2) : (s1 - s2) * (s1 + s2))) / c2
    : Math.abs(ca);
  const so2 = sa0 * s2, co2 = ca2 * c2;
  v.ss2 = s2; v.cs2 = co2;
  t = norm(v.ss2, v.cs2); v.ss2 /= t; v.cs2 /= t;
  v.sig = atan2(Math.max(0, v.cs1 * v.ss2 - v.ss1 * v.cs2), v.cs1 * v.cs2 + v.ss1 * v.ss2);
  const so12 = Math.max(0, co1 * so2 - so1 * co2), co12 = co1 * co2 + so1 * so2;
  const eta = atan2(so12 * clam - co12 * slam, co12 * clam + so12 * slam);
  const k2 = sq(ca0) * ep2;
  v.eps = k2 / (2 * (1 + sqrt(1 + k2)) + k2);
  const C3 = c3(v.eps), B312 = series(v.ss2, v.cs2, C3) - series(v.ss1, v.cs1, C3);
  const domg = -f * a3(v.eps) * sa0 * (v.sig + B312);
  v.lam = eta + domg;
  if (differentiate) {
    if (ca2 === 0) v.derivative = -2 * f1 * dn1 / s1;
    else {
      v.derivative = lengths(v.eps, v.sig, v.ss1, v.cs1, dn1, v.ss2, v.cs2, dn2, false, true).reduced;
      v.derivative *= f1 / (ca2 * c2);
    }
  }
  return v;
}
export function portableDistance(latitude1: number, longitude1: number, latitude2: number, longitude2: number): number {
  if (![latitude1, longitude1, latitude2, longitude2].every(Number.isFinite)
    || Math.abs(latitude1) > 90 || Math.abs(latitude2) > 90
    || Math.abs(longitude1) > 180 || Math.abs(longitude2) > 180) return NaN;
  let lat1 = roundAngle(latitude1), lat2 = roundAngle(latitude2);
  let [lon, lone] = angleDiff(longitude1, longitude2);
  const lonsign = sign(1, lon); lon *= lonsign; lone *= lonsign;
  const lam = lon * degree, [slam, clam] = sincos(lon, lone);
  lone = (180 - lon) - lone;
  if (Math.abs(lat1) < Math.abs(lat2)) [lat1, lat2] = [lat2, lat1];
  const latsign = sign(1, -lat1); lat1 *= latsign; lat2 *= latsign;
  let [s1, c1] = sincos(lat1); s1 *= f1;
  let t = norm(s1, c1); s1 /= t; c1 /= t; c1 = Math.max(tiny, c1);
  let [s2, c2] = sincos(lat2); s2 *= f1;
  t = norm(s2, c2); s2 /= t; c2 /= t; c2 = Math.max(tiny, c2);
  if (c1 < -s1) { if (c2 === c1) s2 = sign(s1, s2); }
  else if (Math.abs(s2) === -s1) c2 = c1;
  const dn1 = sqrt(1 + ep2 * sq(s1)), dn2 = sqrt(1 + ep2 * sq(s2));
  if (lat1 === -90 || slam === 0) {
    const cs1 = clam * c1;
    const sig = atan2(Math.max(0, cs1 * s2 - s1 * c2), cs1 * c2 + s1 * s2);
    const v = lengths(n, sig, s1, cs1, dn1, s2, c2, dn2, true, true);
    if (sig < tol2 || v.reduced >= 0) {
      if (sig < 3 * tiny || (sig < tol0 && (v.distance < 0 || v.reduced < 0))) return 0;
      return 0 + v.distance * b;
    }
  }
  if (s1 === 0 && lone >= f * 180) return 0 + a * lam;
  const initial = start(s1, c1, s2, c2, lam, slam, clam);
  if (initial.sig >= 0) return 0 + initial.sig * b * initial.dnm;
  let sa = initial.sa, ca = initial.ca, saa = tiny, caa = 1, sab = tiny, cab = -1;
  let tripn = false, tripb = false, result = emptyLambda();
  for (let iteration = 0; iteration <= 83; iteration++) {
    result = lambda(s1, c1, dn1, s2, c2, dn2, sa, ca, slam, clam, iteration < 20);
    const v = result.lam, dv = result.derivative;
    if (!Number.isFinite(v)) return NaN;
    if (tripb || !(Math.abs(v) >= (tripn ? 8 : 1) * tol0)) break;
    if (iteration === 83) return NaN; // Explicit exhaustion, never a spherical fallback.
    if (v > 0 && (iteration < 20 || ca / sa > cab / sab)) { sab = sa; cab = ca; }
    else if (v < 0 && (iteration < 20 || ca / sa < caa / saa)) { saa = sa; caa = ca; }
    if (iteration < 20 && dv > 0) {
      const delta = -v / dv;
      if (Math.abs(delta) < pi) {
        const sd = sin(delta), cd = cos(delta), nsa = sa * cd + ca * sd;
        if (nsa > 0) {
          ca = ca * cd - sa * sd; sa = nsa;
          t = norm(sa, ca); sa /= t; ca /= t;
          tripn = Math.abs(v) <= 16 * tol0;
          continue;
        }
      }
    }
    sa = (saa + sab) / 2; ca = (caa + cab) / 2;
    t = norm(sa, ca); sa /= t; ca /= t; tripn = false;
    tripb = Math.abs(saa - sa) + (caa - ca) < tol0 || Math.abs(sa - sab) + (ca - cab) < tol0;
  }
  return 0 + lengths(result.eps, result.sig, result.ss1, result.cs1, dn1,
    result.ss2, result.cs2, dn2, true, false).distance * b;
}
