#!/usr/bin/env node
/**
 * Isolation check for packages/waykin-core-ts/src.
 *
 * Fails (exit 1, lists every offence) when any TypeScript source under src/
 *   - imports/requires anything that is not a relative './' or '../' path,
 *   - uses `require(` at all,
 *   - references a global matching /\bglobal\./, /\bscript\./, or
 *     /\b[A-Z]\w*Module\b/ (comments are stripped before scanning).
 *
 * Prints "OK" and exits 0 when clean.
 */

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(here, "..");
const srcDir = join(packageRoot, "src");

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile() && entry.name.endsWith(".ts")) out.push(full);
  }
  return out;
}

/**
 * Strip `//` line comments and `/* ... *​/` block comments, preserving
 * newlines so line numbers stay correct in error output. Naive on purpose:
 * literal content in this package never contains comment markers.
 */
function stripComments(source) {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, (match) => match.replace(/[^\n]/g, " "))
    .replace(/\/\/[^\n]*/g, "");
}

function lineOf(code, index) {
  let line = 1;
  for (let i = 0; i < index && i < code.length; i++) {
    if (code[i] === "\n") line++;
  }
  return line;
}

function forEachMatch(code, re, cb) {
  re.lastIndex = 0;
  let match;
  while ((match = re.exec(code)) !== null) {
    cb(match, lineOf(code, match.index));
    if (match.index === re.lastIndex) re.lastIndex++;
  }
}

const files = walk(srcDir);
const offences = [];

for (const file of files) {
  const raw = readFileSync(file, "utf8");
  const code = stripComments(raw);
  const rel = relative(packageRoot, file);

  forEachMatch(code, /\brequire\s*\(/g, (_m, line) => {
    offences.push(`${rel}:${line}: uses require(...)`);
  });

  const specs = [];
  forEachMatch(code, /\bfrom\s+['"]([^'"]+)['"]/g, (m, line) => {
    specs.push([m[1], line]);
  });
  forEachMatch(code, /\bimport\s*\(\s*['"]([^'"]+)['"]\s*\)/g, (m, line) => {
    specs.push([m[1], line]);
  });
  forEachMatch(code, /\bimport\s+['"]([^'"]+)['"]/g, (m, line) => {
    specs.push([m[1], line]);
  });

  for (const [spec, line] of specs) {
    if (!spec.startsWith("./") && !spec.startsWith("../")) {
      offences.push(`${rel}:${line}: non-relative import "${spec}"`);
    }
  }

  forEachMatch(code, /\bglobal\s*\./g, (_m, line) => {
    offences.push(`${rel}:${line}: references banned identifier "global."`);
  });
  forEachMatch(code, /\bscript\s*\./g, (_m, line) => {
    offences.push(`${rel}:${line}: references banned identifier "script."`);
  });
  forEachMatch(code, /\b[A-Z]\w*Module\b/g, (m, line) => {
    offences.push(`${rel}:${line}: references banned identifier "${m[0]}"`);
  });
}

if (offences.length > 0) {
  console.error("isolation check failed:");
  for (const offence of offences) console.error(`  ${offence}`);
  process.exit(1);
}

console.log("OK");
