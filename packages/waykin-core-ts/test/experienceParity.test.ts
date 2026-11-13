import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { CompanionWalkExperience, makeExperienceContext, type ExperienceContext,
  type ExperienceSessionState, type ExperienceUpdate, type ExperienceResult } from "../src/experience.js";
import { CanonicalCompanionIdentity, type Companion } from "../src/companionIdentity.js";
import type { PursuitState } from "../src/companionRuntime.js";
import type { MovementSnapshot } from "../src/movementIntegrity.js";
import type { WorldEventKind } from "../src/worldState.js";
import { parseU64 } from "../src/uint64.js";
import { validateFamilySchema } from "./familySchema.js";

function readFamily(family: string, name: string): unknown {
  let repo = process.cwd();
  while (!existsSync(join(repo, "specs/001-spectacles-lira-walk/contracts"))) {
    const parent = dirname(repo);
    assert.notEqual(parent, repo, "repository contracts directory not found");
    repo = parent;
  }
  const directory = join(process.env.WAYKIN_VECTORS_DIR ?? join(repo, "Tests/Vectors"), family);
  assert.ok(existsSync(directory), `Missing Swift ${family} vectors: run make vectors; do not fabricate fixtures`);
  assert.deepEqual(readdirSync(directory).filter(file => file.endsWith(".json")).sort(), [`${name}.json`]);
  const raw = JSON.parse(readFileSync(join(directory, `${name}.json`), "utf8"));
  const schema = JSON.parse(readFileSync(join(repo, `specs/001-spectacles-lira-walk/contracts/${family}-vectors.schema.json`), "utf8"));
  validateFamilySchema(raw, schema);
  return raw;
}

test("Swift-generated pursuit family replays every walk update exactly", () => {
  const vector = readFamily("pursuit", "walk-experience") as { runs: {
    initialPursuit: PursuitState; context: Omit<ExperienceContext, "eventSeed"> & { eventSeed: string };
    initialState: ExperienceSessionState;
    steps: { index: number; movement: MovementSnapshot; expected: ExperienceUpdate }[];
  }[] };
  assert.deepEqual(vector.runs.map(run => run.initialPursuit), ["inactive", "noticed", "approaching", "close", "fading"]);
  for (const run of vector.runs) {
    const experience = new CompanionWalkExperience();
    const context = makeExperienceContext({ ...run.context, eventSeed: parseU64(run.context.eventSeed) });
    let state = experience.start(context);
    state.runtimeState!.value.pursuitState = run.initialPursuit;
    assert.deepEqual(state, run.initialState);
    for (const [index, step] of run.steps.entries()) {
      assert.equal(step.index, index);
      const before = JSON.stringify(state);
      const result = experience.update(state, step.movement, context);
      assert.equal(JSON.stringify(state), before, "update mutated previous state");
      assert.deepEqual(result, step.expected, `${run.initialPursuit} step ${index}`);
      state = result.state;
    }
  }
});

test("Swift-generated Bond/memory family matches finish thresholds and canonical identity", () => {
  const vector = readFamily("bond-memory", "finish-and-identity") as { defaultCompanion: Companion;
    cases: { eventKinds: WorldEventKind[]; progress: number; distanceMeters: number; expected: ExperienceResult }[] };
  assert.deepEqual(CanonicalCompanionIdentity.defaultCompanion(), vector.defaultCompanion);
  const experience = new CompanionWalkExperience();
  const context = makeExperienceContext({ timeOfDay: "day", activity: "walk" });
  assert.equal(new Set(vector.cases.map(row => JSON.stringify([row.eventKinds, row.progress]))).size, 42);
  for (const row of vector.cases) {
    const state = experience.start(context);
    const walk = state.runtimeState!.value;
    walk.accumulatedBondProgress = row.progress;
    walk.eventHistory = row.eventKinds.map(kind => ({ kind, intensity: 0.5, debugLabel: kind, occurredAt: 0 }));
    assert.deepEqual(experience.finish(state, { distanceMeters: row.distanceMeters }), row.expected);
  }
});
