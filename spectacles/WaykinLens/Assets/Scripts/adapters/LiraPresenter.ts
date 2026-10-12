// Interface only. Implementation requires Lens Studio (TODO(editor)).
//
// TODO(editor): implement against the Lira scene object: a behavior state
//   machine (AnimationPlayer / blend or a pose driver) selected by
//   WorldEventKind, plus a relative-pose transform relative to the walker.
//   Do not invent a second vocabulary of behaviors here — the kinds come from
//   the core.
//
//   The implementation belongs in an editor-only sibling file (for example
//   LiraPresenter.lens.ts) that consumes this interface; this file must stay
//   free of Lens Studio imports. The import below is a type-only import of the
//   *generated* core copy, which is plain TypeScript and safe to reference.

import type { WorldEventKind } from '../core/worldState';

export interface LiraPresenter {
  /**
   * Select Lira's behavior for the current world event; `'idle'` when there is
   * none. intensity is clamped to [0, 1].
   */
  setBehavior(kind: WorldEventKind | 'idle', intensity: number): void;

  /** Pose relative to the walker (Spectacles), in metres. */
  setRelativePose(pose: { forwardMeters: number; rightMeters: number }): void;

  /** Remove Lira from the scene. show() must restore the last pose/behavior. */
  hide(): void;
  show(): void;
}
