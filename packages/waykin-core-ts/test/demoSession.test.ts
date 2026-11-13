import test from "node:test";
import assert from "node:assert/strict";
import { DemoSessionController } from "../src/demoSession.js";
import { MovementEngine, MovementError } from "../src/movementEngine.js";

function controller() {
  let id = 0;
  const identity = { now: () => 1000, newID: () => `id-${++id}` };
  return new DemoSessionController(new MovementEngine(identity.now, identity.newID), identity);
}

test("demo has one scenario and emits the seven canonical events, cues and summary", () => {
  const demo = controller();
  assert.deepEqual(demo.availableScenarios().map(s => s.id), ["calmDayWalk"]);
  demo.start("calmDayWalk");
  const kinds: string[] = [];
  const cues: string[] = [];
  for (let i = 0; i < 7; i++) {
    demo.advanceOneTick();
    kinds.push(demo.currentEvent!.kind);
    cues.push(demo.currentAudioCue!.kind);
  }
  assert.deepEqual(kinds, ["companionObserves", "companionDrawsNear", "distantPresence", "pursuitBegins",
    "pursuitIntensifies", "pursuitFades", "bondMoment"]);
  assert.deepEqual(cues, ["quietShift", "companionNear", "distantFootsteps", "distantFootsteps",
    "pursuitPressure", "pursuitRelease", "bondMotif"]);
  assert.equal(demo.companionWalkState!.pursuitState, "fading");
  demo.advanceOneTick();
  assert.equal(demo.tickIndex, 7);
  assert.equal(demo.isRunning, true);
  const ended = demo.end();
  assert.equal(ended.session!.distanceMeters, 392);
  assert.equal(ended.summary!.duration, 280);
  assert.equal(ended.summary!.activeTime, 280);
  assert.equal(ended.summary!.bondDelta, 2);
  assert.equal(ended.summary!.memory.text,
    "Lira watched the path, drew close when a distant presence appeared, and stayed beside you until it faded.");
  assert.equal(ended.summary!.memory.sessionID, ended.session!.id);
  assert.equal(ended.summary!.memory.timestamp, 1000);
  assert.equal(demo.currentScenario, null);
  assert.equal(demo.companionWalkState, null);
  assert.equal(demo.currentEvent, null);
  assert.equal(demo.currentAudioCue, null);
  assert.equal(demo.tickIndex, 0);
  assert.equal(demo.presentationState.statusText, "Session complete");
  assert.deepEqual(demo.end(), { session: null, result: null, summary: null });
});

test("#25 paused runToEnd returns without changing progress; resume completes once", { timeout: 1000 }, () => {
  const demo = controller();
  demo.start("calmDayWalk");
  demo.advanceOneTick();
  demo.pause();
  const previous = demo.companionWalkState;
  const distance = demo.movementEngine.currentSession!.distanceMeters;
  demo.runToEnd();
  assert.equal(demo.isRunning, true);
  assert.equal(demo.isPaused, true);
  assert.equal(demo.tickIndex, 1);
  assert.deepEqual(demo.companionWalkState, previous);
  assert.equal(demo.movementEngine.currentSession!.distanceMeters, distance);
  demo.resume();
  demo.runToEnd();
  assert.equal(demo.tickIndex, 7);
  assert.equal(demo.companionWalkState!.eventHistory.length, 7);
  assert.equal(demo.end().result!.outcome, "COMPLETED");
});

test("demo getters return copies and early end leaves no active movement session", () => {
  const demo = controller();
  demo.start("calmDayWalk");
  demo.currentScenario!.ticks[0]!.speed = 999;
  demo.advanceOneTick();
  demo.companionWalkState!.eventHistory.length = 0;
  demo.companionRuntime.state = "celebrate";
  demo.presentationState.route[0]!.lat = 999;
  assert.equal(demo.companionWalkState!.eventHistory.length, 1);
  assert.equal(demo.companionRuntime.state, "observe");
  assert.notEqual(demo.presentationState.route[0]!.lat, 999);
  assert.equal(demo.end().summary!.distanceMeters, 56);
  assert.equal(demo.movementEngine.currentSession, null);
});

test("pause before first tick, repeated controls and restart preserve Swift ordering", () => {
  const demo = controller();
  demo.pause(); demo.resume(); demo.runToEnd(); demo.restart();
  demo.start("calmDayWalk");
  demo.pause(); demo.pause(); demo.runToEnd();
  assert.equal(demo.tickIndex, 0);
  demo.resume(); demo.resume(); demo.advanceOneTick();
  assert.equal(demo.tickIndex, 1);
  assert.throws(() => demo.restart(), (error: unknown) => error instanceof MovementError && error.code === "sessionAlreadyActive");
  assert.equal(demo.tickIndex, 0); // Swift resets controller fields before startSession throws.
  demo.end();
});
