import test from "node:test";
import assert from "node:assert/strict";
import { CanonicalCompanionIdentity } from "../src/companionIdentity.js";

test("canonical Lira identity and default Bond match Swift", () => {
  assert.deepEqual(CanonicalCompanionIdentity.defaultCompanion(), {
    id: "6C697261-0001-4000-8000-000000000001", name: "Lira", archetype: "explorer",
    bondLevel: 12, lastSessionID: null, memories: [],
  });
  // Swift's identity factory does not clamp a caller-specified Bond.
  assert.equal(CanonicalCompanionIdentity.defaultCompanion(-1).bondLevel, -1);
});

test("each identity factory result is an independent value", () => {
  const first = CanonicalCompanionIdentity.defaultCompanion();
  first.name = "changed";
  first.memories.push({ id: "memory-1", sessionID: "session-1", text: "test", timestamp: 0 });
  const second = CanonicalCompanionIdentity.defaultCompanion();
  assert.equal(second.name, "Lira");
  assert.deepEqual(second.memories, []);
});
