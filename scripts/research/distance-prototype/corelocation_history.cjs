// Diagnose whether the same binary and coordinate bits depend on earlier calls.
// node corelocation_history.cjs <processor probe> <exact swift-input.json> <pair id>
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),cp=require('node:child_process');
const assert=require('node:assert/strict'),crypto=require('node:crypto');
const [probe,inputFile,id]=process.argv.slice(2),input=JSON.parse(fs.readFileSync(inputFile));
const selected=input.pairs.find(p=>p.id===id);assert.ok(selected);
const index=input.pairs.indexOf(selected),out=fs.mkdtempSync(path.join(os.tmpdir(),'waykin-corelocation-history-'));
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const sequences=input.sequences.filter(s=>s.id===id+'-dt2');
const variants={alone:[selected],prefix:input.pairs.slice(0,index+1),
  allPairs:input.pairs,repeat:[selected,selected,selected],reversed:[...input.pairs].reverse()};
const rows={};
for(const [name,pairs] of Object.entries(variants)) {
  const file=path.join(out,name+'.json');fs.writeFileSync(file,JSON.stringify({pairs,sequences}));
  const result=JSON.parse(cp.execFileSync(probe,[file],{encoding:'utf8',maxBuffer:64*1024*1024}));
  rows[name]={distance:result.distances.filter(p=>p.id===id),step12:result.sequences[0]?.apple[12]};
}
const report={probeSHA256:sha(probe),inputSHA256:sha(inputFile),target:selected,rows};
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({outputDirectory:out,...report},null,2));
