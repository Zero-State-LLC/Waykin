// Interface only. Implementation requires Lens Studio (TODO(editor)).
//
// TODO(editor): implement with Lens Studio's persistent store on Spectacles
//   (a device-local key/value store). Writes must be idempotent and survive
//   an app restart; corrupt or missing records must degrade to defaults rather
//   than throw.
//
//   The implementation belongs in an editor-only sibling file (for example
//   StorageAdapter.lens.ts) that consumes this interface; this file must stay
//   free of Lens Studio imports.
//
// PRIVACY: MemoryRecord carries NO coordinates and no raw location history —
// only a monotonic end time, the world-event kinds that occurred, and the bond
// delta. Keep it that way; a memory is a feeling, not a breadcrumb trail.
//
// The 5-record cap is a product rule. Enforce it with the core's memory helpers
// (packages/waykin-core-ts/src/memory.ts), not ad hoc inside the adapter.

import type { WorldEventKind } from '../core/worldState';

export interface MemoryRecord {
  id: string;
  /** Monotonic seconds since session start, when the memory ended. */
  endedAtSeconds: number;
  kinds: WorldEventKind[];
  bondDelta: number;
}

export interface StorageAdapter {
  /** Bond value, 0..1 as defined by the core bond model. */
  loadBond(): number;
  saveBond(n: number): void;

  /** At most 5 records; order defined by the core's memory model. */
  loadMemories(): MemoryRecord[];
  saveMemories(list: MemoryRecord[]): void;
}
