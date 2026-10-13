import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { MovementIntegrityProcessor, type LocationSample, type StabilizedMovementSample } from "../src/movementIntegrity.js";
import { validateFamilySchema } from "./familySchema.js";

type EncodedSample = { [K in keyof LocationSample]: LocationSample[K] | string };
interface Vector {
  distanceToleranceMeters: number;
  steps: { index: number; resetBefore: boolean; receivedAt: number; sample: EncodedSample; expected: StabilizedMovementSample }[];
}
function decode(value: number | string | null | undefined): number | null | undefined {
  if (typeof value !== "string") return value;
  if (value === "NaN") return NaN;
  if (value === "Infinity") return Infinity;
  if (value === "-Infinity") return -Infinity;
  throw new Error(`Invalid encoded double ${value}`);
}

test("Swift-generated movement family is present, schema-valid and within D-100 distance bound", () => {
  let repo = process.cwd();
  while (!existsSync(join(repo, "specs/001-spectacles-lira-walk/contracts"))) {
    const parent = dirname(repo);
    assert.notEqual(parent, repo, "repository contracts directory not found");
    repo = parent;
  }
  const directory = join(process.env.WAYKIN_VECTORS_DIR ?? join(repo, "Tests/Vectors"), "movement");
  assert.ok(existsSync(directory), "Missing Swift movement vectors: run make vectors; do not fabricate fixtures");
  assert.deepEqual(readdirSync(directory).filter(file => file.endsWith(".json")).sort(), ["integrity-sequence.json"]);
  const raw = JSON.parse(readFileSync(join(directory, "integrity-sequence.json"), "utf8"));
  const schema = JSON.parse(readFileSync(join(repo, "specs/001-spectacles-lira-walk/contracts/movement-vectors.schema.json"), "utf8"));
  validateFamilySchema(raw, schema);
  const vector = raw as Vector;
  const processor = new MovementIntegrityProcessor();
  for (const [index, step] of vector.steps.entries()) {
    assert.equal(step.index, index);
    if (step.resetBefore) processor.resetAnchor();
    const sample = Object.fromEntries(Object.entries(step.sample).map(([key, value]) => [key, decode(value)])) as unknown as LocationSample;
    const actual = processor.process(sample, step.receivedAt);
    const expected = step.expected;
    assert.ok(Math.abs(actual.distanceDelta - expected.distanceDelta) <= vector.distanceToleranceMeters,
      `step ${index}: distance ${actual.distanceDelta} differs from Swift ${expected.distanceDelta}`);
    // D-100 currently authorizes distance only. Speed and decisions stay exact.
    assert.deepEqual({ ...actual, distanceDelta: expected.distanceDelta }, expected, `step ${index}`);
  }
});
