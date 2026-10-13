import assert from "node:assert/strict";
import test from "node:test";
import {
  U64_ZERO, UINT64_MAX, add, checkedAdd, checkedMul, cmp, eq, mod, mul,
  parseU64, shr, sub, toDecimal, xor,
} from "../src/uint64.js";
import { SeededRandomNumberGenerator } from "../src/rng.js";

// The oracle is deliberately Node-only; none of these literals ship in src/.
const MAX = (1n << 64n) - 1n;
const words = (value: bigint) => parseU64(value.toString());
const decimal = (value: bigint) => (value & MAX).toString();
const samples = [0n, 1n, 0xffffffffn, 0x100000000n, 0x8000000000000000n, MAX,
  0x123456789abcdef0n, 0xfedcba9876543210n];

test("canonical UInt64 decimal boundaries", () => {
  for (const value of samples) assert.equal(toDecimal(words(value)), value.toString());
  assert.equal(toDecimal(UINT64_MAX), MAX.toString());
  assert.ok(eq(U64_ZERO, words(0n)));
  for (const bad of ["", "01", "-1", " 1", "18446744073709551616"]) {
    assert.throws(() => parseU64(bad), RangeError, bad);
  }
});

test("two-word UInt64 arithmetic agrees with independent BigInt oracle", () => {
  for (const a of samples) for (const b of samples) {
    const x = words(a), y = words(b);
    assert.equal(toDecimal(add(x, y)), decimal(a + b), `add ${a} ${b}`);
    assert.equal(toDecimal(sub(x, y)), decimal(a - b), `sub ${a} ${b}`);
    assert.equal(toDecimal(mul(x, y)), decimal(a * b), `mul ${a} ${b}`);
    assert.equal(toDecimal(xor(x, y)), decimal(a ^ b), `xor ${a} ${b}`);
    assert.equal(cmp(x, y), a < b ? -1 : a > b ? 1 : 0);
    if (b !== 0n) assert.equal(toDecimal(mod(x, y)), (a % b).toString(), `mod ${a} ${b}`);
  }
  assert.throws(() => mod(words(1n), U64_ZERO), RangeError);
});

test("shifts cross both word boundaries exactly", () => {
  for (const a of samples) for (const shift of [0, 1, 31, 32, 33, 63, 64, 65]) {
    assert.equal(toDecimal(shr(words(a), shift)), (a >> BigInt(shift)).toString(), `${a} >> ${shift}`);
  }
  assert.throws(() => shr(words(1n), -1), RangeError);
  assert.throws(() => shr(words(1n), 0.5), RangeError);
});

test("checked arithmetic traps rather than wraps", () => {
  for (const a of samples) for (const b of samples) {
    const x = words(a), y = words(b);
    if (a + b > MAX) assert.throws(() => checkedAdd(x, y), RangeError);
    else assert.equal(toDecimal(checkedAdd(x, y)), (a + b).toString());
    if (a * b > MAX) assert.throws(() => checkedMul(x, y), RangeError);
    else assert.equal(toDecimal(checkedMul(x, y)), (a * b).toString());
  }
});

test("seed-0 RNG agrees with independently computed SplitMix64 stream", () => {
  const rng = new SeededRandomNumberGenerator(words(0n));
  let state = 0x9e3779b97f4a7c15n;
  for (let i = 0; i < 32; i++) {
    state = (state + 0x9e3779b97f4a7c15n) & MAX;
    let z = state;
    z = ((z ^ (z >> 30n)) * 0xbf58476d1ce4e5b9n) & MAX;
    z = ((z ^ (z >> 27n)) * 0x94d049bb133111ebn) & MAX;
    assert.equal(toDecimal(rng.next()), (z ^ (z >> 31n)).toString(), `rng[${i}]`);
  }
});
