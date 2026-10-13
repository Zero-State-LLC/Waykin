import test from "node:test";
import assert from "node:assert/strict";
import { validateFamilySchema } from "./familySchema.js";

test("family schema validator rejects missing, extra, malformed and unknown constraints", () => {
  const schema = { type: "object", required: ["values"], additionalProperties: false,
    properties: { values: { type: "array", minItems: 1, maxItems: 2, items: { $ref: "#/$defs/value" } } },
    $defs: { value: { oneOf: [{ type: "number", minimum: 0, maximum: 1 }, { enum: ["NaN"] }] } } };
  validateFamilySchema({ values: [0.5, "NaN"] }, schema);
  for (const value of [{}, { values: [] }, { values: [1, 1, 1] }, { values: [2] },
    { values: [Infinity] }, { values: ["unexpected"] }, { values: [1], extra: true }])
    assert.throws(() => validateFamilySchema(value, schema));
  assert.throws(() => validateFamilySchema(1, { unsupported: true }));
  assert.throws(() => validateFamilySchema(1, { oneOf: [{ type: "number" }, { const: 1 }] }));
  assert.throws(() => validateFamilySchema("bad", { type: "string", pattern: "^[0-9a-f]{40}$" }));
});

test("schema errors cannot hide in unused branches or inherited property names", () => {
  assert.throws(() => validateFamilySchema(1, { oneOf: [{ type: "number" }, { typo: true }] }), /unsupported/);
  assert.throws(() => validateFamilySchema(1, { oneOf: [{ type: "number" }, { $ref: "#/$defs/missing" }] }), /reference/);
  assert.throws(() => validateFamilySchema(1, { $defs: { unused: { minimum: "0" } }, type: "number" }));
  const schema = { type: "object", properties: {}, additionalProperties: false };
  for (const name of ["toString", "constructor", "__proto__"]) {
    assert.throws(() => validateFamilySchema(JSON.parse(`{"${name}":{}}`), schema), /unexpected/);
  }
});
