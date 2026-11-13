import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { DemoSessionController } from "../src/demoSession.js";
import { MovementEngine } from "../src/movementEngine.js";
import { validateFamilySchema } from "./familySchema.js";

function withoutEventClock(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(withoutEventClock);
  if (value !== null && typeof value === "object") return Object.fromEntries(Object.entries(value)
    .filter(([key]) => key !== "occurredAt" && key !== "lastEventAt")
    .map(([key, item]) => [key, withoutEventClock(item)]));
  return value;
}
function snapshot(demo: DemoSessionController) {
  const session = demo.movementEngine.currentSession;
  const walk = demo.companionWalkState;
  return { isRunning: demo.isRunning, isPaused: demo.isPaused, tickIndex: demo.tickIndex,
    scenarioID: demo.currentScenario?.id ?? null, currentEvent: withoutEventClock(demo.currentEvent),
    currentAudioCue: demo.currentAudioCue, companionRuntime: { state: demo.companionRuntime.state,
      relativeDistance: demo.companionRuntime.relativeDistance },
    walk: walk ? withoutEventClock({ kind: "companionWalk", value: walk }) : null,
    session: session ? { movementState: session.movementState, elapsedTime: session.elapsedTime,
      activeTime: session.activeTime, distanceMeters: session.distanceMeters,
      currentSpeedMetersPerSecond: session.currentSpeedMetersPerSecond, averageSpeedMetersPerSecond: session.averageSpeedMetersPerSecond,
      route: session.routePoints.map(point => ({ latitude: point.latitude, longitude: point.longitude, altitude: point.altitude, speed: point.speed })) } : null };
}

test("Swift-generated demo family matches pause, every tick, summary and repeated end", () => {
  let repo = process.cwd();
  while (!existsSync(join(repo, "specs/001-spectacles-lira-walk/contracts"))) {
    const parent = dirname(repo); assert.notEqual(parent, repo); repo = parent;
  }
  const directory = join(process.env.WAYKIN_VECTORS_DIR ?? join(repo, "Tests/Vectors"), "demo");
  assert.ok(existsSync(directory), "Missing Swift demo vectors: run make vectors; do not fabricate fixtures");
  assert.deepEqual(readdirSync(directory).filter(file => file.endsWith(".json")).sort(), ["pause-and-complete.json"]);
  const raw = JSON.parse(readFileSync(join(directory, "pause-and-complete.json"), "utf8"));
  validateFamilySchema(raw, JSON.parse(readFileSync(join(repo, "specs/001-spectacles-lira-walk/contracts/demo-vectors.schema.json"), "utf8")));
  const frames = (raw as { frames: { action: string; expected: unknown; ended: unknown }[] }).frames;
  assert.deepEqual(frames.map(frame => frame.action), ["start", "pause", "runToEnd", "resume", "advance",
    "pause", "advance", "runToEnd", "resume", ...Array(6).fill("advance"), "runToEnd", "end", "end"]);
  let id = 0;
  const identity = { now: () => 1000, newID: () => `test-${++id}` };
  const demo = new DemoSessionController(new MovementEngine(identity.now, identity.newID), identity);
  for (const [index, frame] of frames.entries()) {
    let ended: unknown = null;
    switch (frame.action) {
      case "start": demo.start("calmDayWalk"); break;
      case "pause": demo.pause(); break;
      case "resume": demo.resume(); break;
      case "advance": demo.advanceOneTick(); break;
      case "runToEnd": demo.runToEnd(); break;
      case "end": {
        const output = demo.end(); const summary = output.summary;
        ended = { result: output.result, summary: summary ? { activity: summary.activity, experience: summary.experience,
          variant: summary.variant, duration: summary.duration, activeTime: summary.activeTime,
          distanceMeters: summary.distanceMeters, averageSpeed: summary.averageSpeed, outcome: summary.outcome,
          bondDelta: summary.bondDelta, memoryText: summary.memory.text } : null };
        break;
      }
      default: assert.fail(`Unknown action ${frame.action}`);
    }
    assert.deepEqual(snapshot(demo), frame.expected, `frame ${index} ${frame.action}`);
    assert.deepEqual(ended, frame.ended, `frame ${index} ending`);
  }
});
