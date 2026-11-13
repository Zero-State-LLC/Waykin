import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { CompanionRuntime, CompanionPresentationMatrix, type CompanionCommand, type ARBehaviorInput } from "../src/companionRuntime.js";
import { WORLD_EVENT_KINDS, type WorldEventKind } from "../src/worldState.js";
import { validateFamilySchema } from "./familySchema.js";

function root(): string {
  let path = process.cwd();
  while (!existsSync(join(path, "specs/001-spectacles-lira-walk/contracts"))) {
    const parent = dirname(path);
    assert.notEqual(parent, path, "repository contracts directory not found");
    path = parent;
  }
  return path;
}
function double(value: number | string): number {
  if (typeof value === "number") return value;
  if (value === "NaN") return NaN;
  if (value === "Infinity") return Infinity;
  if (value === "-Infinity") return -Infinity;
  throw new Error("Invalid encoded double");
}
interface Vector {
  presentations: { eventKind: WorldEventKind | null; moving: boolean;
    expected: { behavior: string; relativeDistance: number; runtimeBehavior: string; runtimeDistance: number } }[];
  overlays: (Omit<ARBehaviorInput, "event" | "pathIntegrityPressure"> & {
    eventKind: WorldEventKind | null; pathIntegrityPressure: number | string; expected: string })[];
  commandSteps: { command: { kind: CompanionCommand["kind"]; value: string | number };
    expected: { state: string; relativeDistance: number } }[];
}

test("Swift-generated companion family is present, schema-valid and replays exactly", () => {
  const repo = root();
  const directory = join(process.env.WAYKIN_VECTORS_DIR ?? join(repo, "Tests/Vectors"), "companion");
  assert.ok(existsSync(directory), "Missing Swift companion vectors: run make vectors on macOS; do not fabricate fixtures");
  const files = readdirSync(directory).filter(file => file.endsWith(".json")).sort();
  assert.deepEqual(files, ["runtime-and-presentation.json"]);
  const schema = JSON.parse(readFileSync(join(repo, "specs/001-spectacles-lira-walk/contracts/companion-vectors.schema.json"), "utf8"));
  for (const file of files) {
    const raw = JSON.parse(readFileSync(join(directory, file), "utf8"));
    validateFamilySchema(raw, schema);
    const vector = raw as Vector;
    assert.equal(new Set(vector.presentations.map(row => `${row.eventKind}/${row.moving}`)).size, 22);
    for (const kind of [...WORLD_EVENT_KINDS, null]) for (const moving of [false, true])
      assert.ok(vector.presentations.some(row => row.eventKind === kind && row.moving === moving));
    assert.equal(new Set(vector.overlays.map(row => JSON.stringify([row.state, row.eventKind, row.pursuitState,
      row.pathRelation, row.pathIntegrityPressure]))).size, 1295);
    for (const row of vector.presentations) {
      const event = row.eventKind ? { kind: row.eventKind, intensity: 0.5, debugLabel: row.eventKind } : null;
      const resolved = CompanionPresentationMatrix.resolve(event, row.moving);
      const runtime = new CompanionRuntime(); runtime.applyEvent(event);
      assert.deepEqual({ ...resolved, runtimeBehavior: runtime.state, runtimeDistance: runtime.relativeDistance }, row.expected);
    }
    for (const row of vector.overlays) assert.equal(CompanionPresentationMatrix.arBehaviorString({ ...row,
      event: row.eventKind, pathIntegrityPressure: double(row.pathIntegrityPressure) }), row.expected);
    const runtime = new CompanionRuntime();
    for (const row of vector.commandSteps) {
      const command = row.command;
      runtime.applyCommand((command.kind === "setRelativeDistance" || command.kind === "setThreatLevel"
        ? { ...command, value: double(command.value) } : command) as CompanionCommand);
      assert.deepEqual({ state: runtime.state, relativeDistance: runtime.relativeDistance }, row.expected);
    }
  }
});
