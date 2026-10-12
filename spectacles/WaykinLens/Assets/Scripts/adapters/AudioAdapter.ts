// Interface only. Implementation requires Lens Studio (TODO(editor)).
//
// TODO(editor): implement with a pool of AudioComponents (one per cue kind),
//   driven by the lens's audio module. intensity01 maps to gain, and where the
//   asset supports it to a pitch / filter offset. Overlapping playback of the
//   same cue must not restart the clip.
//
//   The implementation belongs in an editor-only sibling file (for example
//   AudioAdapter.lens.ts) that consumes this interface; this file must stay
//   free of Lens Studio imports.

/**
 * Semantic cue kinds.
 *
 * PROVISIONAL NAMES: this vocabulary is a placeholder until the audioSemantics
 * port lands (task T014) in packages/waykin-core-ts/src/audioSemantics.ts.
 * When it does, this union must be replaced by / aligned with the ported cue
 * kind and this file must not keep a second, divergent copy of the vocabulary.
 * There are exactly seven kinds, matching the plan's cue set.
 */
export type AudioCueKind =
  | 'companionNear'
  | 'companionAhead'
  | 'companionObserves'
  | 'distantPresence'
  | 'pursuitRising'
  | 'pursuitRelease'
  | 'bondChime';

export interface AudioAdapter {
  /** intensity01 is clamped to [0, 1]. */
  play(kind: AudioCueKind, intensity01: number): void;

  /** Stop every currently playing cue. Must be safe to call at any time. */
  stopAll(): void;
}
