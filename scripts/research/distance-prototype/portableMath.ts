/** Research v0: explicitly ordered arithmetic, not production math. */
const pi = 3.141592653589793;
const halfPi = pi / 2;
const quarterPi = pi / 4;
const twoPi = pi * 2;
const tanPiOver8 = 0.41421356237309503;
const add = (a: number, b: number): number => a + b;
const mul = (a: number, b: number): number => a * b;
const div = (a: number, b: number): number => a / b;
const negative = (x: number): boolean => x < 0 || Object.is(x, -0);
const signed = (x: number, sign: number): number => negative(sign) ? -x : x;

// Deliberately bounded: inverse-geodesic radian arguments only, no silent
// inaccurate large-angle remainder fallback. Outside [-2pi,2pi] returns NaN.
function reduced(x: number): {x: number; cosineSign: number} {
  if (!Number.isFinite(x) || Math.abs(x) > twoPi) return {x: NaN, cosineSign: 1};
  if (x > pi) x = add(x, -twoPi);
  if (x < -pi) x = add(x, twoPi);
  if (x > halfPi) return {x: add(pi, -x), cosineSign: -1};
  if (x < -halfPi) return {x: add(-pi, -x), cosineSign: -1};
  return {x, cosineSign: 1};
}
export function portableSin(x: number): number {
  if (x === 0) return x;
  x = reduced(x).x;
  const z = mul(x, x);
  let term = x, sum = x;
  for (let k = 1; k <= 15; k++) {
    term = mul(term, div(-z, (2 * k) * (2 * k + 1)));
    sum = add(sum, term);
  }
  return sum;
}
export function portableCos(x: number): number {
  const r = reduced(x), z = mul(r.x, r.x);
  let term = 1, sum = 1;
  for (let k = 1; k <= 15; k++) {
    term = mul(term, div(-z, (2 * k - 1) * (2 * k)));
    sum = add(sum, term);
  }
  return mul(r.cosineSign, sum);
}
function atanRatio(r: number): number {
  const reduce = r > tanPiOver8;
  const x = reduce ? div(add(r, -1), add(r, 1)) : r;
  const z = mul(x, x);
  let power = x, sum = x;
  for (let k = 1; k <= 32; k++) {
    power = mul(power, -z);
    sum = add(sum, div(power, 2 * k + 1));
  }
  return reduce ? add(quarterPi, sum) : sum;
}
export function portableAtan2(y: number, x: number): number {
  if (Number.isNaN(x) || Number.isNaN(y)) return NaN;
  if (y === 0) return signed(negative(x) ? pi : 0, y);
  if (x === 0) return signed(halfPi, y);
  if (!Number.isFinite(y)) {
    if (!Number.isFinite(x)) return signed(x > 0 ? quarterPi : mul(3, quarterPi), y);
    return signed(halfPi, y);
  }
  if (!Number.isFinite(x)) return signed(x > 0 ? 0 : pi, y);
  const ax = Math.abs(x), ay = Math.abs(y);
  let a = ay > ax ? add(halfPi, -atanRatio(div(ax, ay))) : atanRatio(div(ay, ax));
  if (x < 0) a = add(pi, -a);
  return signed(a, y);
}
export function portableSqrt(x: number): number { return Math.sqrt(x); }
export function portableCbrt(x: number): number {
  if (!Number.isFinite(x) || x === 0) return x;
  let a = Math.abs(x), scale = 1;
  while (a >= 8) { a = div(a, 8); scale = mul(scale, 2); }
  while (a < 1) { a = mul(a, 8); scale = div(scale, 2); }
  let r = 2;
  for (let k = 0; k < 12; k++) r = div(add(mul(2, r), div(a, mul(r, r))), 3);
  return signed(mul(r, scale), x);
}
