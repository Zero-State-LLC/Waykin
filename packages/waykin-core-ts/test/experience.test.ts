import test from "node:test";
import assert from "node:assert/strict";
import { CompanionWalkExperience, makeExperienceContext, type ExperienceSessionState } from "../src/experience.js";
import { WorldEventGenerator } from "../src/worldEventGenerator.js";
import type { WorldEventKind } from "../src/worldState.js";

const context = makeExperienceContext({ timeOfDay: "day", activity: "walk", bondLevel: 12 });
const experience = new CompanionWalkExperience();
const moving = { timestamp: 100, speed: 1.5, distanceDelta: 60, isMoving: true };
const paused = { timestamp: 101, speed: 0, distanceDelta: 0, isMoving: false };

test("start defaults and tick arithmetic preserve input value semantics", () => {
  const initial = experience.start(context);
  const before = JSON.stringify(initial);
  assert.equal(initial.runtimeState!.value.worldState!.timeContext, "midday");
  const update = experience.updateForDemo(initial, moving, context, null);
  const walk = update.state.runtimeState!.value;
  assert.equal(walk.movementSeconds, 40);
  assert.equal(walk.accumulatedBondProgress, 0.4);
  assert.equal(walk.worldState!.sessionDistanceMeters, 60);
  assert.equal(walk.worldState!.pressure, 0);
  assert.deepEqual(update.audioCues, []);
  assert.equal(JSON.stringify(initial), before);
  const stopped = experience.updateForDemo(update.state, paused, context, null);
  assert.equal(stopped.state.runtimeState!.value.movementSeconds, 40);
  assert.deepEqual(stopped.audioCues, ["quietShift"]);
  assert.equal(stopped.state.runtimeState!.value.lastBehaviorAudioElapsed, 40);
  assert.equal(walk.lastBehaviorAudioElapsed, null);
});

test("scheduled pursuit enforces every predecessor and never falls back to generation", () => {
  let state = experience.start(context);
  const tick = (kind: WorldEventKind, expected: string, emitted = true) => {
    const result = experience.updateForDemo(state, moving, context, kind);
    assert.equal(result.state.runtimeState!.value.pursuitState, expected);
    assert.deepEqual(result.narrativeEvents, emitted ? [kind] : []);
    state = result.state;
  };
  tick("pursuitBegins", "inactive", false);
  tick("pursuitFades", "inactive", false);
  tick("distantPresence", "noticed");
  tick("distantPresence", "noticed", false);
  tick("pursuitIntensifies", "noticed", false);
  tick("pursuitBegins", "approaching");
  tick("pursuitIntensifies", "close");
  tick("pursuitIntensifies", "close");
  tick("pursuitFades", "fading");
  tick("distantPresence", "fading", false);
  tick("pursuitBegins", "fading", false);
});

test("generated ticks use external cooldown and fresh seeded RNG", () => {
  let state = experience.start(context);
  const first = experience.update(state, moving, context);
  const walk = first.state.runtimeState!.value;
  assert.equal(walk.lastEventElapsed, 40);
  const firstEvent = walk.lastEvent!;
  state = experience.update(first.state, { ...moving, distanceDelta: 1.5 }, context).state;
  assert.equal(state.runtimeState!.value.eventHistory.length, 1);
  assert.equal(state.runtimeState!.value.worldState!.lastEventAt, 100);
  const next = experience.update(state, { ...moving, timestamp: 200 }, context);
  const world = next.state.runtimeState!.value.worldState!;
  const expected = new WorldEventGenerator(context.eventSeed).evaluate({ state: world, elapsed: 81,
    externalLastGeneratedAtElapsed: 40, externalLastFiredAtElapsedByKind: { [firstEvent.kind]: 40 },
    allowedKinds: ["companionDrawsNear", "companionMovesAhead", "companionObserves", "distantPresence",
      "familiarPlaceStirs", "quietInterval", "bondMoment"] });
  assert.equal(next.state.runtimeState!.value.lastEvent!.kind, expected!.kind);
  assert.equal(next.state.runtimeState!.value.lastEvent!.occurredAt, 200);
  assert.equal(walk.eventHistory.length, 1);
});

test("memory precedence uses only retained history and floors Bond", () => {
  let state = experience.start(context);
  for (const kind of ["companionObserves", "companionDrawsNear", "distantPresence", "pursuitBegins", "pursuitFades"] as const)
    state = experience.updateForDemo(state, moving, context, kind).state;
  assert.equal(experience.finish(state, { distanceMeters: 300.9 }).memoryText,
    "Lira watched the path, drew close when a distant presence appeared, and stayed beside you until it faded.");
  for (let i = 0; i < 32; i++) state = experience.updateForDemo(state, moving, context, "quietInterval").state;
  assert.equal(state.runtimeState!.value.eventHistory.length, 32);
  assert.equal(experience.finish(state, { distanceMeters: 300.9 }).memoryText, "Lira stayed close during a quiet 300m walk.");
  assert.equal(experience.finish(state, { distanceMeters: 300.9 }).bondDelta, 14);
});

test("empty state, night copy and non-finite movement match Swift guards", () => {
  const empty: ExperienceSessionState = { runtimeState: null, narrative: ["prior"] };
  assert.deepEqual(experience.update(empty, moving, context), { state: empty,
    companionCommands: [], audioCues: [], semanticAudioCues: [], narrativeEvents: [], rewardEvents: [] });
  assert.deepEqual(experience.finish(empty, { distanceMeters: 0 }),
    { outcome: "COMPLETED", bondDelta: 1, memoryText: "Walk completed." });
  const night = makeExperienceContext({ timeOfDay: "night", activity: "walk", activityEnergyHint: 9 });
  const initial = experience.start(night);
  assert.equal(initial.runtimeState!.value.tone, "calm_guardian");
  const update = experience.updateForDemo(initial, { ...moving, speed: NaN, distanceDelta: Infinity }, night, null);
  assert.equal(update.state.runtimeState!.value.movementSeconds, 1);
  assert.equal(update.state.runtimeState!.value.worldState!.energy, 1);
  assert.equal(update.state.runtimeState!.value.worldState!.currentSpeedMetersPerSecond, 0);
  assert.deepEqual(update.companionCommands[0], { kind: "showMessage", value: "Lira keeps close in the dark." });
});
