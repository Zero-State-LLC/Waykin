import assert from "node:assert/strict";
import test from "node:test";
import { MovementIntegrityProcessor, MovementEngine, MovementError, movementDistanceMeters,
  makeMovementIntegrityConfiguration, type LocationSample } from "../src/index.js";

const sample = (timestamp: number, meters = 0, extra: Partial<LocationSample> = {}): LocationSample => ({
  timestamp, latitude: meters / 6371008.8 * 180 / Math.PI, longitude: 0,
  horizontalAccuracy: 5, reportedSpeedMetersPerSecond: NaN, ...extra,
});
const close = (actual: number, expected: number) => assert.ok(Math.abs(actual - expected) < 1e-9, `${actual} != ${expected}`);

test("integrity validates coordinates, accuracy and sample freshness before anchoring", () => {
  const p = new MovementIntegrityProcessor();
  for (const [extra, expected] of [
    [{ latitude: NaN }, "rejectedInvalid"], [{ longitude: 181 }, "rejectedInvalid"],
    [{ horizontalAccuracy: Infinity }, "rejectedInvalid"], [{ horizontalAccuracy: -1 }, "rejectedNegativeAccuracy"],
    [{ horizontalAccuracy: 30.001 }, "rejectedAccuracy"],
  ] as const) assert.equal(p.process(sample(0, 0, extra), 0).diagnostic.disposition, expected);
  assert.equal(p.process(sample(0), 15.001).diagnostic.disposition, "rejectedStale");
  assert.equal(p.process(sample(0), -2.001).diagnostic.disposition, "rejectedInvalid");
  assert.equal(p.process(sample(0), 15).diagnostic.disposition, "awaitingFreshAnchor");
  assert.equal(p.process(sample(0), 0).diagnostic.disposition, "rejectedDuplicate");
  assert.equal(p.process(sample(-1), 0).diagnostic.disposition, "rejectedOutOfOrder");
});

test("rejected points do not replace anchor; NaN speed derives from distance", () => {
  const p = new MovementIntegrityProcessor();
  p.process(sample(0), 0);
  assert.equal(p.process(sample(1, 100), 1).diagnostic.disposition, "rejectedImplausibleDisplacement");
  const accepted = p.process(sample(2, 4), 2);
  assert.equal(accepted.diagnostic.disposition, "accepted");
  close(accepted.distanceDelta, 4);
  close(accepted.diagnostic.derivedSpeedMetersPerSecond, 2);
  assert.equal(accepted.sampleInterval, 2);
  assert.equal(accepted.isMoving, true);
  const reset = p.process(sample(18, 1000), 18);
  assert.equal(reset.diagnostic.disposition, "awaitingFreshAnchor");
  assert.equal(reset.distanceDelta, 0);
});

test("speed smoothing, inclusive hysteresis and minimum displacement", () => {
  const p = new MovementIntegrityProcessor({ speedWindowSize: 1 });
  p.process(sample(0), 0);
  assert.equal(p.process(sample(1, 1, { reportedSpeedMetersPerSecond: 0.55 }), 1).isMoving, true);
  const between = p.process(sample(2, 2, { reportedSpeedMetersPerSecond: 0.4 }), 2);
  assert.equal(between.isMoving, true);
  assert.equal(between.distanceDelta, 0);
  assert.equal(p.process(sample(3, 3, { reportedSpeedMetersPerSecond: 0.25 }), 3).isMoving, false);
  assert.equal(p.process(sample(4, 5, { reportedSpeedMetersPerSecond: 0.4 }), 4).isMoving, false);
  const smooth = new MovementIntegrityProcessor();
  smooth.process(sample(0), 0);
  for (let i = 1; i <= 3; i++) smooth.process(sample(i, i * 2, { reportedSpeedMetersPerSecond: i }), i);
  const latest = smooth.process(sample(4, 8, { reportedSpeedMetersPerSecond: 0 }), 4);
  close(latest.diagnostic.derivedSpeedMetersPerSecond, (2 + 3 + 0) / 3);
});

test("accuracy buckets, copied anchor, reset and configuration clamps", () => {
  const p = new MovementIntegrityProcessor();
  const anchor = sample(0);
  p.process(anchor, 0);
  anchor.latitude = 80;
  assert.equal(p.process(sample(1, 2, { horizontalAccuracy: 10 }), 1).diagnostic.accuracyBucket, "precise");
  assert.equal(p.process(sample(2, 4, { horizontalAccuracy: 30 }), 2).diagnostic.accuracyBucket, "usable");
  p.resetAnchor();
  assert.equal(p.process(sample(3, 1000), 3).diagnostic.disposition, "awaitingFreshAnchor");
  const c = makeMovementIntegrityConfiguration({ stationarySpeedThreshold: 1, movingSpeedThreshold: 0.5,
    maximumSampleAge: NaN, speedWindowSize: 0 });
  assert.equal(c.movingSpeedThreshold, 1);
  assert.equal(c.maximumSampleAge, 1);
  assert.equal(c.speedWindowSize, 1);
  assert.throws(() => makeMovementIntegrityConfiguration({ speedWindowSize: 1.5 }), RangeError);
  close(movementDistanceMeters(sample(0), sample(0, 2)), 2);
});

test("session lifecycle rejects invalid transitions and retains diagnostics after end", () => {
  let now = 10;
  const e = new MovementEngine(() => now, () => "session-1");
  assert.throws(() => e.resumeSession(), MovementError);
  assert.equal(e.ingestRealLocationSample(sample(10)).diagnostic.disposition, "rejectedStopped");
  e.startSession("walk", "companion-walk");
  assert.equal(e.rejectedSampleCount, 0);
  assert.throws(() => e.startSession("walk", "again"), /sessionAlreadyActive/);
  assert.throws(() => e.pauseSession(), /invalidTransition/);
  assert.equal(e.ingestRealLocationSample(sample(10)).diagnostic.disposition, "rejectedPaused");
  e.resumeSession();
  assert.throws(() => e.resumeSession(), /invalidTransition/);
  assert.equal(e.ingestRealLocationSample(sample(10)).snapshot, null);
  now = 12;
  const result = e.ingestRealLocationSample(sample(12, 4));
  close(result.snapshot!.distanceDelta, 4);
  assert.equal(e.acceptedSampleCount, 2);
  assert.equal(e.currentSession!.elapsedTime, 2);
  e.pauseSession();
  now = 100;
  e.resumeSession();
  assert.equal(e.ingestRealLocationSample(sample(100, 1000)).diagnostic.disposition, "awaitingFreshAnchor");
  close(e.currentSession!.distanceMeters, 4);
  const ended = e.endSession();
  assert.equal(ended.endedAt, 100);
  assert.equal(ended.movementState, "stopped");
  assert.equal(e.currentSession, null);
  assert.equal(e.lastDiagnostic!.disposition, "awaitingFreshAnchor");
});

test("simulation mirrors paused behavior, thresholds and session value semantics", () => {
  const e = new MovementEngine(() => 5, () => "demo");
  e.startSession("walk", "demo");
  e.simulate(10, 2);
  assert.equal(e.currentSession!.distanceMeters, 20);
  assert.equal(e.currentSession!.activeTime, 10);
  const external = e.currentSession!;
  external.routePoints[0]!.latitude = 0;
  external.distanceMeters = 0;
  assert.notEqual(e.currentSession!.routePoints[0]!.latitude, 0);
  assert.equal(e.currentSession!.distanceMeters, 20);
  e.simulate(2, 0.1);
  assert.equal(e.currentSession!.movementState, "paused");
  e.simulate(100, 2);
  assert.equal(e.currentSession!.elapsedTime, 12);
  e.resumeSession();
  e.simulate(NaN, Infinity);
  assert.equal(e.currentSession!.elapsedTime, 12);
  assert.equal(e.currentSession!.currentSpeedMetersPerSecond, 0);
});
