// node test_selfcontained_processor.cjs <original pure-Swift replay directory>
// Uses verified exact-bit Swift evidence, not rewritten expected values.
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),prior=path.resolve(process.argv[2]);
const out=fs.mkdtempSync(path.join(os.tmpdir(),'waykin-selfcontained-processor-'));
console.error('Research output: '+out);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run=(cmd,args)=>cp.execFileSync(cmd,args,{encoding:'utf8',maxBuffer:32*1024*1024});
const bits=n=>{const b=Buffer.alloc(8);b.writeDoubleBE(n);return 'bits:'+b.toString('hex');};
const decode=(_,v)=>typeof v==='string'&&v.startsWith('bits:')?Buffer.from(v.slice(5),'hex').readDoubleBE():v;
const originalReport=JSON.parse(fs.readFileSync(path.join(prior,'report.json')));
const verified=JSON.parse(fs.readFileSync(path.join(root,'docs/design/receipts/HISTORY_SCOPED_LIFECYCLE_20261013.json'))).runs[0].report.historicalRegression;
assert.equal(sha(path.join(prior,'swift.json')),verified.outputSHA256,'Swift baseline differs from independently replayed receipt');
assert.equal(sha(path.join(prior,'swift-input.json')),verified.inputSHA256,'Exact corpus drift');
for(const f of ['PortableMath.swift','PortableGeodesic.swift'])assert.equal(sha(path.join(__dirname,f)),originalReport.harnessSHA256[f]);
const source=path.join(root,'packages/waykin-core-ts/src/movementIntegrity.ts');
assert.equal(sha(source),originalReport.tsSourceSHA256,'Processor source changed');
assert.equal(sha(path.join(root,'Sources/WaykinCore/Location/MovementIntegrity.swift')),originalReport.swiftSourceSHA256);
const body=fs.readFileSync(source,'utf8'),seam='const distance = movementDistanceMeters(this.anchor, sample);';
assert.equal(body.split(seam).length,2,'Missing or ambiguous instrumentation seam');
fs.writeFileSync(path.join(out,'movementIntegrity.ts'),'import { portableDistance } from "./portableGeodesic.js";\n'+body.replace(seam,
  'const distance = portableDistance(this.anchor.latitude, this.anchor.longitude, sample.latitude, sample.longitude);'));
for(const f of ['portableMath.ts','portableGeodesic.ts'])fs.copyFileSync(path.join(__dirname,f),path.join(out,f));
fs.mkdirSync(path.join(out,'empty-types'));
run(path.join(root,'packages/waykin-core-ts/node_modules/.bin/tsc'),['--strict','--noUncheckedIndexedAccess','--target','ES2019','--lib','ES2019',
  '--typeRoots',path.join(out,'empty-types'),'--module','commonjs','--outDir',path.join(out,'js'),
  ...['movementIntegrity.ts','portableMath.ts','portableGeodesic.ts'].map(f=>path.join(out,f))]);
const {MovementIntegrityProcessor}=require(path.join(out,'js/movementIntegrity.js'));
const input=JSON.parse(fs.readFileSync(path.join(prior,'swift-input.json')),decode);
const swift=JSON.parse(fs.readFileSync(path.join(prior,'swift.json')),decode);
assert.equal(input.sequences.length,10752);assert.equal(swift.sequences.length,input.sequences.length);
const mismatches=[];let steps=0;
const projection=s=>({sampleInterval:s.sampleInterval,distanceDelta:s.distanceDelta,isMoving:s.isMoving,
  hasPoint:s.point!==null,speed:s.diagnostic.derivedSpeedMetersPerSecond,disposition:s.diagnostic.disposition,
  accuracyBucket:s.diagnostic.accuracyBucket,accumulatedDistance:s.diagnostic.accumulatedDistance});
for(const [index,sequence] of input.sequences.entries()) {
  const native=swift.sequences[index];assert.equal(native.id,sequence.id);assert.equal(native.candidate.length,sequence.steps.length);
  const processor=new MovementIntegrityProcessor();
  sequence.steps.forEach((s,i)=>{
    if(s.reset)processor.resetAnchor();
    const actual=projection(processor.process({timestamp:s.timestamp,latitude:s.latitude,longitude:s.longitude,
      horizontalAccuracy:s.accuracy,reportedSpeedMetersPerSecond:Number(s.reportedSpeed)},s.receivedAt));
    const expected=native.candidate[i];steps++;
    const fields=[...new Set([...Object.keys(actual),...Object.keys(expected)])].filter(k=>!Object.is(actual[k],expected[k]));
    if(fields.length)mismatches.push({sequence:sequence.id,step:i,fields,actual,expected});
  });
}
assert.equal(steps,172032);
const report={head:run('git',['-C',root,'rev-parse','HEAD']).trim(),sequences:input.sequences.length,steps,
  exactMismatchSteps:mismatches.length,acceptance:mismatches.length?'EXACT_PARITY_FAILED':'EXACT_FOR_CORPUS_ONLY',
  sourceHashes:Object.fromEntries(['portableMath.ts','portableGeodesic.ts','test_selfcontained_processor.cjs'].map(f=>[f,sha(path.join(__dirname,f))])),
  processorSHA256:sha(source),swiftInputSHA256:verified.inputSHA256,swiftOutputSHA256:verified.outputSHA256,
  compiler:'strict + noUncheckedIndexedAccess, ES2019 target/library, empty ambient type roots',node:process.version,
  limitations:['Recorded Swift baseline validated against full-replay receipt; no Swift rerun in this command',
    'No Lens execution or production adoption','Processor projections, not full experience state']};
fs.writeFileSync(path.join(out,'mismatches.json'),JSON.stringify(mismatches,(_,v)=>typeof v==='number'?bits(v):v));
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({outputDirectory:out,...report},null,2));process.exitCode=mismatches.length?2:0;
