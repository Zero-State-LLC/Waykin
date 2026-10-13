/**
 * WorldEventGenerator — pure TypeScript port of the seed->event slice.
 *
 * Parity rules mirrored from contracts/core-parity.md rules 1-13. See
 * evaluateTraced() for the observable surface used by parity tests.
 */

import { type U64, U64_ZERO as ZERO, U64_ONE as ONE, checkedAdd, cmp, eq, mod, parseU64, toDecimal } from "./uint64.js";
import { SeededRandomNumberGenerator, type RngLike } from "./rng.js";
import {
  clamped01,
  finiteOrZero,
  type WorldEventKind,
  type WorldState,
} from "./worldState.js";

const DEFAULT_COOLDOWN = 20;
const DEFAULT_WEIGHT: U64 = ONE;

export interface WorldEventRule {
  kind: WorldEventKind;
  minimumEnergy: number;
  minimumPressure: number;
  maximumPressure: number;
  minimumFamiliarity: number;
  minimumBondLevel: number;
  weight: U64;
  cooldown: number;
}

export interface WorldEventRuleInput {
  kind: WorldEventKind;
  minimumEnergy?: number;
  minimumPressure?: number;
  maximumPressure?: number;
  minimumFamiliarity?: number;
  minimumBondLevel?: number;
  weight?: U64;
  cooldown?: number;
}

/**
 * Mirrors Swift `WorldEventRule.init` clamps:
 *   minimumEnergy       = clamped01
 *   minimumPressure     = clamped01
 *   maximumPressure     = clamped01
 *   minimumFamiliarity  = clamped01
 *   minimumBondLevel    = max(0, ...)
 *   weight              = max(1, ...)   (UInt64)
 *   cooldown            = max(0, ...)
 */
export function makeRule(input: WorldEventRuleInput): WorldEventRule {
  const weight = input.weight ?? DEFAULT_WEIGHT;
  return {
    kind: input.kind,
    minimumEnergy: clamped01(input.minimumEnergy ?? 0),
    minimumPressure: clamped01(input.minimumPressure ?? 0),
    maximumPressure: clamped01(input.maximumPressure ?? 1),
    minimumFamiliarity: clamped01(input.minimumFamiliarity ?? 0),
    minimumBondLevel: Math.max(0, input.minimumBondLevel ?? 0),
    weight: cmp(weight, ONE) < 0 ? ONE : weight,
    cooldown: Math.max(0, input.cooldown ?? DEFAULT_COOLDOWN),
  };
}

export interface GeneratorConfiguration {
  minimumTickSpacing: number;
  rules: WorldEventRule[];
}

export interface GeneratorConfigurationInput {
  minimumTickSpacing?: number;
  rules?: WorldEventRule[];
}

export function makeConfiguration(
  input?: GeneratorConfigurationInput,
): GeneratorConfiguration {
  return {
    minimumTickSpacing: Math.max(0, input?.minimumTickSpacing ?? 40),
    rules: input?.rules ?? defaultRules(),
  };
}

/**
 * Companion-first light tune (v1.1) — mirror of
 * `WorldEventGeneratorConfiguration.defaultRules`. Values are the
 * *post-clamp* values as stored by Swift `WorldEventRule.init`.
 */
export function defaultRules(): WorldEventRule[] {
  return [
    makeRule({
      kind: "quietInterval",
      minimumEnergy: 0,
      maximumPressure: 0.25,
      weight: parseU64("3"),
      cooldown: 28,
    }),
    makeRule({
      kind: "companionDrawsNear",
      minimumEnergy: 0.05,
      maximumPressure: 0.48,
      weight: parseU64("7"),
      cooldown: 24,
    }),
    makeRule({
      kind: "companionMovesAhead",
      minimumEnergy: 0.4,
      maximumPressure: 0.62,
      weight: parseU64("4"),
      cooldown: 30,
    }),
    makeRule({
      kind: "companionObserves",
      minimumEnergy: 0,
      minimumPressure: 0.04,
      maximumPressure: 0.55,
      weight: parseU64("4"),
      cooldown: 22,
    }),
    makeRule({
      kind: "distantPresence",
      minimumPressure: 0.24,
      maximumPressure: 0.7,
      weight: parseU64("3"),
      cooldown: 44,
    }),
    makeRule({
      kind: "pursuitBegins",
      minimumEnergy: 0.28,
      minimumPressure: 0.36,
      maximumPressure: 0.78,
      weight: parseU64("2"),
      cooldown: 70,
    }),
    makeRule({
      kind: "pursuitIntensifies",
      minimumPressure: 0.55,
      maximumPressure: 1,
      weight: parseU64("3"),
      cooldown: 48,
    }),
    makeRule({
      kind: "pursuitFades",
      minimumEnergy: 0.5,
      minimumPressure: 0.18,
      maximumPressure: 0.55,
      weight: parseU64("3"),
      cooldown: 38,
    }),
    makeRule({
      kind: "familiarPlaceStirs",
      minimumFamiliarity: 0.3,
      weight: parseU64("3"),
      cooldown: 50,
    }),
    makeRule({
      kind: "bondMoment",
      minimumEnergy: 0.2,
      minimumBondLevel: 8,
      weight: parseU64("3"),
      cooldown: 60,
    }),
  ];
}

export function defaultConfiguration(): GeneratorConfiguration {
  return { minimumTickSpacing: 40, rules: defaultRules() };
}

export interface WorldEvent {
  kind: WorldEventKind;
  intensity: number;
  debugLabel: string;
}

export interface EvaluateOptions {
  state: WorldState;
  elapsed?: number;
  externalLastGeneratedAtElapsed?: number;
  externalLastFiredAtElapsedByKind?: Partial<Record<WorldEventKind, number>>;
  allowedKinds?: readonly WorldEventKind[];
}

export interface TracedResult {
  event: WorldEvent | null;
  eligibleKinds: WorldEventKind[];
  rngDraws: U64[];
  totalWeight: U64 | null;
  pick: U64 | null;
}

export interface WorldEventGeneratorOptions {
  rng?: RngLike;
}

function ruleMeetsThresholds(rule: WorldEventRule, state: WorldState): boolean {
  if (state.energy < rule.minimumEnergy) return false;
  if (state.pressure < rule.minimumPressure) return false;
  if (state.pressure > rule.maximumPressure) return false;
  if (state.familiarity < rule.minimumFamiliarity) return false;
  if (state.bondLevel < rule.minimumBondLevel) return false;
  return true;
}

function ruleIsEligible(
  rule: WorldEventRule,
  state: WorldState,
  elapsed: number,
  lastFiredAtElapsed: number | undefined,
): boolean {
  if (!ruleMeetsThresholds(rule, state)) return false;
  if (lastFiredAtElapsed !== undefined && elapsed - lastFiredAtElapsed < rule.cooldown) {
    return false;
  }
  if (state.movementState !== "moving" && state.movementState !== "paused") {
    return false;
  }
  return true;
}

function maxOptional(a: number | undefined, b: number | undefined): number | undefined {
  if (a === undefined) return b;
  if (b === undefined) return a;
  return a >= b ? a : b;
}

export class WorldEventGenerator {
  private rng: RngLike;
  private readonly configuration: GeneratorConfiguration;
  private lastGeneratedAtElapsed: number | undefined;
  private lastFiredAtElapsedByKind: Map<WorldEventKind, number>;

  constructor(
    seed: U64,
    configuration: GeneratorConfiguration = defaultConfiguration(),
    options?: WorldEventGeneratorOptions,
  ) {
    this.rng = options?.rng ?? new SeededRandomNumberGenerator(seed);
    this.configuration = configuration;
    this.lastGeneratedAtElapsed = undefined;
    this.lastFiredAtElapsedByKind = new Map();
  }

  /**
   * Public API matching Swift `evaluate(...)`. Delegates to evaluateTraced so
   * parity tests can observe the internals and this method stays one wrapper.
   */
  evaluate(options: EvaluateOptions): WorldEvent | null {
    return this.evaluateTraced(options).event;
  }

  /**
   * Returns both the emitted event (or null) and the intermediate values that
   * the parity vectors record: eligible rules in configuration order, the RNG
   * draw(s), the summed total weight, and the modulo `pick`.
   */
  evaluateTraced(options: EvaluateOptions): TracedResult {
    const state = options.state;
    const elapsedInput = options.elapsed ?? state.activeTime;
    const elapsed = Math.max(0, finiteOrZero(elapsedInput));

    // Rule 3/4: tick spacing. lastGenerated is the max of present values.
    const lastGenerated = maxOptional(
      this.lastGeneratedAtElapsed,
      options.externalLastGeneratedAtElapsed,
    );
    if (
      lastGenerated !== undefined &&
      elapsed - lastGenerated < this.configuration.minimumTickSpacing
    ) {
      return emptyTrace();
    }

    const allowedKinds = options.allowedKinds;
    const allowedSet =
      allowedKinds === undefined ? undefined : new Set<WorldEventKind>(allowedKinds);

    const eligible: WorldEventRule[] = [];
    for (const rule of this.configuration.rules) {
      if (allowedSet !== undefined && !allowedSet.has(rule.kind)) continue;
      const internal = this.lastFiredAtElapsedByKind.get(rule.kind);
      const external = options.externalLastFiredAtElapsedByKind?.[rule.kind];
      const lastFired = maxOptional(internal, external);
      if (ruleIsEligible(rule, state, elapsed, lastFired)) {
        eligible.push(rule);
      }
    }

    // Rule 6: nothing eligible — no RNG advance, no state mutation.
    if (eligible.length === 0) {
      return emptyTrace();
    }

    // Rule 7: sum weights as uint64; throws on overflow (Swift traps).
    let totalWeight = ZERO;
    for (const rule of eligible) {
      totalWeight = checkedAdd(totalWeight, rule.weight);
    }

    // Rule 8: exactly one draw per emitted event.
    const draw = this.rng.next();
    const pick = eq(totalWeight, ZERO) ? ZERO : mod(draw, totalWeight);

    // Rule 9: accumulate cursor in configuration order; boundary belongs to
    // the next rule; fallback to eligible[0] is unreachable but mirrored.
    let cursor = ZERO;
    let selected: WorldEventRule = eligible[0]!;
    for (const rule of eligible) {
      cursor = checkedAdd(cursor, rule.weight);
      if (cmp(pick, cursor) < 0) {
        selected = rule;
        break;
      }
    }

    // Rule 10: mutate state only on emit.
    this.lastGeneratedAtElapsed = elapsed;
    this.lastFiredAtElapsedByKind.set(selected.kind, elapsed);

    // Rule 11: intensity = clamped01(max(energy, pressure)).
    const intensity = clamped01(Math.max(state.energy, state.pressure));
    const event: WorldEvent = {
      kind: selected.kind,
      intensity,
      debugLabel: selected.kind,
    };

    return {
      event,
      eligibleKinds: eligible.map((rule) => rule.kind),
      rngDraws: [draw],
      totalWeight,
      pick,
    };
  }

  clone(): WorldEventGenerator {
    const rngClone = this.rng.clone();
    const copy = new WorldEventGenerator(ZERO, this.configuration, { rng: rngClone });
    copy.lastGeneratedAtElapsed = this.lastGeneratedAtElapsed;
    copy.lastFiredAtElapsedByKind = new Map(this.lastFiredAtElapsedByKind);
    return copy;
  }

  /** Exposed for diagnostics / parity-vector debugging only. */
  debugTotalWeightFor(kinds: readonly WorldEventKind[]): string | null {
    const set = new Set(kinds);
    let total = ZERO;
    for (const rule of this.configuration.rules) {
      if (set.has(rule.kind)) total = checkedAdd(total, rule.weight);
    }
    return toDecimal(total);
  }
}

function emptyTrace(): TracedResult {
  return {
    event: null,
    eligibleKinds: [],
    rngDraws: [],
    totalWeight: null,
    pick: null,
  };
}
