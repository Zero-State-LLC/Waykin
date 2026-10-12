// Interface only. Implementation requires Lens Studio (TODO(editor)).
//
// TODO(editor): implement this against Lens Studio's location module on
//   Spectacles: request the RawLocation permission first, then subscribe to
//   position updates with GeoLocationAccuracy.Navigation, which polls at
//   roughly 1 Hz. Do not use a coarser accuracy class — the walk's movement
//   engine needs ~1 s cadence and the per-sample accuracy estimate.
//
//   The implementation belongs in an editor-only sibling file (for example
//   LocationAdapter.lens.ts) that consumes this interface; this file must stay
//   free of Lens Studio imports so it can be reviewed and diffed outside the
//   editor.
//
// TODO(editor): decide and document the mapping from the platform's accuracy
//   value to horizontalAccuracyMeters, and drop samples that are too coarse.

export interface LocationSample {
  /** Monotonic seconds since session start (not a wall-clock epoch). */
  timestampSeconds: number;
  latitude: number;
  longitude: number;
  /** 68% confidence radius, in metres. */
  horizontalAccuracyMeters: number;
  /** Metres per second, when the platform reports it. */
  speedMetersPerSecond?: number;
}

export type LocationStatus = 'unknown' | 'denied' | 'unavailable' | 'ok';

export interface LocationAdapter {
  /**
   * Begin delivering samples. Safe to call after stop(); a second start()
   * without an intervening stop() must be a no-op.
   */
  start(onSample: (sample: LocationSample) => void): void;

  /** Stop delivering samples and release the platform subscription. */
  stop(): void;

  /** Current permission / availability state. Must not throw. */
  status(): LocationStatus;
}
