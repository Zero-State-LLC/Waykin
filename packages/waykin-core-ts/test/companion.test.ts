/** Swift-source mapping checks; not a replacement for Swift-generated parity. */
import assert from "node:assert/strict";
import test from "node:test";
import {
  CompanionRuntime, CompanionPresentationMatrix as Matrix,
  COMPANION_BEHAVIOR_STATES, WORLD_EVENT_KINDS,
  type CompanionBehaviorState, type WorldEventKind, type ARBehaviorString,
} from "../src/index.js";

const expectations: Record<WorldEventKind, readonly [CompanionBehaviorState, number, ARBehaviorString]> = {
  companionDrawsNear: ["drawNear", 1.2, "follow"],
  companionMovesAhead: ["lead", 4, "follow"],
  companionObserves: ["observe", 2.5, "investigate"],
  distantPresence: ["observe", 2.5, "investigate"],
  pursuitBegins: ["follow", 1.8, "alert"],
  pursuitIntensifies: ["follow", 1.8, "alert"],
  pursuitFades: ["lead", 4, "follow"],
  familiarPlaceStirs: ["observe", 2.5, "investigate"],
  quietInterval: ["rest", 2, "idle"],
  bondMoment: ["drawNear", 1.2, "celebrate"],
};

for (const kind of WORLD_EVENT_KINDS) {
  test(`Swift companion mapping: ${kind}`, () => {
    const [behavior, relativeDistance, ar] = expectations[kind];
    const event = { kind, intensity: 0.8, debugLabel: kind };
    const runtime = new CompanionRuntime();
    runtime.applyEvent(event);
    assert.equal(runtime.state, behavior);
    assert.equal(runtime.relativeDistance, relativeDistance);
    assert.deepEqual(Matrix.resolve(event, true), { behavior, relativeDistance });
    assert.deepEqual(Matrix.resolve(event, false), { behavior, relativeDistance });
    // Every event overlay wins even over severe off-path pressure.
    assert.equal(Matrix.arBehaviorString({ state: "rest", event: kind,
      pathRelation: "offPath", pathIntegrityPressure: 1 }), ar);
  });
}

test("runtime defaults, null events and ignored commands preserve state", () => {
  const runtime = new CompanionRuntime();
  assert.equal(runtime.state, "follow");
  assert.equal(runtime.relativeDistance, 2.5);
  runtime.applyCommand({ kind: "setBehavior", value: "celebrate" });
  runtime.applyCommand({ kind: "setRelativeDistance", value: 3 });
  runtime.applyEvent(null);
  runtime.applyCommand({ kind: "showMessage", value: "hello" });
  runtime.applyCommand({ kind: "setThreatLevel", value: 1 });
  assert.equal(runtime.state, "celebrate");
  assert.equal(runtime.relativeDistance, 3);
});

test("behavior strings match Swift raw-value fallback, including case", () => {
  const runtime = new CompanionRuntime();
  for (const value of COMPANION_BEHAVIOR_STATES) {
    runtime.applyCommand({ kind: "setBehavior", value });
    assert.equal(runtime.state, value);
  }
  for (const value of ["", "Follow", "unknown", "__proto__"]) {
    runtime.applyCommand({ kind: "setBehavior", value });
    assert.equal(runtime.state, "follow");
  }
});

test("invalid distances preserve the previous value", () => {
  const runtime = new CompanionRuntime();
  runtime.applyCommand({ kind: "setRelativeDistance", value: 1.2 });
  for (const value of [0, -0, -1, NaN, Infinity, -Infinity]) {
    runtime.applyCommand({ kind: "setRelativeDistance", value });
    assert.equal(runtime.relativeDistance, 1.2);
  }
  runtime.applyCommand({ kind: "setRelativeDistance", value: Number.MIN_VALUE });
  assert.equal(runtime.relativeDistance, Number.MIN_VALUE);
});

test("no-event presentation differs from runtime's null-event no-op", () => {
  assert.deepEqual(Matrix.resolve(null, true), { behavior: "follow", relativeDistance: 1.8 });
  assert.deepEqual(Matrix.resolve(null, false), { behavior: "observe", relativeDistance: 2.5 });
  const expected: Record<CompanionBehaviorState, ARBehaviorString> = {
    idle: "idle", rest: "idle", follow: "follow", lead: "follow",
    drawNear: "follow", observe: "investigate", celebrate: "celebrate",
  };
  for (const state of COMPANION_BEHAVIOR_STATES) {
    assert.equal(Matrix.arBehaviorString({ state }), expected[state]);
  }
});

test("path pressure uses exact boundaries only while pursuit is quiet", () => {
  for (const pursuitState of ["inactive", "fading"] as const) {
    for (const [pressure, expected] of [
      [0.399999, "follow"], [0.4, "investigate"], [0.699999, "investigate"],
      [0.7, "alert"], [NaN, "follow"], [Infinity, "alert"], [-Infinity, "follow"],
    ] as const) {
      assert.equal(Matrix.arBehaviorString({ state: "follow", pursuitState,
        pathIntegrityPressure: pressure }), expected);
    }
    assert.equal(Matrix.arBehaviorString({ state: "follow", pursuitState,
      pathRelation: "strained" }), "investigate");
    assert.equal(Matrix.arBehaviorString({ state: "follow", pursuitState,
      pathRelation: "offPath" }), "alert");
  }
  for (const pursuitState of ["noticed", "approaching", "close"] as const) {
    assert.equal(Matrix.arBehaviorString({ state: "celebrate", pursuitState,
      pathRelation: "offPath", pathIntegrityPressure: 1 }), "celebrate");
  }
});
