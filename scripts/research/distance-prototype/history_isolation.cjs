// node history_isolation.cjs <exact processor swift-input.json> <target pair id>
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const [inputFile,id]=process.argv.slice(2),input=JSON.parse(fs.readFileSync(inputFile));
const index=input.pairs.findIndex(p=>p.id===id);assert.ok(index>=0);
const target=input.pairs[index],out=fs.mkdtempSync(path.join(os.tmpdir(),'waykin-history-isolation-'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const run=(p,a)=>cp.execFileSync(p,a,{encoding:'utf8',maxBuffer:32*1024*1024});
console.error('Research output: '+out);
const source=['PortableMath.swift','PortableGeodesic.swift','HistoryIsolationProbe.swift'].map(f=>path.join(__dirname,f));
const variants={alone:[target],prefix:input.pairs.slice(0,index+1),allPairs:input.pairs,
  reversed:[...input.pairs].reverse(),repeat:[target,target,target]};
for(const [name,rows] of Object.entries(variants))fs.writeFileSync(path.join(out,name+'.json'),JSON.stringify(rows));
const report={inputSHA256:sha(inputFile),target,sourceHashes:Object.fromEntries(source.map(p=>[path.basename(p),sha(p)])),modes:{},
  node:process.version,swift:run('swift',['--version']).trim()};
report.sourceHashes['history_isolation.cjs']=sha(__filename);
for(const opt of ['-Onone','-O']) {
  const probe=path.join(out,opt.slice(1));run('swiftc',[opt,...source,'-o',probe]);
  const modes={};
  for(const mode of ['apple','mixed','candidatePrefix']) {
    modes[mode]={};
    for(const name of Object.keys(variants)) modes[mode][name]=JSON.parse(run(probe,[path.join(out,name+'.json'),mode,id]));
  }
  report.modes[opt]=modes;
}
assert.deepEqual(report.modes['-Onone'],report.modes['-O'],'Optimization changed isolation evidence');
const modes=report.modes['-Onone'];
const cold=modes.apple.alone[0].apple,expectedBits=['latitude','longitude','latitude2','longitude2'].map(k=>target[k].slice(5));
for(const [name,rows] of Object.entries(modes.apple)) {
  assert.deepEqual(rows.map(r=>r.apple),modes.mixed[name].map(r=>r.apple),'Candidate interleaving changed Apple results');
  for(const row of modes.candidatePrefix[name]) assert.equal(row.apple,cold,'Candidate-only prefix changed Apple result');
}
for(const modesByHistory of Object.values(modes)) for(const rows of Object.values(modesByHistory))
  for(const row of rows) assert.deepEqual(row.inputBits,expectedBits,'Input bit corruption');
for(const name of ['mixed','candidatePrefix']) for(const rows of Object.values(modes[name]))
  for(const row of rows) assert.equal(row.candidate,modes.mixed.alone[0].candidate,'Candidate depends on call history');
assert.notEqual(modes.apple.prefix[0].apple,cold,'Reported Apple-only dependency did not reproduce');
report.acceptance='ISOLATION_REPRODUCED_FOR_TARGET_ONLY';
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({outputDirectory:out,...report},null,2));
