// node test_portable_geodesic.cjs <pinned JS library> <prior replay directory>
const fs=require('node:fs'), path=require('node:path'), os=require('node:os');
const cp=require('node:child_process'), assert=require('node:assert/strict'), crypto=require('node:crypto');
const root=path.resolve(__dirname,'../../..'), out=fs.mkdtempSync(path.join(os.tmpdir(),'waykin-portable-geodesic-'));
console.error('Research output: '+out);
const run=(cmd,args)=>cp.execFileSync(cmd,args,{encoding:'utf8',maxBuffer:64*1024*1024});
const bits=x=>{const b=Buffer.alloc(8);b.writeDoubleBE(x);return b.toString('hex');};
const value=x=>Buffer.from(x,'hex').readDoubleBE();
const sha=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const jsFile=path.resolve(process.argv[2]), prior=path.resolve(process.argv[3]);
run(path.join(root,'packages/waykin-core-ts/node_modules/.bin/tsc'),['--strict','--noUncheckedIndexedAccess','--target','ES2019','--lib','ES2019','--module','commonjs','--outDir',out,path.join(__dirname,'portableMath.ts'),path.join(__dirname,'portableGeodesic.ts')]);
const standalone=require(path.join(out,'portableGeodesic.js')).portableDistance;
const portable=require('./portable_backend.cjs')(jsFile,require(path.join(out,'portableMath.js')));
const original=require(jsFile), g=portable.library.Geodesic;
const rows=JSON.parse(fs.readFileSync(path.join(prior,'input.json'))).pairs.map(p=>({id:p.id,args:[p.latitude,p.longitude,p.latitude2,p.longitude2].map(Number)}));
let seed=0x5741594b;
const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
const add=(id,args)=>rows.push({id,args});
for(let i=0;i<20000;i++) {
  const lat=random()*180-90,lon=random()*360-180, nearLon=lon<0?lon+180:lon-180;
  add('global-'+i,[lat,lon,random()*180-90,random()*360-180]);
  add('antipodal-'+i,[lat,lon,Math.max(-90,Math.min(90,-lat+(random()-.5)*.01)),Math.max(-180,Math.min(180,nearLon+(random()-.5)*.01))]);
}
for(const lat of [-90,-45,-30,-0,0,30,45,90]) for(const lon of [-180,-135,-90,-45,-0,0,45,90,135,180]) {
  add('angle-edge',[lat,lon,-lat,-lon]); add('identical-edge',[lat,lon,lat,lon]);
}
const input=path.join(out,'input.json');fs.writeFileSync(input,JSON.stringify(rows.map(r=>r.args.map(bits))));
const expected=rows.map(r=> {
  const x=r.args,valid=x.every(Number.isFinite)&&Math.abs(x[0])<=90&&Math.abs(x[2])<=90&&Math.abs(x[1])<=180&&Math.abs(x[3])<=180;
  if (!valid) return NaN;
  const result=g.WGS84.Inverse(...x,g.DISTANCE).s12;
  assert.ok(Number.isFinite(result)&&result>=0,'Missing valid-domain result: '+r.id);
  return result;
});
let maximumDeviationFromUnmodifiedJS=0;
rows.forEach((r,i)=>{if(Number.isFinite(expected[i])) {
  const native=original.Geodesic.WGS84.Inverse(...r.args,original.Geodesic.DISTANCE).s12;
  const error=Math.abs(expected[i]-native);maximumDeviationFromUnmodifiedJS=Math.max(maximumDeviationFromUnmodifiedJS,error);
  assert.ok(Number.isFinite(native)&&error<1e-6,'Independent geographic accuracy sanity gate: '+r.id);
}});
const report={cases:rows.length,inputSHA256:sha(input),node:process.version,swift:run('swift',['--version']).trim(),sourceHashes:{},maximumDeviationFromUnmodifiedJS,modes:{},primitiveCalls:portable.calls};
const standaloneValues=rows.map(r=>standalone(...r.args));
const standaloneMismatches=rows.flatMap((r,i)=>Object.is(standaloneValues[i],expected[i])?[]:
  [{id:r.id,args:r.args.map(bits),expected:bits(expected[i]),actual:bits(standaloneValues[i])}]);
fs.writeFileSync(path.join(out,'standalone-mismatches.json'),JSON.stringify(standaloneMismatches,null,2));
fs.writeFileSync(path.join(out,'standalone.json'),JSON.stringify(standaloneValues.map(bits)));
report.standalone={exactMismatches:standaloneMismatches.length,outputSHA256:sha(path.join(out,'standalone.json')),
  dependencies:['portableMath.ts'],compilation:'strict + noUncheckedIndexedAccess, ES2019 target/library, CommonJS'};
for(const file of ['PortableMath.swift','portableMath.ts','portableGeodesic.ts','PortableGeodesic.swift','PortableGeodesicProbe.swift','portable_backend.cjs','test_portable_geodesic.cjs']) report.sourceHashes[file]=sha(path.join(__dirname,file));
const outputs=[];
for(const flag of ['-Onone','-O']) {
  const executable=path.join(out,flag.slice(1));
  run('swiftc',[flag,path.join(__dirname,'PortableMath.swift'),path.join(__dirname,'PortableGeodesic.swift'),path.join(__dirname,'PortableGeodesicProbe.swift'),'-o',executable]);
  const stdout=run(executable,[input]);fs.writeFileSync(executable+'.json',stdout);
  const actual=JSON.parse(stdout);assert.equal(actual.length,rows.length);outputs.push(actual);
  const mismatches=[];
  rows.forEach((r,i)=>{if(!(Number.isNaN(expected[i])&&Number.isNaN(value(actual[i])))&&bits(expected[i])!==actual[i]) mismatches.push({...r,args:r.args.map(bits),expected:bits(expected[i]),actual:actual[i]});});
  fs.writeFileSync(executable+'-mismatches.json',JSON.stringify(mismatches,null,2));
  report.modes[flag]={exactMismatches:mismatches.length};
}
report.optimizationMismatches=outputs[0].filter((v,i)=>v!==outputs[1][i]&&!(Number.isNaN(value(v))&&Number.isNaN(value(outputs[1][i])))).length;
report.acceptance=standaloneMismatches.length===0&&Object.values(report.modes).every(s=>s.exactMismatches===0)&&report.optimizationMismatches===0?'EXACT_FOR_CORPUS_ONLY':'EXACT_PARITY_FAILED';
fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({outputDirectory:out,...report},null,2));
process.exitCode=report.acceptance==='EXACT_PARITY_FAILED'?2:0;
