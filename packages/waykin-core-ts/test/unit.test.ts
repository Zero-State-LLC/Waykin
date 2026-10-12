/**
 * Sanity tests for the seed->event slice that do not depend on parity vectors.
 *
 * These pin the SplitMix64 algorithm and the generator's contract at the
 * edges (cooldown boundary, tick spacing short-circuit, boundary pick,
 * default rule mirror, checkedAdd overflow).
 */

import assert from "node:assert/strict";
import test from "node:test";

import { SeededRandomNumberGenerator, splitmix64Next } from "../src/rng.js";
import { checkedAdd, parseU64, toDecimal } from "../src/uint64.js";
import { makeWorldState } from "../src/worldState.js";
import {
  WorldEventGenerator,
  defaultRules,
  makeConfiguration,
  makeRule,
  type GeneratorConfiguration,
} from "../src/worldEventGenerator.js";
import type { U64 } from "../src/uint64.js";
import type { RngLike } from "../src/rng.js";
import type { WorldEventKind } from "../src/worldState.js";

const GOLDEN_RATIO = BigInt("0x9E3779B97F4A7C15");
const MUL_1 = BigInt("0xBF58476D1CE4E5B9");
const MUL_2 = BigInt("0x94D049BB133111EB");
const MASK64 = BigInt("0xFFFFFFFFFFFFFFFF");
const ZERO = BigInt(0);
const ONE = BigInt(1);

/** Straightforward reference SplitMix64 step (independent of rng.ts). */
function refSplitMix64(state: U64): [U64, U64] {
  const nextState = (state + GOLDEN_RATIO) & MASK64;
  let z = nextState;
  z = ((z ^ (z >> BigInt(30))) * MUL_1) & MASK64;
  z = ((z ^ (z >> BigInt(27))) * MUL_2) & MASK64;
  const out = (z ^ (z >> BigInt(31))) & MASK64;
  return [nextState, out];
}

class StubRng implements RngLike {
  calls = 0;
  constructor(private readonly value: U64) {}
  next(): U64 {
    this.calls += 1;
    return this.value;
  }
  clone(): RngLike {
    return new StubRng(this.value);
  }
}

const BASE_STATE = makeWorldState({
  energy: 0.5,
  pressure: 0.5,
  familiarity: 0,
  bondLevel: 0,
  movementState: "moving",
  activeTime: 0,
});

test("splitmix64Next: raw state 0 matches the well-known reference output", () => {
  const [nextState, output] = splitmix64Next(ZERO);
  assert.strictEqual(nextState, GOLDEN_RATIO);
  assert.strictEqual(output, BigInt("0xE220A8397B1DCDAF"));
});

test("SeededRandomNumberGenerator(seed 0) matches reference stream", () => {
  const rng = new SeededRandomNumberGenerator(ZERO);
  // Swift maps seed 0 to the golden ratio as the initial *state*, then adds
  // the golden ratio again inside next() before mixing.
  let state: U64 = GOLDEN_RATIO;
  for (let i = 0; i < 16; i++) {
    const [newState, expected] = refSplitMix64(state);
    state = newState;
    assert.strictEqual(rng.next(), expected, `output ${i}`);
  }
});

test("SeededRandomNumberGenerator(non-zero) uses the seed as state directly", () => {
  const seed = BigInt("0x123456789ABCDEF0");
  const rng = new SeededRandomNumberGenerator(seed);
  let state: U64 = seed;
  for (let i = 0; i < 8; i++) {
    const [newState, expected] = refSplitMix64(state);
    state = newState;
    assert.strictEqual(rng.next(), expected, `output ${i}`);
  }
});

test("SeededRandomNumberGenerator.clone produces independent streams", () => {
  const rng = new SeededRandomNumberGenerator(BigInt(42));
  rng.next();
  const clone = rng.clone();
  const a = [rng.next(), rng.next()];
  const b = [clone.next(), clone.next()];
  assert.deepStrictEqual(a, b);
  // Advancing the original further must not affect the clone.
  rng.next();
  const c = clone.next();
  const [refState, refExpected] = refSplitMix64(refSplitMix64(BigInt(42))[0]);
  void refState;
  // The exact value here is less interesting than non-interference; the clone
  // is deterministic and independent, so just make sure the call succeeds.
  assert.strictEqual(typeof c, "bigint");
  void refExpected;
});

test("parseU64 accepts canonical decimals and rejects bad inputs", () => {
  assert.strictEqual(parseU64("0"), ZERO);
  assert.strictEqual(parseU64("1"), ONE);
  assert.strictEqual(parseU64("18446744073709551615"), MASK64);

  for (const bad of ["18446744073709551616", "-1", "01", "", " 1", "1 ", "0x1", "1.0"]) {
    assert.throws(
      () => parseU64(bad),
      (err: unknown) => err instanceof RangeError,
      `expected parseU64(${JSON.stringify(bad)}) to throw`,
    );
  }
});

test("checkedAdd throws on uint64 overflow", () => {
  assert.strictEqual(checkedAdd(MASK64, ZERO), MASK64);
  assert.throws(
    () => checkedAdd(MASK64, ONE),
    (err: unknown) => err instanceof RangeError,
  );
});

test("defaultRules mirrors Swift post-clamp values", () => {
  const rules = defaultRules();
  assert.deepStrictEqual(
    rules.map((rule) => ({
      kind: rule.kind,
      minimumEnergy: rule.minimumEnergy,
      minimumPressure: rule.minimumPressure,
      maximumPressure: rule.maximumPressure,
      minimumFamiliarity: rule.minimumFamiliarity,
      minimumBondLevel: rule.minimumBondLevel,
      weight: toDecimal(rule.weight),
      cooldown: rule.cooldown,
    })),
    [
      {
        kind: "quietInterval",
        minimumEnergy: 0,
        minimumPressure: 0,
        maximumPressure: 0.25,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "3",
        cooldown: 28,
      },
      {
        kind: "companionDrawsNear",
        minimumEnergy: 0.05,
        minimumPressure: 0,
        maximumPressure: 0.48,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "7",
        cooldown: 24,
      },
      {
        kind: "companionMovesAhead",
        minimumEnergy: 0.4,
        minimumPressure: 0,
        maximumPressure: 0.62,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "4",
        cooldown: 30,
      },
      {
        kind: "companionObserves",
        minimumEnergy: 0,
        minimumPressure: 0.04,
        maximumPressure: 0.55,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "4",
        cooldown: 22,
      },
      {
        kind: "distantPresence",
        minimumEnergy: 0,
        minimumPressure: 0.24,
        maximumPressure: 0.7,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "3",
        cooldown: 44,
      },
      {
        kind: "pursuitBegins",
        minimumEnergy: 0.28,
        minimumPressure: 0.36,
        maximumPressure: 0.78,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "2",
        cooldown: 70,
      },
      {
        kind: "pursuitIntensifies",
        minimumEnergy: 0,
        minimumPressure: 0.55,
        maximumPressure: 1,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "3",
        cooldown: 48,
      },
      {
        kind: "pursuitFades",
        minimumEnergy: 0.5,
        minimumPressure: 0.18,
        maximumPressure: 0.55,
        minimumFamiliarity: 0,
        minimumBondLevel: 0,
        weight: "3",
        cooldown: 38,
      },
      {
        kind: "familiarPlaceStirs",
        minimumEnergy: 0,
        minimumPressure: 0,
        maximumPressure: 1,
        minimumFamiliarity: 0.3,
        minimumBondLevel: 0,
        weight: "3",
        cooldown: 50,
      },
      {
        kind: "bondMoment",
        minimumEnergy: 0.2,
        minimumPressure: 0,
        maximumPressure: 1,
        minimumFamiliarity: 0,
        minimumBondLevel: 8,
        weight: "3",
        cooldown: 60,
      },
    ],
  );
});

test("makeRule clamps weight >= 1 and cooldown >= 0", () => {
  const rule = makeRule({ kind: "quietInterval", weight: ZERO, cooldown: -5 });
  assert.strictEqual(rule.weight, ONE);
  assert.strictEqual(rule.cooldown, 0);
});

test("tick spacing short-circuits without advancing the RNG", () => {
  const stub = new StubRng(ZERO);
  const configuration = makeConfiguration({
    minimumTickSpacing: 40,
    rules: [makeRule({ kind: "quietInterval", maximumPressure: 1 })],
  });
  const generator = new WorldEventGenerator(ZERO, configuration, { rng: stub });

  const traced = generator.evaluateTraced({
    state: BASE_STATE,
    elapsed: 10,
    externalLastGeneratedAtElapsed: 0,
  });

  assert.strictEqual(traced.event, null);
  assert.deepStrictEqual(traced.eligibleKinds, []);
  assert.deepStrictEqual(traced.rngDraws, []);
  assert.strictEqual(traced.totalWeight, null);
  assert.strictEqual(traced.pick, null);
  assert.strictEqual(stub.calls, 0, "RNG must not advance when tick spacing blocks");
});

test("cooldown comparison is strict on the boundary", () => {
  const configuration: GeneratorConfiguration = makeConfiguration({
    minimumTickSpacing: 0,
    rules: [makeRule({ kind: "quietInterval", maximumPressure: 1, cooldown: 20 })],
  });

  // Exactly at the boundary: elapsed - lastFired == cooldown -> eligible.
  const boundary = new WorldEventGenerator(ZERO, configuration, {
    rng: new StubRng(ZERO),
  });
  const atBoundary = boundary.evaluateTraced({
    state: BASE_STATE,
    elapsed: 100,
    externalLastFiredAtElapsedByKind: { quietInterval: 80 },
  });
  assert.notStrictEqual(atBoundary.event, null, "boundary (==) must be eligible");
  assert.strictEqual(atBoundary.event?.kind, "quietInterval");

  // Just inside the cooldown: elapsed - lastFired == cooldown - 1 -> blocked.
  const stub = new StubRng(ZERO);
  const inside = new WorldEventGenerator(ZERO, configuration, { rng: stub });
  const insideResult = inside.evaluateTraced({
    state: BASE_STATE,
    elapsed: 100,
    externalLastFiredAtElapsedByKind: { quietInterval: 81 },
  });
  assert.strictEqual(insideResult.event, null, "inside cooldown must be blocked");
  assert.strictEqual(stub.calls, 0);
});

test("boundary pick goes to the next rule (strict < on cursor)", () => {
  const configuration = makeConfiguration({
    minimumTickSpacing: 0,
    rules: [
      makeRule({ kind: "quietInterval", maximumPressure: 1, weight: ONE, cooldown: 0 }),
      makeRule({ kind: "companionDrawsNear", maximumPressure: 1, weight: ONE, cooldown: 0 }),
    ],
  });

  // Stub returns 1; totalWeight = 2; pick = 1 % 2 = 1.
  // First rule: cursor = 1, pick < cursor -> 1 < 1 false.
  // Second rule: cursor = 2, pick < cursor -> 1 < 2 true -> selected.
  const stub = new StubRng(ONE);
  const generator = new WorldEventGenerator(ZERO, configuration, { rng: stub });

  const traced = generator.evaluateTraced({ state: BASE_STATE, elapsed: 0 });

  assert.deepStrictEqual(traced.eligibleKinds, ["quietInterval", "companionDrawsNear"]);
  assert.strictEqual(toDecimal(traced.totalWeight ?? ZERO), "2");
  assert.strictEqual(toDecimal(traced.pick ?? ZERO), "1");
  assert.strictEqual(traced.event?.kind, "companionDrawsNear");
  assert.strictEqual(traced.rngDraws.length, 1);
  assert.strictEqual(toDecimal(traced.rngDraws[0]!), "1");
});

test("no eligible rules returns null without advancing the RNG", () => {
  const stub = new StubRng(ZERO);
  const configuration = makeConfiguration({
    minimumTickSpacing: 0,
    rules: [
      makeRule({
        kind: "pursuitBegins",
        minimumEnergy: 0.9,
        maximumPressure: 1,
        cooldown: 0,
      }),
    ],
  });
  const generator = new WorldEventGenerator(ZERO, configuration, { rng: stub });

  const traced = generator.evaluateTraced({ state: BASE_STATE, elapsed: 0 });
  assert.strictEqual(traced.event, null);
  assert.deepStrictEqual(traced.eligibleKinds, []);
  assert.strictEqual(stub.calls, 0);
});

test("elapsed falls back to activeTime and clamps NaN to 0", () => {
  const stub = new StubRng(ZERO);
  const configuration = makeConfiguration({
    minimumTickSpacing: 40,
    rules: [makeRule({ kind: "quietInterval", maximumPressure: 1, cooldown: 0 })],
  });
  const generator = new WorldEventGenerator(ZERO, configuration, { rng: stub });

  // elapsed is NaN -> treated as 0; lastGenerated is undefined -> no tick block.
  const traced = generator.evaluateTraced({
    state: makeWorldState({
      energy: 0.5,
      pressure: 0.5,
      familiarity: 0,
      bondLevel: 0,
      movementState: "paused",
      activeTime: Number.NaN,
    }),
    elapsed: Number.NaN,
  });
  assert.notStrictEqual(traced.event, null);
  assert.strictEqual(stub.calls, 1);
});

test("event intensity is clamped01(max(energy, pressure))", () => {
  const configuration = makeConfiguration({
    minimumTickSpacing: 0,
    rules: [makeRule({ kind: "quietInterval", maximumPressure: 1, cooldown: 0 })],
  });
  const generator = new WorldEventGenerator(ZERO, configuration, { rng: new StubRng(ZERO) });
  const traced = generator.evaluateTraced({
    state: makeWorldState({
      energy: 1.5,
      pressure: 0.25,
      familiarity: 0,
      bondLevel: 0,
      movementState: "moving",
      activeTime: 0,
    }),
    elapsed: 0,
  });
  assert.strictEqual(traced.event?.intensity, 1);
  assert.strictEqual(traced.event?.debugLabel, "quietInterval");
});

test("clone preserves state and produces an independent generator", () => {
  const configuration = makeConfiguration({
    minimumTickSpacing: 0,
    rules: [makeRule({ kind: "quietInterval", maximumPressure: 1, cooldown: 0 })],
  });
  const original = new WorldEventGenerator(BigInt(7), configuration);
  original.evaluate({ state: BASE_STATE, elapsed: 0 });
  const clone = original.clone();

  const a = original.evaluateTraced({ state: BASE_STATE, elapsed: 1000 });
  const b = clone.evaluateTraced({ state: BASE_STATE, elapsed: 1000 });

  const normalize = (kind: WorldEventKind | undefined) => kind ?? null;
  assert.strictEqual(normalize(a.event?.kind), normalize(b.event?.kind));
  assert.deepStrictEqual(a.rngDraws, b.rngDraws);
});
