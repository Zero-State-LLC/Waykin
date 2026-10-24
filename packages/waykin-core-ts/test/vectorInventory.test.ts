import test from "node:test";
import assert from "node:assert/strict";
import { existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

test("all parity families have committed-style fixtures, schemas and registered readers", () => {
  let repo = process.cwd();
  while (!existsSync(join(repo, "specs/001-spectacles-lira-walk/contracts"))) {
    const parent = dirname(repo); assert.notEqual(parent, repo); repo = parent;
  }
  const families = ["bond-memory", "companion", "demo", "movement", "pursuit", "seed-event"];
  const root = process.env.WAYKIN_VECTORS_DIR ?? join(repo, "Tests/Vectors");
  assert.ok(existsSync(root), "Swift vector root is required");
  const entries = readdirSync(root, { withFileTypes: true });
  assert.deepEqual(entries.filter(entry => entry.isDirectory()).map(entry => entry.name).sort(), families);
  assert.ok(!entries.some(entry => entry.isFile() && entry.name.endsWith(".json")), "Root-level JSON has no family reader");
  for (const family of families) {
    assert.ok(existsSync(join(repo, `specs/001-spectacles-lira-walk/contracts/${family}-vectors.schema.json`)));
    const files = readdirSync(join(root, family), { withFileTypes: true });
    assert.ok(files.some(file => file.isFile() && file.name.endsWith(".json")), `${family}: no fixtures`);
    assert.ok(files.every(file => file.isFile()), `${family}: nested paths have no registered replay`);
  }
});
