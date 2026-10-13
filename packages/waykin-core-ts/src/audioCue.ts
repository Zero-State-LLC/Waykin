import { clamped01 } from "./worldState.js";

/** Semantic values only; no audio files or platform playback APIs. */
export type AudioCueKind = "companionNear" | "companionAhead" | "distantFootsteps"
  | "pursuitPressure" | "pursuitRelease" | "bondMotif" | "quietShift"
  | "appLaunchTheme" | "companionReveal" | "spawnTheme" | "bondMilestone";
export type AudioSpatialBias = "left" | "center" | "right" | "behind";
export interface AudioCue {
  readonly kind: AudioCueKind;
  readonly intensity: number;
  readonly spatialBias: AudioSpatialBias | null;
  readonly priority: number;
  readonly cooldownGroup: string;
  readonly shouldFade: boolean;
  readonly debugLabel: string;
}

export function makeAudioCue(input: Omit<AudioCue, "spatialBias"> & {
  spatialBias?: AudioSpatialBias | null;
}): AudioCue {
  return { ...input, intensity: clamped01(input.intensity),
    spatialBias: input.spatialBias ?? null, priority: Math.max(0, input.priority) };
}
