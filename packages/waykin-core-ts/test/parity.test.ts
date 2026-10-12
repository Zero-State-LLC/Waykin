/**
 * Parity test: replay Swift-produced seed->event vectors through the
 * TypeScript port and assert every intermediate value matches exactly.
 *
 * Reads read-only from Tests/Vectors/seed-event/**. Locate that directory by
 * walking up from process.cwd() until a Tests/Vectors folder is found, or via
 * WAYKIN_VECTORS_DIR. If no vectors are present, the whole suite skips unless
 * WAYKIN_REQUIRE_VECTORS=1, in which case it fails.
 */

import assert from "node:assert/strict";
import { readdirSync, readFileSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import test from "node:test";

import {
  SeededRandomNumberGenerator,
  WorldEventGenerator,
  makeConfiguration,
  makeRule,
  makeWorldState,
  parseU64,
  toDecimal,
  type GeneratorConfiguration,
  type MovementState,
  type WorldEventKind,
} from "../src/index.js";
import { validateVectorFile } from "./schema.js";

interface RawRule {
  kind: WorldEventKind;
  minimumEnergy: number;
  minimumPressure: number;
  maximumPressure: number;
  minimumFamiliarity: number;
  minimumBondLevel: number;
  weight: string;
  cooldown: number;
}

interface RawConfig {
  minimumTickSpacing: number;
  rules: RawRule[];
}

interface RawState {
  energy: number | string;
  pressure: number | string;
  familiarity: number | string;
  bondLevel: number;
  movementState: string;
  activeTime: number | string;
  lastEventAtSeconds?: number | null;
}

interface RawEvent {
  kind: WorldEventKind;
  intensity: number;
  debugLabel: string;
}

interface RawExpected {
  eligibleKinds: WorldEventKind[];
  rngDraws: string[];
  totalWeight: string | null;
  pick: string | null;
  event: RawEvent | null;
}

interface RawStep {
  index: number;
  nowSeconds: number;
  elapsed?: number | string | null;
  state: RawState;
  allowedKinds?: WorldEventKind[] | null;
  externalLastGeneratedAtElapsed?: number | null;
  externalLastFiredAtElapsedByKind?: Partial<Record<WorldEventKind, number>>;
  expected: RawExpected;
}

interface RawVector {
  schemaVersion: 1;
  vectorId: string;
  description?: string;
  source: { generatedBy: "WaykinVectorExport"; swiftTree: string };
  seed: string;
  config: RawConfig;
  rngStream: string[];
  steps: RawStep[];
}

function findVectorsRoot(): string | null {
  const envDir = process.env.WAYKIN_VECTORS_DIR;
  if (envDir && envDir.length > 0) return envDir;

  let current = process.cwd();
  while (true) {
    const candidate = join(current, "Tests", "Vectors");
    try {
      if (statSync(candidate).isDirectory()) return candidate;
    } catch {
      // not here; keep walking up
    }
    const parent = dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

function collectJsonFiles(root: string): string[] {
  const results: string[] = [];
  const walk = (dir: string): void => {
    let entries;
    try {
      entries = readdirSync(dir, { withFileTypes: true });
    } catch {
      return;
    }
    for (const entry of entries) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.isFile() && entry.name.endsWith(".json")) results.push(full);
    }
  };
  walk(root);
  results.sort();
  return results;
}

function decodeDouble(value: number | string): number {
  if (typeof value === "number") return value;
  if (value === "NaN") return Number.NaN;
  if (value === "Infinity") return Number.POSITIVE_INFINITY;
  if (value === "-Infinity") return Number.NEGATIVE_INFINITY;
  throw new Error(`decodeDouble: unexpected value ${JSON.stringify(value)}`);
}

function buildConfiguration(raw: RawConfig): GeneratorConfiguration {
  return makeConfiguration({
    minimumTickSpacing: raw.minimumTickSpacing,
    rules: raw.rules.map((rule) =>
      makeRule({
        kind: rule.kind,
        minimumEnergy: rule.minimumEnergy,
        minimumPressure: rule.minimumPressure,
        maximumPressure: rule.maximumPressure,
        minimumFamiliarity: rule.minimumFamiliarity,
        minimumBondLevel: rule.minimumBondLevel,
        weight: parseU64(rule.weight),
        cooldown: rule.cooldown,
      }),
    ),
  });
}

const vectorsRoot = findVectorsRoot();
const vectorFiles = vectorsRoot
  ? collectJsonFiles(join(vectorsRoot, "seed-event"))
  : [];

if (vectorFiles.length === 0) {
  if (process.env.WAYKIN_REQUIRE_VECTORS === "1") {
    test("seed-event vectors are required", () => {
      assert.fail(
        "WAYKIN_REQUIRE_VECTORS=1 but no Tests/Vectors/seed-event/*.json files were found",
      );
    });
  } else {
    test("seed-event parity vectors", (t) => {
      t.skip("vectors pending: run make vectors on macOS");
    });
  }
} else {
  for (const file of vectorFiles) {
    const label = vectorsRoot ? relative(vectorsRoot, file) : file;

    test(`parity: ${label}`, () => {
      const raw = JSON.parse(readFileSync(file, "utf8")) as unknown;

      const schemaErrors = validateVectorFile(raw);
      if (schemaErrors.length > 0) {
        assert.fail(
          `schema validation failed for ${label}:\n  ${schemaErrors.join("\n  ")}`,
        );
      }

      const vector = raw as RawVector;
      const seed = parseU64(vector.seed);
      const configuration = buildConfiguration(vector.config);

      // 1. rngStream vs a fresh RNG
      const streamRng = new SeededRandomNumberGenerator(seed);
      const observedStream = vector.rngStream.map(() => toDecimal(streamRng.next()));
      assert.deepStrictEqual(
        observedStream,
        vector.rngStream,
        `${label}: rngStream mismatch`,
      );

      // 2. Replay steps on one generator instance.
      const generator = new WorldEventGenerator(seed, configuration);

      for (const step of vector.steps) {
        const state = makeWorldState({
          energy: decodeDouble(step.state.energy),
          pressure: decodeDouble(step.state.pressure),
          familiarity: decodeDouble(step.state.familiarity),
          bondLevel: step.state.bondLevel,
          movementState: step.state.movementState as MovementState,
          activeTime: decodeDouble(step.state.activeTime),
        });

        const elapsed =
          step.elapsed === undefined || step.elapsed === null
            ? undefined
            : decodeDouble(step.elapsed);

        const allowedKinds =
          step.allowedKinds === undefined || step.allowedKinds === null
            ? undefined
            : step.allowedKinds;

        const externalLastGeneratedAtElapsed =
          step.externalLastGeneratedAtElapsed === undefined ||
          step.externalLastGeneratedAtElapsed === null
            ? undefined
            : step.externalLastGeneratedAtElapsed;

        const externalLastFiredAtElapsedByKind =
          step.externalLastFiredAtElapsedByKind ?? undefined;

        const traced = generator.evaluateTraced({
          state,
          elapsed,
          allowedKinds,
          externalLastGeneratedAtElapsed,
          externalLastFiredAtElapsedByKind,
        });

        const actual = {
          eligibleKinds: traced.eligibleKinds.slice(),
          rngDraws: traced.rngDraws.map(toDecimal),
          totalWeight: traced.totalWeight === null ? null : toDecimal(traced.totalWeight),
          pick: traced.pick === null ? null : toDecimal(traced.pick),
          event:
            traced.event === null
              ? null
              : {
                  kind: traced.event.kind,
                  intensity: traced.event.intensity,
                  debugLabel: traced.event.debugLabel,
                },
        };

        const expected = {
          eligibleKinds: step.expected.eligibleKinds.slice(),
          rngDraws: step.expected.rngDraws.slice(),
          totalWeight: step.expected.totalWeight,
          pick: step.expected.pick,
          event:
            step.expected.event === null
              ? null
              : {
                  kind: step.expected.event.kind,
                  intensity: step.expected.event.intensity,
                  debugLabel: step.expected.event.debugLabel,
                },
        };

        assert.deepStrictEqual(
          actual,
          expected,
          `${label}: step ${step.index} mismatch`,
        );
      }
    });
  }
}
