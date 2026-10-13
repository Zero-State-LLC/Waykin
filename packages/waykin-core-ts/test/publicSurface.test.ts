import test from "node:test";
import assert from "node:assert/strict";
// Consumer boundary: no private-module imports or Lens globals.
import { CanonicalCompanionIdentity, DemoSessionController, MovementEngine,
  CompanionWalkExperience, CompanionRuntime, CompanionPresentationMatrix,
  AudioExperienceLayer, PathProgressEngine, PathAudioCoupling, WalkPathCopy,
  makeExperienceContext, type LocationSample,
  type DemoEndResult, type DemoScenarioID, type Companion } from "../src/index.js";

test("public barrel supports injected-clock demo lifecycle and summary consumption", () => {
  let nextID = 0;
  const identity = { now: () => 1000, newID: () => `consumer-${++nextID}` };
  const movement = new MovementEngine(identity.now, identity.newID);
  const demo = new DemoSessionController(movement, identity);
  const companion: Companion = CanonicalCompanionIdentity.defaultCompanion();
  const scenario: DemoScenarioID = "calmDayWalk";
  demo.start(scenario);
  demo.pause();
  demo.runToEnd();
  assert.equal(demo.tickIndex, 0);
  demo.resume();
  demo.runToEnd();
  assert.equal(demo.tickIndex, 7);
  const ended: DemoEndResult = demo.end();
  assert.equal(ended.result?.outcome, "COMPLETED");
  assert.equal(ended.summary?.distanceMeters, 392);
  assert.equal(ended.summary?.memory.sessionID, ended.session?.id);
  assert.equal(companion.bondLevel, 12); // Caller owns applying/persisting the result.
  assert.equal(movement.currentSession, null);
});

test("consumed walk boundary composes movement, experience, companion, path and audio", () => {
  const movement = new MovementEngine(() => 1000, () => "walk-session");
  const sample: LocationSample = { timestamp: 1000, latitude: 0, longitude: 0,
    altitude: 0, horizontalAccuracy: 1, reportedSpeedMetersPerSecond: 1.4 };
  movement.startSession("walk", "companion_walk");
  movement.resumeSession();
  assert.equal(movement.ingestRealLocationSample(sample).diagnostic.disposition, "awaitingFreshAnchor");
  movement.pauseSession();
  assert.equal(movement.ingestRealLocationSample(sample).diagnostic.disposition, "rejectedPaused");
  movement.resumeSession();
  movement.simulate(40, 1.4);

  const context = makeExperienceContext({ timeOfDay: "midday", activity: "walk", bondLevel: 12 });
  const experience = new CompanionWalkExperience();
  const snapshot = { timestamp: 1000, speed: 1.4, distanceDelta: 56, isMoving: true };
  const update = experience.update(experience.start(context), snapshot, context);
  const runtime = new CompanionRuntime();
  update.companionCommands.forEach(command => runtime.applyCommand(command));
  runtime.applyEvent(update.state.runtimeState!.value.lastEvent);
  assert.ok(runtime.relativeDistance > 0);
  const event = { kind: "bondMoment", intensity: 0.8, debugLabel: "bondMoment" } as const;
  const ar = CompanionPresentationMatrix.arBehaviorString({ state: runtime.state, event: event.kind });
  assert.equal(ar, "celebrate");
  assert.equal(AudioExperienceLayer.map(event).kind, "bondMotif");
  assert.equal(AudioExperienceLayer.cueForARPresentationTransition("follow", ar, 20, null)?.kind, "bondMotif");
  assert.equal(AudioExperienceLayer.momentCue("spawn").kind, "spawnTheme");

  const path = new PathProgressEngine();
  path.reset(false);
  path.recordAccepted(snapshot);
  path.recordAccepted(snapshot);
  assert.equal(path.snapshot.relation, "onPath");
  for (let i = 0; i < 3; i++) path.recordRejected();
  assert.equal(path.snapshot.relation, "strained");
  assert.equal(PathAudioCoupling.cue("onPath", path.snapshot.relation, "inactive")?.kind, "quietShift");
  assert.equal(WalkPathCopy.pathLine(path.snapshot.relation, path.snapshot.metersAlongPath), "Path felt strained · 112 m along the path");
  const result = experience.finish(update.state, movement.endSession());
  assert.equal(typeof result.memoryText, "string");
  assert.equal(movement.currentSession, null);
});
