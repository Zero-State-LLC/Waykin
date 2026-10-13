// Research only. Generates temporary instrumented sources, never edits production.
// node scripts/research/distance-prototype/run.cjs <C source dir> <JS library> <broad JSON> <threshold JSON>
const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');
const crypto = require('node:crypto');
const cp = require('node:child_process');
const assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const [cDir, jsFile, broadFile, thresholdFile] = process.argv.slice(2).map(p => path.resolve(p));
if (!thresholdFile) throw new Error('Expected C directory, JS library, broad JSON, threshold JSON');
const hash = p => crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const pinned = {
  [path.join(cDir, 'geodesic.c')]: '87a91e0e30e7db839cbd1ef5aafea77487524958070565ff9155e50e9bead550',
  [path.join(cDir, 'geodesic.h')]: 'a964a747bc4f388fb3a93cc9bc379aebe4cdd78b3ee909c071be711b82db4b10',
  [jsFile]: '06e3512904b346575f475f14d0b27ea0979dbcd2b0eddebf5f1eeefd234395b5',
};
for (const [file, expected] of Object.entries(pinned)) assert.equal(hash(file), expected, `Unreviewed dependency: ${file}`);
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'waykin-distance-replay-'));
console.error(`Research output: ${out}`);
const run = (cmd, args) => cp.execFileSync(cmd, args, {cwd: root, encoding: 'utf8', maxBuffer: 256 * 1024 * 1024});
const write = (name, value) => fs.writeFileSync(path.join(out, name), value);
const read = name => fs.readFileSync(path.join(root, name), 'utf8');
const once = (source, old, replacement) => {
  assert.equal(source.split(old).length, 2, 'Instrumentation seam missing or ambiguous');
  return source.replace(old, replacement);
};
// Extract the actual value type, not a hand-written approximation of it.
const models = read('Sources/WaykinCore/Domain/Models.swift');
const marker = 'public struct RoutePoint: Codable, Equatable, Sendable {';
let start = models.indexOf(marker), end = start + marker.length, depth = 1;
assert.ok(start >= 0);
for (; end < models.length && depth; end++) {
  if (models[end] === '{') depth++;
  if (models[end] === '}') depth--;
}
assert.equal(depth, 0);
write('RoutePoint.swift', 'import Foundation\n' + models.slice(start, end));
const swiftPath = 'Sources/WaykinCore/Location/MovementIntegrity.swift';
const tsPath = 'packages/waykin-core-ts/src/movementIntegrity.ts';
const swiftBody = 'CLLocation(latitude: lhs.latitude, longitude: lhs.longitude)\n            .distance(from: CLLocation(latitude: rhs.latitude, longitude: rhs.longitude))';
write('MovementIntegrity.swift', once(read(swiftPath), swiftBody, 'researchDistance(lhs, rhs)'));
write('movementIntegrity.ts', 'import { candidateDistance } from "./candidate";\n' +
  once(read(tsPath), 'const distance = movementDistanceMeters(this.anchor, sample);',
    'const distance = candidateDistance(this.anchor, sample);'));
write('candidate.ts', fs.readFileSync(path.join(__dirname, 'candidate.ts')));
run('clang', ['-O2', '-fno-fast-math', '-ffp-contract=off', '-c', path.join(cDir, 'geodesic.c'), '-o', path.join(out, 'geodesic.o')]);
run('swiftc', ['-Onone', '-import-objc-header', path.join(cDir, 'geodesic.h'),
  path.join(out, 'RoutePoint.swift'), path.join(out, 'MovementIntegrity.swift'),
  path.join(__dirname, 'Probe.swift'), path.join(out, 'geodesic.o'), '-o', path.join(out, 'probe')]);
run(path.join(root, 'packages/waykin-core-ts/node_modules/.bin/tsc'), [
  '--strict', '--target', 'ES2019', '--module', 'commonjs', '--outDir', path.join(out, 'js'),
  path.join(out, 'candidate.ts'), path.join(out, 'movementIntegrity.ts')]);

const pairs = [];
for (const [family, file] of [['broad', broadFile], ['threshold', thresholdFile]]) {
  const rows = JSON.parse(fs.readFileSync(file, 'utf8'));
  assert.equal(rows.length, 1344, `${family} corpus changed; review before rerunning`);
  for (const [i, r] of rows.entries()) pairs.push({id: `${family}-${i}`, family,
    latitude: r.latitude, longitude: r.longitude, latitude2: r.latitude2, longitude2: r.longitude2});
}
const edge = (id, latitude, longitude, latitude2, longitude2) =>
  pairs.push({id, family: 'edge', latitude, longitude, latitude2, longitude2});
edge('coincident', 0, 0, 0, 0);
edge('signed-zero', -0, -0, 0, 0);
edge('subnormal', 0, 0, Number.MIN_VALUE, 0);
edge('dateline-alias', 20, -180, 20, 180);
edge('dateline-cross', 37, 179.999999, 37, -179.999999);
edge('north-pole', 90, -20, 90, 160);
edge('south-pole', -90, -20, -90, 160);
edge('antipodal', 0, 0, 0, 180);
edge('near-antipodal', 0.001, 0, -0.0011, 179.999999);
edge('pole-to-pole', -90, 0, 90, 0);
edge('equatorial-degree', 0, 0, 0, 1);
edge('invalid-lat', 90.0001, 0, 0, 0);
edge('invalid-lon', 0, 180.0001, 0, 0);
edge('nan', 'NaN', 0, 0, 0);
edge('infinity', 0, 'Infinity', 0, 0);
edge('negative-infinity', 0, 0, '-Infinity', 0);

// Alternating endpoints build smoothing history without deriving expected outputs.
// Processor-level anchor resets represent the seam used by lifecycle controls;
// this is NOT a replay of MovementEngine pause/resume or downstream experiences.
const sequences = [];
for (const p of pairs.filter(p => p.family !== 'edge')) for (const dt of [0.5, 1, 2, 14]) {
  const steps = []; let timestamp = 1000000000;
  const add = (side, delta, overrides = {}) => {
    timestamp += delta;
    steps.push({timestamp, receivedAt: timestamp, latitude: side ? p.latitude2 : p.latitude,
      longitude: side ? p.longitude2 : p.longitude, accuracy: 5, reportedSpeed: 'NaN', ...overrides});
  };
  add(0, 0);
  add(1, dt); add(0, dt); add(1, dt); // populate three-value fallback speed window
  add(0, dt, {reportedSpeed: 1.2}); // mix reported and derived speed
  add(1, dt, {accuracy: 31}); // rejected sample must not advance anchor
  add(1, dt, {reportedSpeed: -1});
  add(1, 0); // duplicate timestamp
  add(0, dt, {reset: true}); // reset clears prior window
  add(1, dt); add(0, dt);
  add(0, dt, {reportedSpeed: 0}); add(0, dt, {reportedSpeed: 0}); add(0, dt, {reportedSpeed: 0});
  add(1, 16); // fresh anchor across a gap
  add(0, dt, {receivedAt: timestamp + dt + 16}); // stale rejection
  sequences.push({id: `${p.id}-dt${dt}`, steps});
}
const input = {pairs, sequences};
write('input.json', JSON.stringify(input));
const bits = n => { const b = Buffer.alloc(8); b.writeDoubleBE(n); return 'bits:' + b.toString('hex'); };
const fromBits = value => typeof value === 'string' && value.startsWith('bits:')
  ? Buffer.from(value.slice(5), 'hex').readDoubleBE() : value;
write('swift-input.json', JSON.stringify(input, (_, value) => typeof value === 'number' ? bits(value) : value));
write('swift.json', run(path.join(out, 'probe'), [path.join(out, 'swift-input.json')]));
const swift = JSON.parse(fs.readFileSync(path.join(out, 'swift.json'), 'utf8'), (_, value) => fromBits(value));
const nativeByID = new Map(swift.distances.map(r => [r.id, r]));
const adapter = require(path.join(out, 'js/candidate.js'));
adapter.installResearchBackend(require(jsFile).Geodesic.WGS84);
const {MovementIntegrityProcessor} = require(path.join(out, 'js/movementIntegrity.js'));
const decode = value => typeof value === 'string' ? Number(value) : value;
const finite = value => Number.isFinite(value);
const projection = s => ({sampleInterval: s.sampleInterval, distanceDelta: s.distanceDelta,
  isMoving: s.isMoving, hasPoint: s.point !== null, speed: s.diagnostic.derivedSpeedMetersPerSecond,
  disposition: s.diagnostic.disposition, accuracyBucket: s.diagnostic.accuracyBucket,
  accumulatedDistance: s.diagnostic.accumulatedDistance});
const decisions = ['isMoving', 'hasPoint', 'disposition', 'accuracyBucket', 'accumulatedDistance'];
const equal = (a,b) => a === b || (Number.isNaN(a) && Number.isNaN(b));
const migration = [], parity = [], distanceRows = [];
const stats = {pairs: pairs.length, sequences: sequences.length, steps: 0,
  distanceExactMismatches: 0, maximumNativeJSDistanceError: 0,
  migrationDistanceAbove005: {broad: 0, threshold: 0, edge: 0},
  maximumAppleCandidateError: {broad: 0, threshold: 0, edge: 0},
  nativeJSNumericStepMismatches: 0, nativeJSDecisionStepMismatches: 0,
  migrationNumericStepMismatches: 0, migrationDecisionStepMismatches: 0};
for (const p of pairs) {
  const native = nativeByID.get(p.id);
  const js = adapter.candidateDistance({latitude: decode(p.latitude), longitude: decode(p.longitude)},
    {latitude: decode(p.latitude2), longitude: decode(p.longitude2)});
  const c = decode(native.candidate), apple = decode(native.apple);
  const coordinates = [p.latitude, p.longitude, p.latitude2, p.longitude2].map(decode);
  const valid = coordinates.every(finite) && Math.abs(coordinates[0]) <= 90
    && Math.abs(coordinates[2]) <= 90 && Math.abs(coordinates[1]) <= 180 && Math.abs(coordinates[3]) <= 180;
  if (valid) {
    assert.ok(finite(c) && c >= 0 && finite(js) && js >= 0 && finite(apple), `Invalid valid-domain result: ${p.id}`);
  } else { assert.ok(Number.isNaN(c) && Number.isNaN(js), `Invalid input not rejected: ${p.id}`); }
  if (!equal(c, js)) stats.distanceExactMismatches++;
  if (finite(c) && finite(js)) stats.maximumNativeJSDistanceError = Math.max(stats.maximumNativeJSDistanceError, Math.abs(c-js));
  if (finite(c) && finite(apple)) {
    const error = Math.abs(c - apple);
    stats.maximumAppleCandidateError[p.family] = Math.max(stats.maximumAppleCandidateError[p.family], error);
    if (error > 0.05) stats.migrationDistanceAbove005[p.family]++;
  }
  distanceRows.push({...p, native: finite(c) ? c : String(c), js: finite(js) ? js : String(js),
    apple: finite(apple) ? apple : String(apple)});
}
// Independent sanity gates; exact cross-runtime mismatches are reported, not erased.
for (const id of ['coincident', 'signed-zero', 'dateline-alias', 'north-pole', 'south-pole']) {
  const row = distanceRows.find(r => r.id === id); assert.equal(row.native, 0); assert.equal(row.js, 0);
}
for (const id of ['invalid-lat', 'invalid-lon', 'nan', 'infinity', 'negative-infinity']) {
  const row = distanceRows.find(r => r.id === id); assert.equal(row.native, 'NaN'); assert.equal(row.js, 'NaN');
}
for (const id of ['antipodal', 'near-antipodal', 'pole-to-pole']) {
  const row = distanceRows.find(r => r.id === id);
  assert.ok(row.native > 20000000 && row.native < 20010000);
  assert.ok(row.js > 20000000 && row.js < 20010000);
}
const degree = distanceRows.find(r => r.id === 'equatorial-degree');
assert.ok(Math.abs(degree.native - 6378137 * Math.PI / 180) < 1e-8);
assert.ok(Math.abs(degree.js - 6378137 * Math.PI / 180) < 1e-8);
for (const [index, sequence] of sequences.entries()) {
  const native = swift.sequences[index]; assert.equal(native.id, sequence.id);
  const processor = new MovementIntegrityProcessor();
  sequence.steps.forEach((step, i) => {
    if (step.reset) processor.resetAnchor();
    const js = projection(processor.process({timestamp: step.timestamp, latitude: step.latitude,
      longitude: step.longitude, horizontalAccuracy: step.accuracy,
      reportedSpeedMetersPerSecond: decode(step.reportedSpeed)}, step.receivedAt));
    const c = native.candidate[i], apple = native.apple[i]; stats.steps++;
    const parityFields = Object.keys(c).filter(key => !equal(c[key], js[key]));
    const migrationFields = Object.keys(c).filter(key => !equal(c[key], apple[key]));
    if (parityFields.length) {
      if (parityFields.some(key => decisions.includes(key))) stats.nativeJSDecisionStepMismatches++;
      if (parityFields.some(key => !decisions.includes(key))) stats.nativeJSNumericStepMismatches++;
      parity.push({sequence: sequence.id, step: i, fields: parityFields, native: c, js});
    }
    if (migrationFields.length) {
      if (migrationFields.some(key => decisions.includes(key))) stats.migrationDecisionStepMismatches++;
      if (migrationFields.some(key => !decisions.includes(key))) stats.migrationNumericStepMismatches++;
      migration.push({sequence: sequence.id, step: i, fields: migrationFields, apple, candidate: c});
    }
  });
}
const manifest = {head: run('git', ['rev-parse', 'HEAD']).trim(), dependencies: pinned,
  transport: 'All Swift numeric inputs and outputs use exact binary64 hex strings, not JSON decimal decoding',
  harnessSHA256: Object.fromEntries(['run.cjs', 'Probe.swift', 'candidate.ts'].map(name => [name, hash(path.join(__dirname, name))])),
  swiftSourceSHA256: hash(path.join(root, swiftPath)), tsSourceSHA256: hash(path.join(root, tsPath)),
  broadSHA256: hash(broadFile), thresholdSHA256: hash(thresholdFile),
  swift: run('swift', ['--version']).trim(), node: process.version,
  clang: run('clang', ['--version']).trim(),
  compilerFlags: 'C: -O2 -fno-fast-math -ffp-contract=off; Swift: -Onone; TS: strict ES2019 CommonJS',
  stats, acceptance: stats.distanceExactMismatches === 0 && stats.nativeJSNumericStepMismatches === 0
    && stats.nativeJSDecisionStepMismatches === 0 ? 'EXACT_FOR_CORPUS_ONLY' : 'EXACT_PARITY_FAILED',
  limitations: ['Swift uses native C, not a pure-Swift transcription', 'No Lens runtime execution',
    'Processor-level replay only; no MovementEngine, events, Bond or memory replay',
    'Adversarial selection is not real-world incidence', 'No production adoption authorized']};
write('distance-results.json', JSON.stringify(distanceRows));
write('native-js-mismatches.json', JSON.stringify(parity));
write('migration-mismatches.json', JSON.stringify(migration));
write('report.json', JSON.stringify(manifest, null, 2) + '\n');
console.log(JSON.stringify({outputDirectory: out, ...manifest}, null, 2));
// A completed experiment is not a passed production gate; fail explicitly on parity.
process.exitCode = manifest.acceptance === 'EXACT_PARITY_FAILED' ? 2 : 0;
