/** Swift MovementIntegrity port; distance approximation is approved by D-100. */
export interface LocationSample {
  /** Seconds in the same time domain as receivedAt. */
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude?: number | null;
  horizontalAccuracy: number;
  reportedSpeedMetersPerSecond: number;
}
export interface RoutePoint {
  timestamp: number;
  latitude: number;
  longitude: number;
  altitude: number | null;
  speed: number;
}
export interface MovementSnapshot {
  timestamp: number;
  speed: number;
  distanceDelta: number;
  isMoving: boolean;
}
export type MovementAccuracyBucket = "invalid" | "precise" | "usable" | "poor";
export type MovementSampleDisposition = "accepted" | "awaitingFreshAnchor" | "rejectedInvalid"
  | "rejectedNegativeAccuracy" | "rejectedAccuracy" | "rejectedStale" | "rejectedOutOfOrder"
  | "rejectedDuplicate" | "rejectedPaused" | "rejectedStopped" | "rejectedImplausibleDisplacement";
export interface MovementSampleDiagnostic {
  timestamp: number;
  disposition: MovementSampleDisposition;
  accuracyBucket: MovementAccuracyBucket;
  derivedSpeedMetersPerSecond: number;
  accumulatedDistance: boolean;
}
export interface StabilizedMovementSample {
  point: RoutePoint | null;
  sampleInterval: number;
  distanceDelta: number;
  isMoving: boolean;
  diagnostic: MovementSampleDiagnostic;
}
export interface MovementIntegrityConfiguration {
  maximumHorizontalAccuracyMeters: number;
  maximumSampleAge: number;
  maximumFutureSkew: number;
  minimumDisplacementMeters: number;
  maximumWalkingSpeedMetersPerSecond: number;
  maximumSingleDisplacementMeters: number;
  stationarySpeedThreshold: number;
  movingSpeedThreshold: number;
  anchorResetInterval: number;
  speedWindowSize: number;
}

// Swift max(a, NaN) retains a. Math.max would propagate NaN instead.
function swiftMax(a: number, b: number): number { return a < b ? b : a; }

export function makeMovementIntegrityConfiguration(input: Partial<MovementIntegrityConfiguration> = {}): MovementIntegrityConfiguration {
  const stationary = swiftMax(0, input.stationarySpeedThreshold ?? 0.25);
  const window = input.speedWindowSize ?? 3;
  if (!Number.isSafeInteger(window)) throw new RangeError("speedWindowSize must be an integer");
  return {
    maximumHorizontalAccuracyMeters: swiftMax(1, input.maximumHorizontalAccuracyMeters ?? 30),
    maximumSampleAge: swiftMax(1, input.maximumSampleAge ?? 15),
    maximumFutureSkew: swiftMax(0, input.maximumFutureSkew ?? 2),
    minimumDisplacementMeters: swiftMax(0, input.minimumDisplacementMeters ?? 1.5),
    maximumWalkingSpeedMetersPerSecond: swiftMax(0.5, input.maximumWalkingSpeedMetersPerSecond ?? 4.5),
    maximumSingleDisplacementMeters: swiftMax(1, input.maximumSingleDisplacementMeters ?? 60),
    stationarySpeedThreshold: stationary,
    movingSpeedThreshold: swiftMax(stationary, input.movingSpeedThreshold ?? 0.55),
    anchorResetInterval: swiftMax(1, input.anchorResetInterval ?? 15),
    speedWindowSize: Math.max(1, window),
  };
}

export function makeMovementDiagnostic(timestamp: number, disposition: MovementSampleDisposition,
  accuracyBucket: MovementAccuracyBucket, derivedSpeed = 0, accumulatedDistance = false): MovementSampleDiagnostic {
  return { timestamp, disposition, accuracyBucket, accumulatedDistance,
    derivedSpeedMetersPerSecond: Math.max(0, Number.isFinite(derivedSpeed) ? derivedSpeed : 0) };
}

/** D-100: Haversine with mean Earth radius 6,371,008.8 m; parity tolerance 0.05 m. */
export function movementDistanceMeters(lhs: Pick<LocationSample, "latitude" | "longitude">,
  rhs: Pick<LocationSample, "latitude" | "longitude">): number {
  const radians = Math.PI / 180;
  const dLat = (rhs.latitude - lhs.latitude) * radians;
  const dLon = (rhs.longitude - lhs.longitude) * radians;
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lhs.latitude * radians)
    * Math.cos(rhs.latitude * radians) * Math.sin(dLon / 2) ** 2;
  return 6371008.8 * 2 * Math.asin(Math.sqrt(Math.min(1, Math.max(0, a))));
}

export class MovementIntegrityProcessor {
  readonly configuration: Readonly<MovementIntegrityConfiguration>;
  private anchor: LocationSample | null = null;
  private recentSpeeds: number[] = [];
  private moving = false;

  constructor(configuration: Partial<MovementIntegrityConfiguration> = {}) {
    this.configuration = Object.freeze(makeMovementIntegrityConfiguration(configuration));
  }

  resetAnchor(): void {
    this.anchor = null;
    this.recentSpeeds = [];
    this.moving = false;
  }

  process(sample: LocationSample, receivedAt: number): StabilizedMovementSample {
    const c = this.configuration;
    const accuracy = sample.horizontalAccuracy;
    const bucket: MovementAccuracyBucket = !Number.isFinite(accuracy) || accuracy < 0 ? "invalid"
      : accuracy <= 10 ? "precise" : accuracy <= c.maximumHorizontalAccuracyMeters ? "usable" : "poor";
    const reject = (disposition: MovementSampleDisposition, speed = 0): StabilizedMovementSample => ({
      point: null, sampleInterval: 0, distanceDelta: 0, isMoving: false,
      diagnostic: makeMovementDiagnostic(sample.timestamp, disposition, bucket, speed),
    });
    if (!Number.isFinite(sample.latitude) || !Number.isFinite(sample.longitude)
      || sample.latitude < -90 || sample.latitude > 90 || sample.longitude < -180
      || sample.longitude > 180 || !Number.isFinite(accuracy)) return reject("rejectedInvalid");
    if (accuracy < 0) return reject("rejectedNegativeAccuracy");
    if (accuracy > c.maximumHorizontalAccuracyMeters) return reject("rejectedAccuracy");
    const age = receivedAt - sample.timestamp;
    if (!(age <= c.maximumSampleAge)) return reject("rejectedStale");
    if (!(age >= -c.maximumFutureSkew)) return reject("rejectedInvalid");
    if (this.anchor === null) return this.establishAnchor(sample, bucket);
    const interval = sample.timestamp - this.anchor.timestamp;
    if (!(interval > 0)) return reject(interval === 0 ? "rejectedDuplicate" : "rejectedOutOfOrder");
    if (interval > c.anchorResetInterval) return this.establishAnchor(sample, bucket);
    const distance = movementDistanceMeters(this.anchor, sample);
    const distanceSpeed = distance / interval;
    if (!Number.isFinite(distance) || distance > c.maximumSingleDisplacementMeters
      || distanceSpeed > c.maximumWalkingSpeedMetersPerSecond) return reject("rejectedImplausibleDisplacement", distanceSpeed);
    const reported = sample.reportedSpeedMetersPerSecond;
    const candidate = Number.isFinite(reported) && reported >= 0
      && reported <= c.maximumWalkingSpeedMetersPerSecond ? reported : distanceSpeed;
    this.recentSpeeds.push(Math.min(c.maximumWalkingSpeedMetersPerSecond, Math.max(0, candidate)));
    if (this.recentSpeeds.length > c.speedWindowSize) this.recentSpeeds.splice(0, this.recentSpeeds.length - c.speedWindowSize);
    const speed = this.recentSpeeds.reduce((sum, item) => sum + item, 0) / this.recentSpeeds.length;
    if (this.moving) {
      if (speed <= c.stationarySpeedThreshold) this.moving = false;
    } else if (speed >= c.movingSpeedThreshold) this.moving = true;
    const accumulated = this.moving && distance >= c.minimumDisplacementMeters;
    this.anchor = { ...sample };
    return { point: this.point(sample, speed), sampleInterval: interval,
      distanceDelta: accumulated ? distance : 0, isMoving: this.moving,
      diagnostic: makeMovementDiagnostic(sample.timestamp, "accepted", bucket, speed, accumulated) };
  }

  private point(sample: LocationSample, speed: number): RoutePoint {
    return { timestamp: sample.timestamp, latitude: sample.latitude, longitude: sample.longitude,
      altitude: sample.altitude ?? null, speed };
  }

  private establishAnchor(sample: LocationSample, bucket: MovementAccuracyBucket): StabilizedMovementSample {
    this.anchor = { ...sample };
    this.recentSpeeds = [];
    this.moving = false;
    return { point: this.point(sample, 0), sampleInterval: 0, distanceDelta: 0, isMoving: false,
      diagnostic: makeMovementDiagnostic(sample.timestamp, "awaitingFreshAnchor", bucket) };
  }
}
