/** Swift PathProgressEngine, PathAudioCoupling and WalkPathCopy port. */
import { clamped01, finiteOrZero } from "./worldState.js";
import type { PathRelation, PursuitState } from "./companionRuntime.js";
import { makeAudioCue, type AudioCue } from "./audioCue.js";

export interface PathProgressSnapshot {
  metersAlongPath: number;
  relation: PathRelation;
  integrityPressure: number;
  acceptedSampleCount: number;
  rejectedStreak: number;
  isDemo: boolean;
}

export function makePathProgressSnapshot(input: Partial<PathProgressSnapshot> = {}): PathProgressSnapshot {
  return {
    metersAlongPath: Math.max(0, finiteOrZero(input.metersAlongPath ?? 0)),
    relation: input.relation ?? "establishing",
    integrityPressure: clamped01(input.integrityPressure ?? 0),
    acceptedSampleCount: Math.max(0, input.acceptedSampleCount ?? 0),
    rejectedStreak: Math.max(0, input.rejectedStreak ?? 0),
    isDemo: input.isDemo ?? false,
  };
}

export class PathProgressEngine {
  private current = makePathProgressSnapshot();
  private consecutiveMovingAccepts = 0;
  private consecutiveStationaryAccepts = 0;

  // Swift returns a value-type snapshot. Callers cannot mutate engine state.
  get snapshot(): PathProgressSnapshot { return { ...this.current }; }

  reset(isDemo: boolean): void {
    this.current = makePathProgressSnapshot({ isDemo });
    this.consecutiveMovingAccepts = 0;
    this.consecutiveStationaryAccepts = 0;
  }

  recordAccepted(movement: { isMoving: boolean; distanceDelta: number }): void {
    const next = this.snapshot;
    next.acceptedSampleCount += 1;
    next.rejectedStreak = 0;
    if (movement.isMoving) {
      next.metersAlongPath += Math.max(0, finiteOrZero(movement.distanceDelta));
      this.consecutiveMovingAccepts += 1;
      this.consecutiveStationaryAccepts = 0;
    } else {
      this.consecutiveStationaryAccepts += 1;
      this.consecutiveMovingAccepts = 0;
    }
    next.relation = PathProgressEngine.relationAfterAccept(next.relation,
      movement.isMoving, this.consecutiveMovingAccepts,
      this.consecutiveStationaryAccepts, next.acceptedSampleCount);
    next.integrityPressure = PathProgressEngine.pressure(next.relation, 0,
      this.consecutiveStationaryAccepts);
    this.current = next;
  }

  recordRejected(): void {
    const next = this.snapshot;
    next.rejectedStreak += 1;
    this.consecutiveMovingAccepts = 0;
    next.relation = PathProgressEngine.relationAfterReject(next.relation, next.rejectedStreak);
    next.integrityPressure = PathProgressEngine.pressure(next.relation,
      next.rejectedStreak, this.consecutiveStationaryAccepts);
    this.current = next;
  }

  static relationAfterAccept(previous: PathRelation, isMoving: boolean,
    consecutiveMoving: number, consecutiveStationary: number, acceptedCount: number): PathRelation {
    if (acceptedCount <= 1) return "establishing";
    switch (previous) {
      case "establishing": return isMoving ? "onPath" : "establishing";
      case "offPath":
      case "recovered":
        if (isMoving && consecutiveMoving >= 2) return "onPath";
        return isMoving ? "recovered" : previous;
      case "strained": return isMoving && consecutiveMoving >= 1 ? "onPath" : "strained";
      case "onPath": return !isMoving && consecutiveStationary >= 5 ? "strained" : "onPath";
    }
  }

  static relationAfterReject(previous: PathRelation, rejectedStreak: number): PathRelation {
    if (rejectedStreak >= 8) return "offPath";
    if (rejectedStreak >= 3) return previous === "offPath" ? "offPath" : "strained";
    return previous;
  }

  static pressure(relation: PathRelation, rejectedStreak: number, consecutiveStationary: number): number {
    const base = { establishing: 0.05, onPath: 0, recovered: 0.15, strained: 0.45, offPath: 0.75 }[relation];
    const rejectBoost = Math.min(0.25, rejectedStreak * 0.03);
    const stallBoost = Math.min(0.15, Math.max(0, consecutiveStationary - 3) * 0.03);
    return Math.min(1, base + rejectBoost + stallBoost);
  }
}

export class PathAudioCoupling {
  static readonly cooldownSeconds = 14;

  static cue(previous: PathRelation, next: PathRelation, pursuitState: PursuitState,
    sessionElapsed = 0, lastPathAudioElapsed: number | null = null): AudioCue | null {
    if (previous === next) return null;
    if (pursuitState !== "inactive" && pursuitState !== "fading") return null;
    if (lastPathAudioElapsed !== null && sessionElapsed - lastPathAudioElapsed < this.cooldownSeconds) return null;
    switch (next) {
      case "strained": return makeAudioCue({ kind: "quietShift", intensity: 0.35,
        spatialBias: "center", priority: 1, cooldownGroup: "path", shouldFade: true, debugLabel: "path:strained" });
      case "offPath": return makeAudioCue({ kind: "quietShift", intensity: 0.5,
        spatialBias: "behind", priority: 1, cooldownGroup: "path", shouldFade: true, debugLabel: "path:offPath" });
      case "recovered": return makeAudioCue({ kind: "pursuitRelease", intensity: 0.4,
        spatialBias: "center", priority: 2, cooldownGroup: "path", shouldFade: true, debugLabel: "path:recovered" });
      case "establishing":
      case "onPath": return null;
    }
  }
}

export type StepCadenceBand = "unknown" | "low" | "moderate" | "high";

export class WalkPathCopy {
  static pathLine(relation: PathRelation, metersAlongPath: number): string {
    const finite = finiteOrZero(metersAlongPath);
    // Swift's Double -> Int conversion traps outside the signed 64-bit range.
    if (finite >= 2 ** 63 || finite < -(2 ** 63)) throw new RangeError("pathLine: meters outside Swift Int range");
    const meters = Math.max(0, Math.trunc(finite));
    const meterText = `${meters.toFixed(0)} m along the path`;
    switch (relation) {
      case "establishing": return meters === 0 ? "Path establishing" : `Path establishing · ${meterText}`;
      case "onPath": return `Path held steady · ${meterText}`;
      case "strained": return `Path felt strained · ${meterText}`;
      case "offPath": return `Path slipped · ${meterText}`;
      case "recovered": return `Path found again · ${meterText}`;
    }
  }

  static cadenceLine(band: StepCadenceBand): string | null {
    return { unknown: null, low: "Steps felt light", moderate: "Steps felt steady", high: "Steps felt strong" }[band];
  }

  static memorySuffix(relation: PathRelation): string | null {
    return { establishing: null, onPath: "the path held steady", strained: "the path felt strained",
      offPath: "the path slipped for a while", recovered: "the path found you again" }[relation];
  }

  static appendingMemorySuffix(memory: string, relation: PathRelation): string {
    const suffix = this.memorySuffix(relation);
    if (suffix === null) return memory;
    // Foundation .whitespacesAndNewlines includes U+0085/U+200B, not U+FEFF.
    const trimmed = memory.replace(/^[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200b\u2028-\u2029\u202f\u205f\u3000]+|[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200b\u2028-\u2029\u202f\u205f\u3000]+$/g, "");
    if (trimmed.length === 0) return `Lira stayed close; ${suffix}.`;
    return `${trimmed.endsWith(".") ? trimmed.slice(0, -1) : trimmed}; ${suffix}.`;
  }
}
