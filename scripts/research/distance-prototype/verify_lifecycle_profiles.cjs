// node verify_lifecycle_profiles.cjs <cold-debug> <warm-debug> <cold-release> <warm-release>
// Verify persisted exact-bit outputs, not just reported mismatch totals.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const directories=process.argv.slice(2);assert.equal(directories.length,4);
const hash=s=>crypto.createHash('sha256').update(s).digest('hex');
const fileHash=p=>hash(fs.readFileSync(p));
const read=(dir,file)=>JSON.parse(fs.readFileSync(path.join(dir,file)));
const reports=directories.map(dir=>read(dir,'report.json'));
const profiles=['cold','warm-original-pairs','cold','warm-original-pairs'];
const outputs=directories.map(dir=>read(dir,'swift.json'));
const candidateHashes=[];
for(let i=0;i<4;i++) {
  const r=reports[i];assert.equal(r.historyProfile,profiles[i]);
  assert.equal(r.optimization,i<2?'-Onone':'-O');
  assert.equal(r.historicalRegression.status,'PASS');assert.equal(r.historicalRegression.decisionChanges,264);
  assert.equal(r.exactMismatchSteps,0);assert.equal(r.cases,64);assert.equal(r.steps,19264);
  assert.equal(r.coverage.results,128);assert.deepEqual(read(directories[i],'parity-mismatches.json'),[]);
  assert.equal(outputs[i].length,r.cases);
  for(const row of outputs[i])assert.equal(row.warmup.length,r.applePrefixCalls);
  assert.ok(i%2?r.applePrefixCalls>0:r.applePrefixCalls===0);
  candidateHashes.push(hash(JSON.stringify(outputs[i].map(row=>({id:row.id,candidate:row.candidate})))));
  assert.equal(candidateHashes[i],candidateHashes[0],'Candidate changed across history or optimization');
}
for(let i=0;i<2;i++)for(const file of ['input.json','swift.json','parity-mismatches.json','migration-mismatches.json','historical-swift.json'])
  assert.equal(fileHash(path.join(directories[i],file)),fileHash(path.join(directories[i+2],file)),file+' changed with optimization');
let appleHistoryChangedSteps=0;
for(let i=0;i<outputs[0].length;i++) {
  assert.equal(outputs[0][i].id,outputs[1][i].id);
  outputs[0][i].apple.forEach((row,j)=>{if(JSON.stringify(row)!==JSON.stringify(outputs[1][i].apple[j]))appleHistoryChangedSteps++;});
}
console.log(JSON.stringify({status:'PASS_FOR_SCOPED_CORPUS_ONLY',appleHistoryChangedSteps,candidateHashes,
  verifierSHA256:fileHash(__filename),runs:reports.map((r,i)=>({directory:directories[i],report:r,
    artifactHashes:Object.fromEntries(['input.json','swift.json','parity-mismatches.json','migration-mismatches.json','historical-swift.json']
      .map(file=>[file,fileHash(path.join(directories[i],file))]))}))},null,2));
