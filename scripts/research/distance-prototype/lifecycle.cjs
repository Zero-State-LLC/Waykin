// Isolated lifecycle/downstream migration research, never writes production or canonical fixtures.
// node lifecycle.cjs <pinned JS library> <pure-Swift processor replay directory>
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),prior=path.resolve(process.argv[3]);
const out=fs.mkdtempSync(path.join(os.tmpdir(),'waykin-lifecycle-'));
console.error('Research output: '+out);
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const write=(p,s)=>fs.writeFileSync(path.join(out,p),s);
const run=(cmd,args)=>cp.execFileSync(cmd,args,{encoding:'utf8',maxBuffer:1024*1024*1024});
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const hashes={};
const once=(s,a,b)=>{assert.equal(s.split(a).length,2,'Ambiguous instrumentation seam');return s.replace(a,b);};
const bits=n=>{const b=Buffer.alloc(8);b.writeDoubleBE(n);return 'bits:'+b.toString('hex');};
const encode=(_,v)=>typeof v==='number'?bits(v):v;
const decode=(_,v)=>typeof v==='string'&&v.startsWith('bits:')?Buffer.from(v.slice(5),'hex').readDoubleBE():v;
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]);
const swift=[];
for(const source of files(path.join(root,'Sources/WaykinCore')).filter(p=>p.endsWith('.swift'))) {
  const rel=path.relative(root,source);hashes[rel]=sha(source);
  if(rel==='Sources/WaykinCore/Location/MovementIntegrity.swift') {
    write('MovementIntegrity.swift',once(fs.readFileSync(source,'utf8'),
      'CLLocation(latitude: lhs.latitude, longitude: lhs.longitude)\n            .distance(from: CLLocation(latitude: rhs.latitude, longitude: rhs.longitude))',
      'researchDistance(lhs, rhs)'));
    swift.push(path.join(out,'MovementIntegrity.swift'));
  } else swift.push(source);
}
// Reuse actual exporter projections, with no exporter execution or vector writes.
const projections=read('Sources/WaykinVectorExport/ExperienceVectors.swift');
const prefix=projections.slice(0,projections.indexOf('    static func writeExperienceVectors('));
assert.ok(prefix.includes('static func resultJSON('));
write('Projection.swift',prefix.replace('import WaykinCore\n','')+'}\n');
write('ProjectionBase.swift',`import Foundation
enum WaykinVectorExport {
 static func renderState(_ s: WorldState) -> [String: Any] {
  ["energy":s.energy,"pressure":s.pressure,"familiarity":s.familiarity,"bondLevel":s.bondLevel,
   "movementState":s.movementState.rawValue,"activeTime":s.activeTime]
 }
}
`);
for(const file of ['LifecycleProbe.swift','PortableMath.swift','PortableGeodesic.swift']) swift.push(path.join(__dirname,file));
swift.push(path.join(out,'Projection.swift'),path.join(out,'ProjectionBase.swift'));
const optimization=process.env.WAYKIN_SWIFT_OPT==='-O'?'-O':'-Onone';
run('swiftc',[optimization,...swift,'-o',path.join(out,'probe')]);
const tsDir=path.join(out,'ts');fs.mkdirSync(tsDir);
for(const source of files(path.join(root,'packages/waykin-core-ts/src')).filter(p=>p.endsWith('.ts'))) {
  hashes[path.relative(root,source)]=sha(source);
  let body=fs.readFileSync(source,'utf8');
  if(path.basename(source)==='movementIntegrity.ts') body='import {candidateDistance} from "./candidate.js";\n'+once(body,
    'const distance = movementDistanceMeters(this.anchor, sample);','const distance = candidateDistance(this.anchor, sample);');
  fs.writeFileSync(path.join(tsDir,path.basename(source)),body);
}
for(const f of ['candidate.ts','portableMath.ts']) fs.copyFileSync(path.join(__dirname,f),path.join(tsDir,f));
run(path.join(root,'packages/waykin-core-ts/node_modules/.bin/tsc'),['--strict','--target','ES2019','--module','commonjs','--outDir',path.join(out,'js'),...files(tsDir)]);
const backend=require('./portable_backend.cjs')(path.resolve(process.argv[2]),require(path.join(out,'js/portableMath.js')));
require(path.join(out,'js/candidate.js')).installResearchBackend(backend.library.Geodesic.WGS84);
const {MovementEngine}=require(path.join(out,'js/movementEngine.js'));
const {CompanionWalkExperience,makeExperienceContext}=require(path.join(out,'js/experience.js'));
const {parseU64}=require(path.join(out,'js/uint64.js'));
const previous=JSON.parse(fs.readFileSync(path.join(prior,'input.json')));
const changed=JSON.parse(fs.readFileSync(path.join(prior,'migration-mismatches.json')));
const selected=new Set(changed.filter(r=>r.fields.some(f=>['isMoving','accumulatedDistance'].includes(f)))
  .map(r=>r.sequence.replace(/-dt.*$/,'')));
const changedPairCount=selected.size;
for(const id of ['broad-0','broad-300','broad-800','broad-1000']) selected.add(id);
const cases=[];
for(const pair of previous.pairs.filter(p=>selected.has(p.id))) for(const dt of [.5,1,2,14]) {
  let time=10000;const steps=[];
  const op=(name)=>steps.push({op:name,time});
  const sample=(side,delta=dt,extra={})=>{time+=delta;steps.push({op:'sample',time,receivedAt:time,
    latitude:side?pair.latitude2:pair.latitude,longitude:side?pair.longitude2:pair.longitude,accuracy:5,speed:NaN,...extra});};
  op('pause');sample(0);op('start');op('start');sample(0);op('pause');op('resume');op('resume');sample(0);
  // Preserve every original processor counterexample, including smoothing order.
  // Reset is represented by actual lifecycle calls, not direct processor access.
  op('pause');op('resume');
  const original=previous.sequences.find(s=>s.id===pair.id+'-dt'+dt);
  assert.ok(original,'Missing original replay');
  const origin=original.steps[0].timestamp,base=time+dt;
  for(const s of original.steps) {
    time=base+(s.timestamp-origin);
    if(s.reset){op('pause');op('resume');}
    steps.push({op:'sample',time,receivedAt:base+(s.receivedAt-origin),latitude:s.latitude,
      longitude:s.longitude,accuracy:s.accuracy,speed:Number(s.reportedSpeed),original:true});
  }
  for(let i=0;i<240;i++) {
    if(i===80||i===160) {op('pause');sample(1);op('pause');time+=30;op('resume');sample(0);}
    sample(i%2,dt,i%23===0?{speed:1.2}:{});
    if(i%37===0) sample(1,dt,{accuracy:31});
    if(i%53===0) sample(0,0);
    if(i===120) sample(0,16);
    if(i===180) sample(1,dt,{receivedAt:time+dt+16});
  }
  op('end');sample(1);op('end');op('start');op('resume');sample(1);sample(0);op('end');
  cases.push({id:pair.id+'-dt'+dt,timeOfDay:cases.length%2?'night':'day',seed:cases.length%2?'18446744073709551615':'42',steps});
}
assert.equal(cases.length,selected.size*4,'Missing selected pair');
write('input.json',JSON.stringify(cases,encode));
const stdout=run(path.join(out,'probe'),[path.join(out,'input.json')]);write('swift.json',stdout);
const native=JSON.parse(stdout,decode);assert.equal(native.length,cases.length);
const point=p=>p?{...p,altitude:p.altitude??null}:null;
const session=s=>s?{activityType:s.activityType,experienceID:s.experienceID,startedAt:s.startedAt,endedAt:s.endedAt,
  elapsedTime:s.elapsedTime,activeTime:s.activeTime,distanceMeters:s.distanceMeters,currentSpeedMetersPerSecond:s.currentSpeedMetersPerSecond,
  averageSpeedMetersPerSecond:s.averageSpeedMetersPerSecond,movementState:s.movementState,routeCount:s.routePoints.length,lastPoint:point(s.routePoints.at(-1))}:null;
function replay(input) {
  let time=0;const engine=new MovementEngine(()=>time,()=> 'research-identity'),experience=new CompanionWalkExperience();
  const context=makeExperienceContext({timeOfDay:input.timeOfDay,activity:'walk',bondLevel:12,eventSeed:parseU64(input.seed)});
  let state=experience.start(context);
  return input.steps.map(step=> {
    time=step.time;let error=null,update=null,result=null,ended=null,diagnostic=null,snapshot=null,endedRoute=null;
    try {
      switch(step.op) {
        case 'start':engine.startSession('walk','companion_walk');state=experience.start(context);break;
        case 'pause':engine.pauseSession();break;
        case 'resume':engine.resumeSession();break;
        case 'end':{const s=engine.endSession();ended=session(s);endedRoute=s.routePoints.map(point);result=experience.finish(state,s);break;}
        case 'sample':{
          const r=engine.ingestRealLocationSample({timestamp:time,latitude:step.latitude,longitude:step.longitude,
            horizontalAccuracy:step.accuracy,reportedSpeedMetersPerSecond:step.speed},step.receivedAt);
          diagnostic=r.diagnostic;snapshot=r.snapshot;
          if(snapshot){update=experience.update(state,snapshot,context);state=update.state;}break;
        }
        default:throw new Error('Unknown operation');
      }
    }catch(e){if(!e.code)throw e;error=e.code==='invalidTransition'?`${e.code}:${e.from}:${e.to}`:e.code;}
    return {error,session:session(engine.currentSession),ended,endedRoute,result,diagnostic,snapshot,update,
      experience:state,accepted:engine.acceptedSampleCount,rejected:engine.rejectedSampleCount};
  });
}
function differences(a,b,p='') {
  if(Object.is(a,b)||(Number.isNaN(a)&&Number.isNaN(b)))return [];
  if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return [p];
  return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>differences(a[k],b[k],p?p+'.'+k:k));
}
const parity=[],migration=[],counts={},coverage={errors:{},dispositions:{},events:{},results:0};let steps=0,retainedDecisionChanges=0;
for(const [index,input] of cases.entries()) {
  const js=replay(input),sw=native[index];assert.equal(sw.id,input.id);
  assert.equal(sw.candidate.length,input.steps.length);assert.equal(sw.apple.length,input.steps.length);
  for(let i=0;i<js.length;i++) {
    steps++;const row=js[i];
    if(row.error)coverage.errors[row.error]=(coverage.errors[row.error]||0)+1;
    if(row.diagnostic)coverage.dispositions[row.diagnostic.disposition]=(coverage.dispositions[row.diagnostic.disposition]||0)+1;
    for(const kind of row.update?.narrativeEvents??[])coverage.events[kind]=(coverage.events[kind]||0)+1;
    if(row.result)coverage.results++;
    const exact=differences(sw.candidate[i],row),changes=differences(sw.apple[i],sw.candidate[i]);
    if(input.steps[i].original&&changes.some(p=>['snapshot.isMoving','diagnostic.accumulatedDistance'].includes(p)))retainedDecisionChanges++;
    if(exact.length)parity.push({id:input.id,step:i,paths:exact,swift:sw.candidate[i],js:row});
    if(changes.length){migration.push({id:input.id,step:i,paths:changes});for(const p of changes)counts[p]=(counts[p]||0)+1;}
    if(input.steps[i].op==='sample'&&i===1)assert.equal(row.diagnostic.disposition,'rejectedStopped');
    if(row.diagnostic&&['rejectedPaused','rejectedStopped'].includes(row.diagnostic.disposition)) {
      assert.equal(row.snapshot,null);assert.equal(row.update,null);
      if(i>0)assert.deepEqual(row.experience,js[i-1].experience,'Rejected lifecycle sample advanced experience');
    }
  }
}
for(const key of ['rejectedStopped','rejectedPaused','awaitingFreshAnchor','accepted','rejectedAccuracy','rejectedDuplicate','rejectedStale'])
  assert.ok(coverage.dispositions[key]>0,'Missing disposition coverage: '+key);
assert.ok(coverage.results===cases.length*2,'Missing session-finish results');
const originalDecisionChanges=changed.filter(r=>r.fields.some(f=>['isMoving','accumulatedDistance'].includes(f))).length;
const report={head:run('git',['-C',root,'rev-parse','HEAD']).trim(),optimization,changedPairCount,selectedPairs:[...selected],cases:cases.length,steps,
  retainedDecisionChanges,expectedOriginalDecisionChanges:originalDecisionChanges,
  migrationGate:retainedDecisionChanges===originalDecisionChanges?'ORIGINAL_DECISIONS_RETAINED':'FAILED_CALL_HISTORY_DEPENDENCY',
  exactMismatchSteps:parity.length,migrationChangedSteps:migration.length,migrationPaths:counts,coverage,
  inputSHA256:sha(path.join(out,'input.json')),sourceHashes:hashes,primitiveCalls:backend.calls,
  acceptance:parity.length?'EXACT_PARITY_FAILED':'EXACT_FOR_CORPUS_ONLY',
  limitations:['No Lens/device execution','Session random UUID excluded; route values and full ended route compared',
    'In-memory finish results only, not persistence or physical audio','Migration stress corpus, not field incidence','No production adoption authorized']};
for(const f of ['LifecycleProbe.swift','lifecycle.cjs','PortableMath.swift','PortableGeodesic.swift','portableMath.ts','portable_backend.cjs'])report.sourceHashes[f]=sha(path.join(__dirname,f));
report.sourceHashes['Sources/WaykinVectorExport/ExperienceVectors.swift']=sha(path.join(root,'Sources/WaykinVectorExport/ExperienceVectors.swift'));
write('parity-mismatches.json',JSON.stringify(parity,encode));write('migration-mismatches.json',JSON.stringify(migration));
write('report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({outputDirectory:out,...report},null,2));process.exitCode=parity.length?2:0;
// Persist evidence BEFORE failing; never erase the lost-counterexample gate.
assert.equal(retainedDecisionChanges,originalDecisionChanges,'Original decision-changing counterexamples were lost; audit CoreLocation call history');
