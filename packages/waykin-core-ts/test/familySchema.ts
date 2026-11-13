import assert from "node:assert/strict";

type Schema = Record<string, unknown>;
function object(value: unknown): value is Schema {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}
const owns = (value: object, key: string): boolean => Object.prototype.hasOwnProperty.call(value, key);
const supported = ["$schema", "$id", "$defs", "title", "description", "$ref", "type", "const", "enum", "oneOf",
  "properties", "required", "additionalProperties", "items", "minItems", "maxItems", "pattern", "minimum", "maximum"];

function checkSchema(schema: Schema, root: Schema, depth = 0): void {
  assert.ok(object(schema) && depth < 100, "invalid schema or recursion limit");
  for (const key of Object.keys(schema)) assert.ok(supported.includes(key), `unsupported schema keyword ${key}`);
  if (schema.$ref !== undefined) {
    assert.equal(typeof schema.$ref, "string");
    assert.match(schema.$ref as string, /^#\/\$defs\/[A-Za-z0-9_-]+$/);
    assert.ok(object(root.$defs) && owns(root.$defs, (schema.$ref as string).slice(8)), "unresolved schema reference");
  }
  for (const key of ["$defs", "properties"]) if (schema[key] !== undefined) {
    assert.ok(object(schema[key]));
    for (const nested of Object.values(schema[key])) checkSchema(nested as Schema, root, depth + 1);
  }
  if (schema.oneOf !== undefined) {
    assert.ok(Array.isArray(schema.oneOf) && schema.oneOf.length > 0);
    for (const nested of schema.oneOf) checkSchema(nested as Schema, root, depth + 1);
  }
  if (schema.items !== undefined) checkSchema(schema.items as Schema, root, depth + 1);
  if (schema.type !== undefined) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    assert.ok(types.length > 0 && types.every(type => ["object", "array", "null", "integer", "number", "string", "boolean"].includes(type as string)));
  }
  if (schema.additionalProperties !== undefined) assert.equal(typeof schema.additionalProperties, "boolean");
  for (const key of ["minimum", "maximum", "minItems", "maxItems"]) if (schema[key] !== undefined) {
    assert.ok(typeof schema[key] === "number" && Number.isFinite(schema[key]));
    if (key.endsWith("Items")) assert.ok(Number.isInteger(schema[key]) && (schema[key] as number) >= 0);
  }
  if (schema.required !== undefined) assert.ok(Array.isArray(schema.required) && schema.required.every(key => typeof key === "string"));
  if (schema.enum !== undefined) assert.ok(Array.isArray(schema.enum) && schema.enum.length > 0);
  if (schema.pattern !== undefined) { assert.equal(typeof schema.pattern, "string"); new RegExp(schema.pattern as string); }
}

/** Strict interpreter for the checked-in family schemas' supported vocabulary.
 * Unknown keywords fail instead of silently weakening validation. No external refs.
 */
export function validateFamilySchema(value: unknown, schema: Schema, root = schema, path = "$", depth = 0): void {
  // Validate every schema branch first: a oneOf data mismatch must not swallow
  // malformed/unsupported constraints in another (possibly unused) branch.
  if (depth === 0) checkSchema(root, root);
  assert.ok(depth < 100, `${path}: schema recursion limit`);
  for (const key of Object.keys(schema)) assert.ok(supported.includes(key), `${path}: unsupported schema keyword ${key}`);
  if (schema.$ref !== undefined) {
    assert.equal(typeof schema.$ref, "string");
    assert.match(schema.$ref as string, /^#\/\$defs\/[A-Za-z0-9_-]+$/);
    const target = (root.$defs as Record<string, Schema>)[(schema.$ref as string).slice(8)];
    assert.ok(target, `${path}: unresolved ref`);
    validateFamilySchema(value, target, root, path, depth + 1);
  }
  if (Object.prototype.hasOwnProperty.call(schema, "const")) assert.deepEqual(value, schema.const, `${path}: const`);
  if (schema.enum) assert.ok((schema.enum as unknown[]).some(candidate => candidate === value), `${path}: enum`);
  if (schema.oneOf) {
    let matches = 0;
    for (const choice of schema.oneOf as Schema[]) {
      try { validateFamilySchema(value, choice, root, path, depth + 1); matches++; } catch { /* Try next branch. */ }
    }
    assert.equal(matches, 1, `${path}: oneOf matched ${matches} branches`);
  }
  if (schema.type) {
    const types = Array.isArray(schema.type) ? schema.type : [schema.type];
    assert.ok(types.some(type => type === "object" ? object(value)
      : type === "array" ? Array.isArray(value) : type === "null" ? value === null
      : type === "integer" ? Number.isInteger(value)
      : type === "number" ? typeof value === "number" && Number.isFinite(value)
      : typeof value === type), `${path}: type ${types.join("|")}`);
  }
  if (object(value)) {
    for (const key of (schema.required ?? []) as string[]) assert.ok(Object.prototype.hasOwnProperty.call(value, key), `${path}: missing ${key}`);
    const properties = (schema.properties ?? {}) as Record<string, Schema>;
    for (const [key, item] of Object.entries(value)) {
      if (owns(properties, key)) validateFamilySchema(item, properties[key]!, root, `${path}.${key}`, depth + 1);
      else if (schema.additionalProperties === false) assert.fail(`${path}: unexpected ${key}`);
    }
  }
  if (Array.isArray(value)) {
    if (schema.minItems !== undefined) assert.ok(value.length >= (schema.minItems as number), `${path}: minItems`);
    if (schema.maxItems !== undefined) assert.ok(value.length <= (schema.maxItems as number), `${path}: maxItems`);
    if (schema.items) value.forEach((item, index) => validateFamilySchema(item, schema.items as Schema, root, `${path}[${index}]`, depth + 1));
  }
  if (typeof value === "string" && schema.pattern) assert.match(value, new RegExp(schema.pattern as string), `${path}: pattern`);
  if (typeof value === "number") {
    if (schema.minimum !== undefined) assert.ok(value >= (schema.minimum as number), `${path}: minimum`);
    if (schema.maximum !== undefined) assert.ok(value <= (schema.maximum as number), `${path}: maximum`);
  }
}
