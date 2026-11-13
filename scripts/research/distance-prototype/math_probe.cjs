// node math_probe.cjs <pinned GeographicLib JS> <prior research output directory>
// Captures JS math calls, evaluates identical arguments in Swift, reports differences.
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const vm = require('node:vm'), cp = require('node:child_process');
const crypto = require('node:crypto'), assert = require('node:assert/strict');
const [library, previous] = process.argv.slice(2).map(p => path.resolve(p));
const sha = value => crypto.createHash('sha256').update(value).digest('hex');
const code = fs.readFileSync(library, 'utf8');
assert.equal(sha(code), '06e3512904b346575f475f14d0b27ea0979dbcd2b0eddebf5f1eeefd234395b5');
const pairs = JSON.parse(fs.readFileSync(path.join(previous, 'input.json'))).pairs;
const old = JSON.parse(fs.readFileSync(path.join(previous, 'distance-results.json')));
const encode = n => Object.is(n, -0) ? '-0' : Number.isFinite(n) ? n : String(n);
const decode = n => typeof n === 'string' ? Number(n) : n;
const names = ['sin', 'cos', 'atan', 'atan2', 'sqrt', 'hypot', 'cbrt', 'atanh', 'log1p', 'log', 'exp', 'pow'];
const rows = [], seen = new Set(); let calls = 0;
const traced = Object.create(Math);
for (const name of names) traced[name] = (...args) => {
  const value = Math[name](...args); calls++;
  const key = JSON.stringify([name, ...args.map(encode)]);
  if (!seen.has(key)) { seen.add(key); rows.push({name, args: args.map(encode), js: encode(value)}); }
  return value;
};
const sandbox = {Math: traced, module: {exports: {}}, exports: {}};
vm.runInNewContext(code, sandbox, {timeout: 10000});
const geodesic = sandbox.module.exports.Geodesic.WGS84;
const primitive = p => geodesic.Inverse(decode(p.latitude), decode(p.longitude), decode(p.latitude2), decode(p.longitude2)).s12;
let identical = 0;
for (const [index, p] of pairs.entries()) {
  // Invalid-coordinate rejection belongs to our adapter; trace only valid pairs.
  if (![p.latitude, p.longitude, p.latitude2, p.longitude2].every(Number.isFinite)
    || Math.abs(p.latitude) > 90 || Math.abs(p.latitude2) > 90
    || Math.abs(p.longitude) > 180 || Math.abs(p.longitude2) > 180) continue;
  assert.equal(primitive(p), decode(old[index].js), `Tracing changed ${p.id}`); identical++;
}
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'waykin-math-probe-'));
const bits = n => { const b = Buffer.alloc(8); b.writeDoubleBE(n); return b.toString('hex'); };
fs.writeFileSync(path.join(out, 'inputs.json'), JSON.stringify(rows.map(row =>
  ({...row, args: row.args.map(x => 'bits:' + bits(decode(x)))}))));
cp.execFileSync('swiftc', ['-Onone', '-parse-as-library', path.join(__dirname, 'MathProbe.swift'), '-o', path.join(out, 'probe')]);
const stdout = cp.execFileSync(path.join(out, 'probe'), [path.join(out, 'inputs.json')], {encoding:'utf8', maxBuffer: 32*1024*1024});
const results = JSON.parse(stdout); assert.equal(results.length, rows.length);
const stats = {}, mismatches = [], transportMismatches = [];
for (const [index, row] of rows.entries()) {
  stats[row.name] ??= {uniqueInputs: 0, exactMismatches: 0, maxAbsoluteDifference: 0};
  const s = stats[row.name]; s.uniqueInputs++;
  const expectedBits = row.args.map(x => bits(decode(x)));
  if (JSON.stringify(expectedBits) !== JSON.stringify(results[index].argumentBits)) {
    transportMismatches.push({...row, expectedBits, actualBits: results[index].argumentBits});
    continue;
  }
  const native = Buffer.from(results[index].valueBits, 'hex').readDoubleBE(), js = decode(row.js);
  if (!Object.is(native, js)) {
    s.exactMismatches++;
    if (Number.isFinite(native) && Number.isFinite(js)) s.maxAbsoluteDifference = Math.max(s.maxAbsoluteDifference, Math.abs(native - js));
    mismatches.push({...row, native: encode(native)});
  }
}
const report = {calls, uniqueInputs: rows.length, distanceOutputsUnchangedByTracing: identical,
  transport: 'binary64 input/output bits; mismatched argument bits excluded and treated as harness failure',
  stats, transportMismatches: transportMismatches.length, transportExamples: transportMismatches.slice(0, 3),
  examples: Object.keys(stats).map(name => mismatches.find(row => row.name === name)).filter(Boolean),
  librarySHA256: sha(code), inputSHA256: sha(fs.readFileSync(path.join(out, 'inputs.json'))),
  probeSHA256: sha(fs.readFileSync(path.join(__dirname, 'MathProbe.swift'))),
  runnerSHA256: sha(fs.readFileSync(__filename)), node: process.version,
  conclusion: 'Primitive differences observed; not proof that they explain every geodesic discrepancy.'};
fs.writeFileSync(path.join(out, 'native-results.json'), stdout);
fs.writeFileSync(path.join(out, 'mismatches.json'), JSON.stringify(mismatches));
fs.writeFileSync(path.join(out, 'transport-mismatches.json'), JSON.stringify(transportMismatches));
fs.writeFileSync(path.join(out, 'report.json'), JSON.stringify(report, null, 2)+'\n');
console.log(JSON.stringify({outputDirectory: out, ...report}, null, 2));
assert.equal(transportMismatches.length, 0, 'Transport corrupted research arguments');
