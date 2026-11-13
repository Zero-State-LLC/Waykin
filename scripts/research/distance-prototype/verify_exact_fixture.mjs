// Research only: strengthen the unchanged movement fixture test to exact distance too.
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
const {MovementIntegrityProcessor}=await import(pathToFileURL(process.argv[2]).href);
const vector=JSON.parse(fs.readFileSync(process.argv[3],'utf8'));
const decode=value=>typeof value==='string'&&['NaN','Infinity','-Infinity'].includes(value)?Number(value):value;
const processor=new MovementIntegrityProcessor();
assert.ok(vector.steps.length>0,'Empty fixture');
for(const [index,step] of vector.steps.entries()) {
  assert.equal(step.index,index);
  if(step.resetBefore)processor.resetAnchor();
  const sample=Object.fromEntries(Object.entries(step.sample).map(([k,v])=>[k,decode(v)]));
  const actual=processor.process(sample,step.receivedAt);
  assert.deepEqual(actual,step.expected,'Exact movement mismatch at step '+index);
}
console.log(JSON.stringify({status:'EXACT_FOR_FIXTURE_ONLY',steps:vector.steps.length,distanceToleranceUsed:false}));
