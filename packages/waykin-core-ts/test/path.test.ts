/** Source-mapped Swift contracts. Full Swift-generated path fixtures remain pending. */
import assert from "node:assert/strict";
import test from "node:test";
import { PathProgressEngine as Engine, PathAudioCoupling as Audio, WalkPathCopy as Copy,
  makePathProgressSnapshot, makeAudioCue } from "../src/index.js";

test("path establishment, rejection thresholds and two-accept recovery", () => {
  const engine = new Engine();
  engine.recordAccepted({ isMoving: true, distanceDelta: 2 });
  assert.equal(engine.snapshot.relation, "establishing");
  engine.recordAccepted({ isMoving: true, distanceDelta: 3 });
  assert.equal(engine.snapshot.relation, "onPath");
  for (let i = 0; i < 2; i++) engine.recordRejected();
  assert.equal(engine.snapshot.relation, "onPath");
  engine.recordRejected();
  assert.equal(engine.snapshot.relation, "strained");
  for (let i = 0; i < 4; i++) engine.recordRejected();
  assert.equal(engine.snapshot.relation, "strained");
  engine.recordRejected();
  assert.equal(engine.snapshot.relation, "offPath");
  assert.equal(engine.snapshot.integrityPressure, 0.75 + 8 * 0.03);
  engine.recordAccepted({ isMoving: true, distanceDelta: 4 });
  assert.equal(engine.snapshot.relation, "recovered");
  assert.equal(engine.snapshot.rejectedStreak, 0);
  engine.recordAccepted({ isMoving: true, distanceDelta: 5 });
  assert.equal(engine.snapshot.relation, "onPath");
  assert.equal(engine.snapshot.metersAlongPath, 14);
  assert.equal(engine.snapshot.acceptedSampleCount, 4);
});

test("stationary accepts strain at five and never accumulate distance", () => {
  const engine = new Engine();
  engine.recordAccepted({ isMoving: true, distanceDelta: 1 });
  engine.recordAccepted({ isMoving: true, distanceDelta: 1 });
  for (let i = 0; i < 4; i++) engine.recordAccepted({ isMoving: false, distanceDelta: 100 });
  assert.equal(engine.snapshot.relation, "onPath");
  assert.equal(engine.snapshot.integrityPressure, 0.03);
  engine.recordAccepted({ isMoving: false, distanceDelta: 100 });
  assert.equal(engine.snapshot.relation, "strained");
  assert.equal(engine.snapshot.integrityPressure, 0.45 + 0.06);
  engine.recordRejected(); // Swift deliberately retains the stationary streak.
  assert.equal(engine.snapshot.integrityPressure, 0.45 + 0.03 + 0.06);
  engine.recordAccepted({ isMoving: true, distanceDelta: 0 });
  assert.equal(engine.snapshot.relation, "onPath");
  assert.equal(engine.snapshot.integrityPressure, 0);
  assert.equal(engine.snapshot.metersAlongPath, 2);
});

test("invalid distance, snapshot value semantics and reset", () => {
  const engine = new Engine();
  for (const distanceDelta of [NaN, Infinity, -Infinity, -1]) engine.recordAccepted({ isMoving: true, distanceDelta });
  assert.equal(engine.snapshot.metersAlongPath, 0);
  const old = engine.snapshot;
  old.metersAlongPath = 999;
  assert.equal(engine.snapshot.metersAlongPath, 0);
  engine.recordRejected();
  engine.reset(true);
  assert.deepEqual(engine.snapshot, makePathProgressSnapshot({ isDemo: true }));
  engine.recordAccepted({ isMoving: true, distanceDelta: 1 });
  assert.equal(engine.snapshot.relation, "establishing");
});

test("snapshot initializer and pressure clamps mirror Swift", () => {
  assert.deepEqual(makePathProgressSnapshot({ metersAlongPath: NaN, integrityPressure: Infinity,
    acceptedSampleCount: -1, rejectedStreak: -4 }), makePathProgressSnapshot());
  assert.equal(makePathProgressSnapshot({ integrityPressure: 2 }).integrityPressure, 1);
  assert.equal(Engine.pressure("offPath", 100, 100), 1);
  assert.equal(Engine.relationAfterAccept("offPath", true, 1, 0, 1), "establishing");
  assert.equal(Engine.relationAfterAccept("offPath", false, 0, 5, 2), "offPath");
  assert.equal(Engine.relationAfterAccept("recovered", false, 0, 5, 2), "recovered");
  assert.equal(Engine.relationAfterReject("establishing", 2), "establishing");
  assert.equal(Engine.relationAfterReject("offPath", 3), "offPath");
});

test("path audio suppresses repeats, active pursuit and cooldown strictly below 14 seconds", () => {
  assert.equal(Audio.cue("strained", "strained", "inactive"), null);
  for (const pursuit of ["noticed", "approaching", "close"] as const) {
    assert.equal(Audio.cue("onPath", "offPath", pursuit), null);
  }
  assert.equal(Audio.cue("onPath", "offPath", "inactive", 23.999, 10), null);
  assert.equal(Audio.cue("onPath", "offPath", "inactive", 9, 10), null);
  assert.deepEqual(Audio.cue("onPath", "offPath", "inactive", 24, 10), {
    kind: "quietShift", intensity: 0.5, spatialBias: "behind", priority: 1,
    cooldownGroup: "path", shouldFade: true, debugLabel: "path:offPath",
  });
  assert.equal(Audio.cue("onPath", "strained", "fading")?.intensity, 0.35);
  assert.equal(Audio.cue("offPath", "recovered", "inactive")?.kind, "pursuitRelease");
  assert.equal(Audio.cue("offPath", "recovered", "inactive")?.priority, 2);
  assert.equal(Audio.cue("recovered", "onPath", "inactive"), null);
  assert.equal(Audio.cue("onPath", "establishing", "inactive"), null);
});

test("semantic cue initializer clamps intensity and priority", () => {
  const cue = makeAudioCue({ kind: "quietShift", intensity: NaN, priority: -1,
    cooldownGroup: "path", shouldFade: true, debugLabel: "test" });
  assert.equal(cue.intensity, 0);
  assert.equal(cue.priority, 0);
  assert.equal(cue.spatialBias, null);
  assert.equal(makeAudioCue({ ...cue, intensity: 2 }).intensity, 1);
});

test("walk copy truncates meters, handles nonfinite input and preserves exact strings", () => {
  assert.equal(Copy.pathLine("establishing", NaN), "Path establishing");
  assert.equal(Copy.pathLine("establishing", 1.9), "Path establishing · 1 m along the path");
  assert.equal(Copy.pathLine("onPath", 12.99), "Path held steady · 12 m along the path");
  assert.equal(Copy.pathLine("strained", -5), "Path felt strained · 0 m along the path");
  assert.equal(Copy.pathLine("offPath", Infinity), "Path slipped · 0 m along the path");
  assert.equal(Copy.pathLine("recovered", 7), "Path found again · 7 m along the path");
  assert.equal(Copy.pathLine("onPath", 1000000000000000128), "Path held steady · 1000000000000000128 m along the path");
  assert.throws(() => Copy.pathLine("onPath", 2 ** 63), RangeError);
  assert.equal(Copy.cadenceLine("unknown"), null);
  assert.equal(Copy.cadenceLine("low"), "Steps felt light");
  assert.equal(Copy.cadenceLine("moderate"), "Steps felt steady");
  assert.equal(Copy.cadenceLine("high"), "Steps felt strong");
});

test("memory suffix preserves establishing text and removes only the final period", () => {
  assert.equal(Copy.appendingMemorySuffix("  Original. \n", "establishing"), "  Original. \n");
  assert.equal(Copy.appendingMemorySuffix(" \n", "recovered"), "Lira stayed close; the path found you again.");
  assert.equal(Copy.appendingMemorySuffix(" Walk. \n", "onPath"), "Walk; the path held steady.");
  assert.equal(Copy.appendingMemorySuffix("Walk...", "strained"), "Walk..; the path felt strained.");
  assert.equal(Copy.appendingMemorySuffix("Walk!", "offPath"), "Walk!; the path slipped for a while.");
  assert.equal(Copy.appendingMemorySuffix("\u0085\u200bWalk.\u200b", "onPath"), "Walk; the path held steady.");
  assert.equal(Copy.appendingMemorySuffix("\ufeffWalk.", "onPath"), "\ufeffWalk; the path held steady.");
});
