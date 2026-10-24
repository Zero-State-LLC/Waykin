import { makeAudioCue, type AudioCue, type AudioCueKind, type AudioSpatialBias } from "./audioCue.js";
import { COMPANION_BEHAVIOR_STATES, type CompanionBehaviorState } from "./companionRuntime.js";
import type { WorldEvent } from "./worldEventGenerator.js";

type CueMapping = readonly [AudioCueKind, AudioSpatialBias, number, string, boolean];
function mapped(mapping: CueMapping, intensity: number, debugLabel: string): AudioCue {
  const [kind, spatialBias, priority, cooldownGroup, shouldFade] = mapping;
  return makeAudioCue({ kind, spatialBias, priority, cooldownGroup, shouldFade, intensity, debugLabel });
}
const NEAR: CueMapping = ["companionNear", "left", 2, "companion", true];
const AHEAD: CueMapping = ["companionAhead", "center", 2, "companion", true];
const DISTANT: CueMapping = ["distantFootsteps", "behind", 3, "pursuit", false];
const PRESSURE: CueMapping = ["pursuitPressure", "behind", 4, "pursuit", false];
const RELEASE: CueMapping = ["pursuitRelease", "behind", 3, "pursuit", true];
const BOND: CueMapping = ["bondMotif", "center", 5, "bond", true];
const QUIET: CueMapping = ["quietShift", "center", 1, "ambient", true];
export type AudioMoment = "appLaunch" | "companionReveal" | "spawn" | "bondMilestone";

function normalized(raw: string): string {
  return raw.replace(/^[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200b\u2028-\u2029\u202f\u205f\u3000]+|[\u0009-\u000d\u0020\u0085\u00a0\u1680\u2000-\u200b\u2028-\u2029\u202f\u205f\u3000]+$/g, "").toLowerCase();
}

export class AudioExperienceLayer {
  static readonly behaviorTransitionCooldown = 12;
  static readonly arPresentationTransitionCooldown = 12;
  static readonly arPresentationVocabulary = new Set(["idle", "follow", "investigate", "alert", "celebrate"]);
  private active = new Map<string, AudioCue>();
  private lastPlayed = new Map<string, number>();
  private readonly cooldown: number;

  /** Resolver observes cue availability; absence never changes semantic selection. */
  constructor(private readonly resolveAsset: (cue: AudioCue) => unknown = () => undefined, cooldown = 18) {
    this.cooldown = 0 < cooldown ? cooldown : 0;
  }

  cue(event: WorldEvent | null, now: number): AudioCue | null {
    if (event === null) return null;
    const cue = AudioExperienceLayer.map(event);
    const last = this.lastPlayed.get(cue.cooldownGroup);
    if (last !== undefined && now - last < this.cooldown) return null;
    const existing = this.active.get(cue.cooldownGroup);
    if (existing !== undefined && existing.priority > cue.priority) return null;
    this.lastPlayed.set(cue.cooldownGroup, now);
    this.active.set(cue.cooldownGroup, { ...cue });
    this.resolveAsset({ ...cue });
    return cue;
  }

  endSession(): void { this.active.clear(); this.lastPlayed.clear(); }
  get activeCueCount(): number { return this.active.size; }

  static map(event: WorldEvent): AudioCue {
    const mappings: Record<WorldEvent["kind"], CueMapping> = {
      companionDrawsNear: NEAR, companionMovesAhead: AHEAD, distantPresence: DISTANT,
      pursuitBegins: DISTANT, pursuitIntensifies: PRESSURE, pursuitFades: RELEASE,
      bondMoment: BOND, companionObserves: QUIET, familiarPlaceStirs: QUIET, quietInterval: QUIET,
    };
    return mapped(mappings[event.kind], event.intensity, event.debugLabel);
  }

  static mapBehavior(behavior: CompanionBehaviorState, intensity = 0.45): AudioCue | null {
    const label = `behavior:${behavior}`;
    switch (behavior) {
      case "drawNear": return mapped(NEAR, intensity, label);
      case "lead": return mapped(AHEAD, intensity, label);
      case "rest":
      case "observe": return mapped(QUIET, Math.min(intensity, 0.4), label);
      case "celebrate": return mapped(BOND, intensity, label);
      case "follow":
      case "idle": return null;
    }
  }

  static cueForBehaviorTransition(previousRaw: string | null, next: CompanionBehaviorState,
    sessionElapsed: number, lastBehaviorAudioElapsed: number | null, intensity = 0.45): AudioCue | null {
    const previous = COMPANION_BEHAVIOR_STATES.find(state => state === previousRaw);
    if (previous === undefined || previous === next) return null;
    if (lastBehaviorAudioElapsed !== null && sessionElapsed - lastBehaviorAudioElapsed < this.behaviorTransitionCooldown) return null;
    return this.mapBehavior(next, intensity);
  }

  static cueForARPresentationTransition(previousRaw: string | null, nextRaw: string,
    sessionElapsed: number, lastAudioElapsed: number | null, intensity = 0.45): AudioCue | null {
    if (previousRaw === null) return null;
    const previous = normalized(previousRaw);
    const next = normalized(nextRaw);
    if (previous === next) return null;
    if (lastAudioElapsed !== null && sessionElapsed - lastAudioElapsed < this.arPresentationTransitionCooldown) return null;
    return this.mapARPresentation(next, intensity);
  }

  static mapARPresentation(raw: string, intensity = 0.45): AudioCue | null {
    const key = normalized(raw);
    const label = `arPresentation:${key}`;
    switch (key) {
      case "celebrate": return mapped(BOND, intensity, label);
      case "alert": return mapped(PRESSURE, Math.min(intensity, 0.7), label);
      case "investigate": return mapped(QUIET, Math.min(intensity, 0.4), label);
      default: return null;
    }
  }

  static momentCue(moment: AudioMoment, intensity = 0.9): AudioCue {
    const kinds = { appLaunch: "appLaunchTheme", companionReveal: "companionReveal",
      spawn: "spawnTheme", bondMilestone: "bondMilestone" } as const;
    return mapped([kinds[moment], "center", 6, "moment", true], intensity, `moment:${moment}`);
  }
}
