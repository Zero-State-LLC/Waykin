import assert from "node:assert/strict";
import test from "node:test";
import { AudioExperienceLayer as Audio, WORLD_EVENT_KINDS, type WorldEventKind } from "../src/index.js";
const event = (kind: WorldEventKind) => ({ kind, intensity: 0.8, debugLabel: kind });

test("every event maps to the Swift semantic kind and group", () => {
  const expected = {
    companionDrawsNear: ["companionNear", "companion", 2], companionMovesAhead: ["companionAhead", "companion", 2],
    distantPresence: ["distantFootsteps", "pursuit", 3], pursuitBegins: ["distantFootsteps", "pursuit", 3],
    pursuitIntensifies: ["pursuitPressure", "pursuit", 4], pursuitFades: ["pursuitRelease", "pursuit", 3],
    bondMoment: ["bondMotif", "bond", 5], companionObserves: ["quietShift", "ambient", 1],
    familiarPlaceStirs: ["quietShift", "ambient", 1], quietInterval: ["quietShift", "ambient", 1],
  };
  for (const kind of WORLD_EVENT_KINDS) {
    const cue = Audio.map(event(kind));
    assert.deepEqual([cue.kind, cue.cooldownGroup, cue.priority], expected[kind]);
    assert.equal(cue.intensity, 0.8);
    assert.equal(cue.debugLabel, kind);
  }
});

test("stateful cooldown, priority suppression, resolver and session reset", () => {
  let calls = 0;
  const layer = new Audio(() => { calls++; });
  assert.equal(layer.cue(null, 0), null);
  assert.ok(layer.cue(event("pursuitBegins"), 0));
  assert.equal(layer.cue(event("pursuitIntensifies"), 17.999), null);
  assert.ok(layer.cue(event("pursuitIntensifies"), 18));
  assert.equal(layer.cue(event("pursuitFades"), 100), null); // existing higher priority persists
  assert.ok(layer.cue(event("bondMoment"), 19));
  assert.equal(calls, 3);
  assert.equal(layer.activeCueCount, 2);
  layer.endSession();
  assert.equal(layer.activeCueCount, 0);
  assert.ok(layer.cue(event("pursuitFades"), 0));
});

test("behavior transitions seed silently and respect exact cooldown", () => {
  assert.equal(Audio.cueForBehaviorTransition(null, "drawNear", 20, null), null);
  assert.equal(Audio.cueForBehaviorTransition("unknown", "drawNear", 20, null), null);
  assert.equal(Audio.cueForBehaviorTransition("drawNear", "drawNear", 20, null), null);
  assert.equal(Audio.cueForBehaviorTransition("follow", "drawNear", 21.999, 10), null);
  assert.equal(Audio.cueForBehaviorTransition("follow", "drawNear", 22, 10)?.kind, "companionNear");
  assert.equal(Audio.mapBehavior("observe", 0.9)?.intensity, 0.4);
  assert.equal(Audio.mapBehavior("follow"), null);
  assert.equal(Audio.mapBehavior("rest")?.kind, "quietShift");
  assert.equal(Audio.mapBehavior("lead")?.kind, "companionAhead");
  assert.equal(Audio.mapBehavior("celebrate")?.kind, "bondMotif");
});

test("AR normalization, unknown transitions and lifecycle moments", () => {
  assert.equal(Audio.mapARPresentation("\u0085 ALERT\u200b", 1)?.intensity, 0.7);
  assert.equal(Audio.cueForARPresentationTransition(" Alert ", "ALERT", 100, null), null);
  assert.equal(Audio.cueForARPresentationTransition(null, "alert", 100, null), null);
  assert.equal(Audio.cueForARPresentationTransition("idle", "alert", 11.99, 0), null);
  assert.equal(Audio.cueForARPresentationTransition("unknown", "alert", 12, 0)?.kind, "pursuitPressure");
  assert.equal(Audio.mapARPresentation("investigate", 0.9)?.intensity, 0.4);
  assert.equal(Audio.mapARPresentation("unknown"), null);
  for (const moment of ["appLaunch", "companionReveal", "spawn", "bondMilestone"] as const) {
    const cue = Audio.momentCue(moment);
    assert.equal(cue.priority, 6);
    assert.equal(cue.cooldownGroup, "moment");
    assert.equal(cue.debugLabel, `moment:${moment}`);
    assert.equal(cue.intensity, 0.9);
  }
});
