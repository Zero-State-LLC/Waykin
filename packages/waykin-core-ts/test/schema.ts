/**
 * Hand-written validator for specs/.../seed-event-vectors.schema.json.
 *
 * Intentionally dependency-free: this is the only thing standing between
 * Swift-produced vectors and the parity test, and we want it to be auditable
 * and local. It does not attempt to be a general JSON Schema implementation —
 * it validates exactly the shape used by WaykinVectorExport.
 */

export const EVENT_KINDS = [
  "quietInterval",
  "companionDrawsNear",
  "companionMovesAhead",
  "companionObserves",
  "distantPresence",
  "pursuitBegins",
  "pursuitIntensifies",
  "pursuitFades",
  "familiarPlaceStirs",
  "bondMoment",
] as const;

const EVENT_KIND_SET = new Set<string>(EVENT_KINDS);

const UINT64_DECIMAL_RE = /^(0|[1-9][0-9]{0,19})$/;
const VECTOR_ID_RE = /^[a-z0-9][a-z0-9-]*$/;
const SWIFT_COMMIT_RE = /^[0-9a-f]{7,40}$/;
const UINT64_MAX = BigInt("0xFFFFFFFFFFFFFFFF");

const DOUBLE_LITERALS = new Set(["NaN", "Infinity", "-Infinity"]);

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isPlainArray(value: unknown): value is unknown[] {
  return Array.isArray(value);
}

function fail(errors: string[], path: string, message: string): void {
  errors.push(`${path}: ${message}`);
}

function checkExtra(
  errors: string[],
  path: string,
  obj: Record<string, unknown>,
  allowed: readonly string[],
): void {
  for (const key of Object.keys(obj)) {
    if (!allowed.includes(key)) {
      fail(errors, path, `unexpected property "${key}"`);
    }
  }
}

function checkRequired(
  errors: string[],
  path: string,
  obj: Record<string, unknown>,
  required: readonly string[],
): void {
  for (const key of required) {
    if (!Object.prototype.hasOwnProperty.call(obj, key)) {
      fail(errors, path, `missing required property "${key}"`);
    }
  }
}

function checkUint64(errors: string[], path: string, value: unknown): void {
  if (typeof value !== "string" || !UINT64_DECIMAL_RE.test(value)) {
    fail(errors, path, `expected uint64 decimal string, got ${JSON.stringify(value)}`);
    return;
  }
  if (BigInt(value) > UINT64_MAX) {
    fail(errors, path, `uint64 value exceeds 2^64 - 1`);
  }
}

function checkDouble(errors: string[], path: string, value: unknown): void {
  if (typeof value === "number") return;
  if (typeof value === "string" && DOUBLE_LITERALS.has(value)) return;
  fail(
    errors,
    path,
    `expected double (number, "NaN", "Infinity", or "-Infinity"), got ${JSON.stringify(value)}`,
  );
}

function checkDoubleOrNull(errors: string[], path: string, value: unknown): void {
  if (value === null) return;
  checkDouble(errors, path, value);
}

function checkNumber(errors: string[], path: string, value: unknown): void {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(errors, path, `expected number, got ${JSON.stringify(value)}`);
  }
}

function checkIntegerMinZero(errors: string[], path: string, value: unknown): void {
  if (typeof value !== "number" || !Number.isInteger(value) || value < 0) {
    fail(errors, path, `expected non-negative integer, got ${JSON.stringify(value)}`);
  }
}

function checkEventKind(errors: string[], path: string, value: unknown): void {
  if (typeof value !== "string" || !EVENT_KIND_SET.has(value)) {
    fail(errors, path, `invalid eventKind: ${JSON.stringify(value)}`);
  }
}

function checkString(errors: string[], path: string, value: unknown): void {
  if (typeof value !== "string") {
    fail(errors, path, `expected string, got ${JSON.stringify(value)}`);
  }
}

function checkBoundedNumber(
  errors: string[],
  path: string,
  value: unknown,
  min: number,
  max: number,
): void {
  if (typeof value !== "number" || Number.isNaN(value)) {
    fail(errors, path, `expected number, got ${JSON.stringify(value)}`);
    return;
  }
  if (value < min || value > max) {
    fail(errors, path, `expected number in [${min}, ${max}], got ${value}`);
  }
}

function validateRule(errors: string[], path: string, value: unknown): void {
  if (!isObject(value)) {
    fail(errors, path, "expected object");
    return;
  }
  const allowed = [
    "kind",
    "minimumEnergy",
    "minimumPressure",
    "maximumPressure",
    "minimumFamiliarity",
    "minimumBondLevel",
    "weight",
    "cooldown",
  ];
  checkExtra(errors, path, value, allowed);
  checkRequired(errors, path, value, allowed);

  if ("kind" in value) checkEventKind(errors, `${path}.kind`, value.kind);
  if ("minimumEnergy" in value)
    checkBoundedNumber(errors, `${path}.minimumEnergy`, value.minimumEnergy, 0, 1);
  if ("minimumPressure" in value)
    checkBoundedNumber(errors, `${path}.minimumPressure`, value.minimumPressure, 0, 1);
  if ("maximumPressure" in value)
    checkBoundedNumber(errors, `${path}.maximumPressure`, value.maximumPressure, 0, 1);
  if ("minimumFamiliarity" in value)
    checkBoundedNumber(
      errors,
      `${path}.minimumFamiliarity`,
      value.minimumFamiliarity,
      0,
      1,
    );
  if ("minimumBondLevel" in value)
    checkIntegerMinZero(errors, `${path}.minimumBondLevel`, value.minimumBondLevel);
  if ("weight" in value) checkUint64(errors, `${path}.weight`, value.weight);
  if ("cooldown" in value) {
    if (typeof value.cooldown !== "number" || value.cooldown < 0) {
      fail(errors, `${path}.cooldown`, "expected non-negative number");
    }
  }
}

function validateConfig(errors: string[], path: string, value: unknown): void {
  if (!isObject(value)) {
    fail(errors, path, "expected object");
    return;
  }
  const allowed = ["minimumTickSpacing", "rules"];
  checkExtra(errors, path, value, allowed);
  checkRequired(errors, path, value, allowed);

  if ("minimumTickSpacing" in value) {
    if (typeof value.minimumTickSpacing !== "number" || value.minimumTickSpacing < 0) {
      fail(errors, `${path}.minimumTickSpacing`, "expected non-negative number");
    }
  }
  if ("rules" in value) {
    if (!isPlainArray(value.rules)) {
      fail(errors, `${path}.rules`, "expected array");
    } else {
      value.rules.forEach((rule, i) => validateRule(errors, `${path}.rules[${i}]`, rule));
    }
  }
}

function validateSource(errors: string[], path: string, value: unknown): void {
  if (!isObject(value)) {
    fail(errors, path, "expected object");
    return;
  }
  const allowed = ["generatedBy", "swiftCommit"];
  checkExtra(errors, path, value, allowed);
  checkRequired(errors, path, value, allowed);

  if ("generatedBy" in value && value.generatedBy !== "WaykinVectorExport") {
    fail(errors, `${path}.generatedBy`, 'expected const "WaykinVectorExport"');
  }
  if ("swiftCommit" in value) {
    if (typeof value.swiftCommit !== "string" || !SWIFT_COMMIT_RE.test(value.swiftCommit)) {
      fail(errors, `${path}.swiftCommit`, "expected 7-40 lowercase hex chars");
    }
  }
}

function validateWorldState(errors: string[], path: string, value: unknown): void {
  if (!isObject(value)) {
    fail(errors, path, "expected object");
    return;
  }
  const allowed = [
    "energy",
    "pressure",
    "familiarity",
    "bondLevel",
    "movementState",
    "activeTime",
    "lastEventAtSeconds",
  ];
  checkExtra(errors, path, value, allowed);
  checkRequired(errors, path, value, [
    "energy",
    "pressure",
    "familiarity",
    "bondLevel",
    "movementState",
    "activeTime",
  ]);

  if ("energy" in value) checkDouble(errors, `${path}.energy`, value.energy);
  if ("pressure" in value) checkDouble(errors, `${path}.pressure`, value.pressure);
  if ("familiarity" in value)
    checkDouble(errors, `${path}.familiarity`, value.familiarity);
  if ("bondLevel" in value) checkIntegerMinZero(errors, `${path}.bondLevel`, value.bondLevel);
  if ("movementState" in value) {
    checkString(errors, `${path}.movementState`, value.movementState);
  }
  if ("activeTime" in value) checkDouble(errors, `${path}.activeTime`, value.activeTime);
  if ("lastEventAtSeconds" in value) {
    checkDoubleOrNull(errors, `${path}.lastEventAtSeconds`, value.lastEventAtSeconds);
  }
}

function validateMovementSample(errors: string[], path: string, value: unknown): void {
  if (!isObject(value)) {
    fail(errors, path, "expected object");
    return;
  }
  const allowed = [
    "timestamp",
    "latitude",
    "longitude",
    "horizontalAccuracy",
    "speed",
  ];
  checkExtra(errors, path, value, allowed);
  checkRequired(errors, path, value, ["timestamp"]);
  if ("timestamp" in value) checkNumber(errors, `${path}.timestamp`, value.timestamp);
  if ("latitude" in value) checkNumber(errors, `${path}.latitude`, value.latitude);
  if ("longitude" in value) checkNumber(errors, `${path}.longitude`, value.longitude);
  if ("horizontalAccuracy" in value) {
    checkNumber(errors, `${path}.horizontalAccuracy`, value.horizontalAccuracy);
  }
  if ("speed" in value) checkNumber(errors, `${path}.speed`, value.speed);
}

function validateExpected(errors: string[], path: string, value: unknown): void {
  if (!isObject(value)) {
    fail(errors, path, "expected object");
    return;
  }
  const allowed = ["eligibleKinds", "rngDraws", "totalWeight", "pick", "event"];
  checkExtra(errors, path, value, allowed);
  checkRequired(errors, path, value, allowed);

  if ("eligibleKinds" in value) {
    if (!isPlainArray(value.eligibleKinds)) {
      fail(errors, `${path}.eligibleKinds`, "expected array");
    } else {
      value.eligibleKinds.forEach((kind, i) =>
        checkEventKind(errors, `${path}.eligibleKinds[${i}]`, kind),
      );
    }
  }

  if ("rngDraws" in value) {
    if (!isPlainArray(value.rngDraws)) {
      fail(errors, `${path}.rngDraws`, "expected array");
    } else {
      if (value.rngDraws.length > 1) {
        fail(errors, `${path}.rngDraws`, "maxItems 1");
      }
      value.rngDraws.forEach((draw, i) =>
        checkUint64(errors, `${path}.rngDraws[${i}]`, draw),
      );
    }
  }

  if ("totalWeight" in value) {
    if (value.totalWeight !== null) {
      checkUint64(errors, `${path}.totalWeight`, value.totalWeight);
    }
  }

  if ("pick" in value) {
    if (value.pick !== null) {
      checkUint64(errors, `${path}.pick`, value.pick);
    }
  }

  if ("event" in value) {
    const event = value.event;
    if (event === null) {
      // ok
    } else if (!isObject(event)) {
      fail(errors, `${path}.event`, "expected null or object");
    } else {
      const eventAllowed = ["kind", "intensity", "debugLabel"];
      checkExtra(errors, `${path}.event`, event, eventAllowed);
      checkRequired(errors, `${path}.event`, event, eventAllowed);
      if ("kind" in event) checkEventKind(errors, `${path}.event.kind`, event.kind);
      if ("intensity" in event) {
        if (typeof event.intensity !== "number") {
          fail(errors, `${path}.event.intensity`, "expected number");
        }
      }
      if ("debugLabel" in event) {
        checkString(errors, `${path}.event.debugLabel`, event.debugLabel);
      }
    }
  }
}

function validateStep(errors: string[], path: string, value: unknown): void {
  if (!isObject(value)) {
    fail(errors, path, "expected object");
    return;
  }
  const allowed = [
    "index",
    "nowSeconds",
    "elapsed",
    "movementSamples",
    "state",
    "allowedKinds",
    "externalLastGeneratedAtElapsed",
    "externalLastFiredAtElapsedByKind",
    "expected",
  ];
  checkExtra(errors, path, value, allowed);
  checkRequired(errors, path, value, ["index", "nowSeconds", "state", "expected"]);

  if ("index" in value) checkIntegerMinZero(errors, `${path}.index`, value.index);
  if ("nowSeconds" in value) checkNumber(errors, `${path}.nowSeconds`, value.nowSeconds);
  if ("elapsed" in value) checkDoubleOrNull(errors, `${path}.elapsed`, value.elapsed);
  if ("movementSamples" in value) {
    if (!isPlainArray(value.movementSamples)) {
      fail(errors, `${path}.movementSamples`, "expected array");
    } else {
      value.movementSamples.forEach((sample, i) =>
        validateMovementSample(errors, `${path}.movementSamples[${i}]`, sample),
      );
    }
  }
  if ("state" in value) validateWorldState(errors, `${path}.state`, value.state);
  if ("allowedKinds" in value) {
    const allowedKinds = value.allowedKinds;
    if (allowedKinds === null) {
      // ok
    } else if (!isPlainArray(allowedKinds)) {
      fail(errors, `${path}.allowedKinds`, "expected array or null");
    } else {
      allowedKinds.forEach((kind, i) =>
        checkEventKind(errors, `${path}.allowedKinds[${i}]`, kind),
      );
    }
  }
  if ("externalLastGeneratedAtElapsed" in value) {
    const v = value.externalLastGeneratedAtElapsed;
    if (v !== null && (typeof v !== "number" || Number.isNaN(v))) {
      fail(errors, `${path}.externalLastGeneratedAtElapsed`, "expected number or null");
    }
  }
  if ("externalLastFiredAtElapsedByKind" in value) {
    const v = value.externalLastFiredAtElapsedByKind;
    if (!isObject(v)) {
      fail(errors, `${path}.externalLastFiredAtElapsedByKind`, "expected object");
    } else {
      for (const [kind, seconds] of Object.entries(v)) {
        if (!EVENT_KIND_SET.has(kind)) {
          fail(
            errors,
            `${path}.externalLastFiredAtElapsedByKind`,
            `unexpected eventKind key "${kind}"`,
          );
        }
        if (typeof seconds !== "number" || Number.isNaN(seconds)) {
          fail(
            errors,
            `${path}.externalLastFiredAtElapsedByKind.${kind}`,
            "expected number",
          );
        }
      }
    }
  }
  if ("expected" in value) validateExpected(errors, `${path}.expected`, value.expected);
}

export function validateVectorFile(obj: unknown): string[] {
  const errors: string[] = [];

  if (!isObject(obj)) {
    return ["$: expected object"];
  }

  const allowed = [
    "schemaVersion",
    "vectorId",
    "description",
    "source",
    "seed",
    "config",
    "rngStream",
    "steps",
  ];
  checkExtra(errors, "$", obj, allowed);
  checkRequired(errors, "$", obj, [
    "schemaVersion",
    "vectorId",
    "source",
    "seed",
    "config",
    "rngStream",
    "steps",
  ]);

  if ("schemaVersion" in obj && obj.schemaVersion !== 1) {
    fail(errors, "$.schemaVersion", "expected const 1");
  }
  if ("vectorId" in obj) {
    if (typeof obj.vectorId !== "string" || !VECTOR_ID_RE.test(obj.vectorId)) {
      fail(errors, "$.vectorId", "expected [a-z0-9][a-z0-9-]*");
    }
  }
  if ("description" in obj) {
    checkString(errors, "$.description", obj.description);
  }
  if ("source" in obj) validateSource(errors, "$.source", obj.source);
  if ("seed" in obj) checkUint64(errors, "$.seed", obj.seed);
  if ("config" in obj) validateConfig(errors, "$.config", obj.config);

  if ("rngStream" in obj) {
    if (!isPlainArray(obj.rngStream)) {
      fail(errors, "$.rngStream", "expected array");
    } else {
      if (obj.rngStream.length < 1) {
        fail(errors, "$.rngStream", "minItems 1");
      }
      obj.rngStream.forEach((entry, i) => checkUint64(errors, `$.rngStream[${i}]`, entry));
    }
  }

  if ("steps" in obj) {
    if (!isPlainArray(obj.steps)) {
      fail(errors, "$.steps", "expected array");
    } else {
      obj.steps.forEach((step, i) => validateStep(errors, `$.steps[${i}]`, step));
    }
  }

  return errors;
}
