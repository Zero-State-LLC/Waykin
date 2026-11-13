// Research gate only. node test_portable_math.cjs <math_probe output directory>
const fs = require('node:fs'), path = require('node:path'), os = require('node:os');
const cp = require('node:child_process'), crypto = require('node:crypto'), assert = require('node:assert/strict');
const root = path.resolve(__dirname, '../../..');
const out = fs.mkdtempSync(path.join(os.tmpdir(), 'waykin-portable-math-'));
const bits = n => { const b = Buffer.alloc(8); b.writeDoubleBE(n); return b.toString('hex'); };
const value = h => Buffer.from(h, 'hex').readDoubleBE();
const sha = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const run = (cmd, args) => cp.execFileSync(cmd, args, {encoding:'utf8', maxBuffer:64*1024*1024});
run(path.join(root, 'packages/waykin-core-ts/node_modules/.bin/tsc'), [
  '--strict', '--target', 'ES2019', '--module', 'commonjs', '--outDir', out, path.join(__dirname, 'portableMath.ts')]);
const ts = require(path.join(out, 'portableMath.js'));
const functions = {sin: ts.portableSin, cos: ts.portableCos, atan2: ts.portableAtan2, sqrt: ts.portableSqrt, cbrt:ts.portableCbrt};
const rows = [], keys = new Set();
const add = (name, args, family) => {
  const encoded = args.map(bits), key = JSON.stringify([name, encoded]);
  if (!keys.has(key)) { keys.add(key); rows.push({name, bits: encoded, family}); }
};
const tracePath = path.join(path.resolve(process.argv[2]), 'inputs.json');
for (const row of JSON.parse(fs.readFileSync(tracePath))) if (functions[row.name])
  add(row.name, row.args.map(x => typeof x === 'string' && x.startsWith('bits:') ? value(x.slice(5)) : Number(x)), 'trace');
let seed = 0x4c495241;
const random = () => { seed = (Math.imul(seed,1664525) + 1013904223) >>> 0; return seed / 4294967296; };
for (let i = 0; i < 20000; i++) {
  const x = (random() * 4 - 2) * Math.PI;
  add('sin', [x], 'seeded'); add('cos', [x], 'seeded');
  const a = (random()*2-1) * 2 ** Math.floor(random()*2040-1020);
  const b = (random()*2-1) * 2 ** Math.floor(random()*2040-1020);
  add('atan2', [a,b], 'seeded'); add('sqrt', [Math.abs(a)], 'seeded');
  add('cbrt', [a], 'seeded');
}
const special = [0, -0, Number.MIN_VALUE, -Number.MIN_VALUE, Number.MAX_VALUE, -Number.MAX_VALUE,
  Infinity, -Infinity, NaN, 1, -1, Math.PI/4, -Math.PI/4, Math.PI/2, -Math.PI/2,
  Math.PI, -Math.PI, 2*Math.PI, -2*Math.PI, 0.41421356237309503];
for (const x of special) {
  for (const dx of [0, Number.EPSILON, -Number.EPSILON]) {
    add('sin', [dx === 0 ? x : x+dx], 'edge'); add('cos', [dx === 0 ? x : x+dx], 'edge');
  }
  add('sqrt', [x], 'edge');
  add('cbrt', [x], 'edge');
  for (const y of special) add('atan2', [y,x], 'edge');
}
const input = path.join(out, 'input.json'); fs.writeFileSync(input, JSON.stringify(rows));
const summary = {rows:rows.length, inputSHA256:sha(input), sourceHashes:{}, modes:{}, note:
  'Finite results and signed zero compare bit-exactly; NaN payloads are not part of the contract. Accuracy is sampled deviation from host libm, not proof of correct rounding.'};
for (const file of ['PortableMath.swift','portableMath.ts','PortableMathProbe.swift','test_portable_math.cjs'])
  summary.sourceHashes[file] = sha(path.join(__dirname, file));
const outputs = [];
for (const flag of ['-Onone','-O']) {
  const executable = path.join(out, flag.slice(1));
  run('swiftc', [flag, path.join(__dirname,'PortableMath.swift'), path.join(__dirname,'PortableMathProbe.swift'), '-o', executable]);
  const stdout = run(executable, [input]); fs.writeFileSync(executable+'.json', stdout);
  const native = JSON.parse(stdout); assert.equal(native.length,rows.length); outputs.push(native);
  const mismatches = [], stats = {};
  rows.forEach((row,i) => {
    assert.deepEqual(native[i].bits, row.bits, 'Input bit corruption');
    const args = row.bits.map(value), js = functions[row.name](...args), swift = value(native[i].result);
    const s = stats[row.name] ??= {cases:0, exactMismatches:0, maximumDeviationFromJS:0, maximumDeviationFromSwift:0, maximumRelativeDeviationFromJS:0};
    s.cases++;
    if (!(Number.isNaN(js) && Number.isNaN(swift)) && bits(js) !== native[i].result) {
      s.exactMismatches++; mismatches.push({...row, js:bits(js), swift:native[i].result});
    }
    const baseline = Math[row.name](...args), swiftBaseline = value(native[i].native);
    if (Number.isFinite(js) && Number.isFinite(baseline) && baseline !== 0)
      s.maximumRelativeDeviationFromJS = Math.max(s.maximumRelativeDeviationFromJS, Math.abs((js-baseline)/baseline));
    if (Number.isFinite(js) && Number.isFinite(baseline)) s.maximumDeviationFromJS = Math.max(s.maximumDeviationFromJS, Math.abs(js-baseline));
    if (Number.isFinite(swift) && Number.isFinite(swiftBaseline)) s.maximumDeviationFromSwift = Math.max(s.maximumDeviationFromSwift,Math.abs(swift-swiftBaseline));
    if ((row.name === 'sin' || row.name === 'cos') && (!Number.isFinite(args[0]) || Math.abs(args[0]) > 2*Math.PI)) {
      assert.ok(Number.isNaN(js) && Number.isNaN(swift), 'Out-of-domain trigonometry must fail explicitly');
    } else if (Number.isFinite(baseline)) {
      assert.ok(Number.isFinite(js) && Number.isFinite(swift), 'In-domain finite result missing');
      if (row.name === 'cbrt') assert.ok(Math.abs(js-baseline) <= 2e-15*Math.abs(baseline) && Math.abs(swift-swiftBaseline) <= 2e-15*Math.abs(swiftBaseline), 'Cube root relative accuracy sanity gate');
      else if (row.name !== 'sqrt') assert.ok(Math.abs(js-baseline) <= 2e-15 && Math.abs(swift-swiftBaseline) <= 2e-15, 'Research primitive accuracy sanity gate');
    }
  });
  fs.writeFileSync(executable+'-mismatches.json',JSON.stringify(mismatches));
  summary.modes[flag] = stats;
}
assert.deepEqual(outputs[0].map(r=>r.result),outputs[1].map(r=>r.result),'Swift optimization changed result bits');
summary.acceptance = Object.values(summary.modes).every(mode=>Object.values(mode).every(s=>s.exactMismatches===0))
  ? 'EXACT_FOR_CORPUS_ONLY' : 'EXACT_PARITY_FAILED';
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(summary,null,2)+'\n');
console.log(JSON.stringify({outputDirectory:out,...summary},null,2));
process.exitCode = summary.acceptance === 'EXACT_PARITY_FAILED' ? 2 : 0;
