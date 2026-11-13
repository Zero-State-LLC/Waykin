// Research only: disposable candidate package + actual Swift exporter + unchanged tests.
// node scripts/research/distance-prototype/test_fixture_integration.cjs
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'),out=fs.mkdtempSync(path.join(os.tmpdir(),'waykin-fixture-integration-'));
const project=path.join(out,'candidate'),pkg=path.join(project,'packages/waykin-core-ts');
console.error('Research output: '+out);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const files=dir=>fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?files(path.join(dir,e.name)):[path.join(dir,e.name)]).sort();
const git=args=>cp.execFileSync('git',['-C',root,...args],{encoding:'utf8'}).trim();
const tracked=git(['ls-files']).split('\n');
const selected=tracked.filter(p=>p==='Package.swift'||/^(Sources\/(WaykinCore|WaykinVectorExport)\/|Demo\/|Tests\/WaykinCoreTests\/|specs\/001-spectacles-lira-walk\/contracts\/|packages\/waykin-core-ts\/(src\/|test\/|scripts\/|package(?:-lock)?\.json$|tsconfig[^/]*\.json$))/.test(p));
const frozen=[...new Set([...selected,...tracked.filter(p=>p.startsWith('Tests/Vectors/'))])].sort();
const before=Object.fromEntries(frozen.map(p=>[p,sha(path.join(root,p))]));
const report={base:git(['rev-parse','HEAD']),outputDirectory:out,node:process.version,stages:[],sourceHashes:before,
  researchHashes:Object.fromEntries(['PortableMath.swift','PortableGeodesic.swift','portableMath.ts','portableGeodesic.ts','test_fixture_integration.cjs','verify_exact_fixture.mjs'].map(p=>[p,sha(path.join(__dirname,p))])),
  acceptance:'RUNNING',limitations:['Research candidate integration only; no canonical fixture replacement',
    'No Lens/device execution or production adoption','Existing fixture coverage is not complete gameplay coverage']};
const persist=()=>fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
function command(label,cmd,args,cwd=project,extraEnv={},collectFailure=false) {
  console.error(label);
  const result=cp.spawnSync(cmd,args,{cwd,env:{...process.env,...extraEnv},encoding:'utf8',maxBuffer:64*1024*1024});
  const log=path.join(out,label+'.log');fs.writeFileSync(log,(result.stdout||'')+(result.stderr||''));
  report.stages.push({label,command:[cmd,...args],cwd,status:result.status,signal:result.signal,
    error:result.error?.message,logSHA256:sha(log)});persist();
  if(!collectFailure)assert.equal(result.status,0,label+' failed; see '+log);
  return result.stdout;
}
const replaceOnce=(source,old,replacement)=>{assert.equal(source.split(old).length,2,'Missing or ambiguous distance seam');return source.replace(old,replacement);};
function hashes(dir) {return Object.fromEntries(files(dir).map(p=>[path.relative(dir,p),sha(p)]));}
function changes(a,b,p='') {
  if(Object.is(a,b))return [];
  if(a===null||b===null||typeof a!=='object'||typeof b!=='object')return [{path:p,before:a,after:b}];
  return [...new Set([...Object.keys(a),...Object.keys(b)])].flatMap(k=>changes(a[k],b[k],p?p+'.'+k:k));
}
try {
  for(const rel of selected) {
    const dest=path.join(project,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,rel),dest);
  }
  fs.symlinkSync(path.join(root,'packages/waykin-core-ts/node_modules'),path.join(pkg,'node_modules'),'dir');
  const swiftFile=path.join(project,'Sources/WaykinCore/Location/MovementIntegrity.swift');
  fs.writeFileSync(swiftFile,replaceOnce(fs.readFileSync(swiftFile,'utf8'),
    'CLLocation(latitude: lhs.latitude, longitude: lhs.longitude)\n            .distance(from: CLLocation(latitude: rhs.latitude, longitude: rhs.longitude))',
    'PortableGeodesic.distance(lhs.latitude, lhs.longitude, rhs.latitude, rhs.longitude)'));
  for(const name of ['PortableMath.swift','PortableGeodesic.swift'])fs.copyFileSync(path.join(__dirname,name),path.join(project,'Sources/WaykinCore',name));
  const tsFile=path.join(pkg,'src/movementIntegrity.ts');
  fs.writeFileSync(tsFile,'import { portableDistance } from "./portableGeodesic.js";\n'+replaceOnce(fs.readFileSync(tsFile,'utf8'),
    'const distance = movementDistanceMeters(this.anchor, sample);',
    'const distance = portableDistance(this.anchor.latitude, this.anchor.longitude, sample.latitude, sample.longitude);'));
  for(const name of ['portableMath.ts','portableGeodesic.ts'])fs.copyFileSync(path.join(__dirname,name),path.join(pkg,'src',name));
  report.temporaryCoreHashes=hashes(path.join(project,'Sources/WaykinCore'));
  // Real, local-only source tree provenance for this disposable candidate.
  command('git-init','git',['init','-q']);
  command('git-stage-core','git',['add','Sources/WaykinCore']);
  command('git-record-core','git',['-c','user.name=Waykin Research','-c','user.email=research@example.invalid',
    '-c','commit.gpgsign=false','commit','-q','-m','Isolated candidate source provenance']);
  report.swiftTree=command('swift-tree','git',['rev-parse','HEAD:Sources/WaykinCore']).trim();
  assert.match(report.swiftTree,/^[0-9a-f]{40}$/);
  command('ts-typecheck','npm',['run','typecheck'],pkg);
  command('ts-lens-typecheck','npm',['run','typecheck:lens'],pkg);
  command('ts-isolation','npm',['run','isolation'],pkg);
  const swiftTests=command('swift-tests','swift',['test','--jobs','2']);
  // Full output is preserved in the stage log, including failures on stderr.
  report.swiftTestsSummary=swiftTests.split('\n').filter(s=>/Executed \d+ tests/.test(s)).slice(-2);
  assert.match(fs.readFileSync(path.join(out,'swift-tests.log'),'utf8'),/Executed 134 tests, with 0 failures/);
  const vectorRuns=['debug-first','debug-repeat','release'];
  const inventories=[];
  report.fullSuites=[];let allSuitesPass=true;
  for(const mode of vectorRuns) {
    const dir=path.join(out,mode);
    command('export-'+mode,'swift',['run','--jobs','2','-c',mode==='release'?'release':'debug','waykin-vectors','--out',dir,'--tree',report.swiftTree]);
    const inventory=hashes(dir);inventories.push(inventory);
    const families=fs.readdirSync(dir).sort();
    assert.deepEqual(families,['bond-memory','companion','demo','movement','pursuit','seed-event']);
    assert.equal(Object.keys(inventory).length,16,'Fixture count drift');
    for(const file of files(dir))assert.equal(JSON.parse(fs.readFileSync(file)).source.swiftTree,report.swiftTree);
    // Preserve all failures while collecting the remaining independent evidence.
    command('ts-tests-'+mode,'npm',['test'],pkg,{WAYKIN_VECTORS_DIR:dir,CI:'true'},true);
    const log=fs.readFileSync(path.join(out,'ts-tests-'+mode+'.log'),'utf8');
    const counts=Object.fromEntries(['tests','pass','fail','skipped'].map(k=>[k,Number(log.match(new RegExp('# '+k+' (\\d+)\\b'))?.[1])]));
    assert.equal(counts.tests,85,'Test inventory changed');assert.equal(counts.skipped,0,'Tests were skipped');
    allSuitesPass=allSuitesPass&&counts.pass===85&&counts.fail===0&&report.stages.at(-1).status===0;
    report.fullSuites.push({mode,...counts,failures:log.split('\n').filter(s=>s.startsWith('not ok ')||s.trim().startsWith('error:'))});
    command('family-replay-'+mode,'node',['--test',...['parity','companionParity','demoParity','experienceParity','movementParity','vectorInventory']
      .map(name=>'build/test/'+name+'.test.js')],pkg,{WAYKIN_VECTORS_DIR:dir,CI:'true'});
    const familyLog=fs.readFileSync(path.join(out,'family-replay-'+mode+'.log'),'utf8');
    assert.match(familyLog,/# fail 0\b/);assert.match(familyLog,/# skipped 0\b/);
    command('exact-movement-'+mode,'node',[path.join(__dirname,'verify_exact_fixture.mjs'),path.join(pkg,'build/src/movementIntegrity.js'),path.join(dir,'movement/integrity-sequence.json')]);
  }
  assert.deepEqual(inventories[0],inventories[1],'Repeated debug export changed');
  assert.deepEqual(inventories[0],inventories[2],'Optimized export changed');
  report.fixtureHashes=inventories[0];report.exportRuns=vectorRuns;
  report.fixturePayloadChanges=[];
  for(const rel of Object.keys(inventories[0])) {
    const old=JSON.parse(fs.readFileSync(path.join(root,'Tests/Vectors',rel)));
    const candidate=JSON.parse(fs.readFileSync(path.join(out,'debug-first',rel)));
    delete old.source.swiftTree;delete candidate.source.swiftTree;
    const delta=changes(old,candidate);
    if(delta.length)report.fixturePayloadChanges.push({file:rel,changes:delta});
  }
  assert.deepEqual(hashes(path.join(project,'Sources/WaykinCore')),report.temporaryCoreHashes,'Compiled Swift core changed');
  // Tests/config/exporter are unmodified; only the two named distance seams and helpers differ.
  for(const rel of selected.filter(p=>p.includes('/test/')||p.startsWith('Tests/WaykinCoreTests/')||p.startsWith('Sources/WaykinVectorExport/')||/tsconfig/.test(p)))
    assert.equal(sha(path.join(project,rel)),before[rel],'Test/config/exporter was modified: '+rel);
  report.fixtureReplay='PASS_ALL_SIX_FAMILIES';
  report.exactMovement='PASS_WITHOUT_DISTANCE_TOLERANCE';
  report.acceptance=allSuitesPass?'PASS_ISOLATED_CANDIDATE_ONLY':'FAILED_EXISTING_UNIT_TESTS';
  if(!allSuitesPass)process.exitCode=2;
} catch(error) {
  report.acceptance='FAILED';report.error=String(error);process.exitCode=2;
} finally {
  report.frozenFilesUnchanged=frozen.every(p=>sha(path.join(root,p))===before[p]);
  if(!report.frozenFilesUnchanged){report.acceptance='FAILED_FROZEN_FILE_CHECK';process.exitCode=2;}
  persist();console.log(JSON.stringify(report,null,2));
}
