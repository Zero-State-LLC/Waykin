// Only the isolated research harness uses this adapter; no production import.
const fs = require('node:fs'), vm = require('node:vm'), crypto = require('node:crypto');
module.exports = (file, primitives) => {
  const source = fs.readFileSync(file, 'utf8');
  const sha = crypto.createHash('sha256').update(source).digest('hex');
  if (sha !== '06e3512904b346575f475f14d0b27ea0979dbcd2b0eddebf5f1eeefd234395b5')
    throw new Error('Unreviewed GeographicLib JS dependency');
  const math = Object.create(Math), calls = {};
  for (const name of ['sin','cos','atan2','sqrt','cbrt']) {
    const fn = primitives['portable' + name[0].toUpperCase() + name.slice(1)];
    math[name] = (...args) => {
      const s = calls[name] ??= {count:0, maximumAbsoluteArgument:0}; s.count++;
      s.maximumAbsoluteArgument = Math.max(s.maximumAbsoluteArgument,...args.map(Math.abs));
      if ((name === 'sin' || name === 'cos') && (!Number.isFinite(args[0]) || Math.abs(args[0]) > 2*Math.PI))
        throw new Error('Portable trigonometry domain exceeded');
      return fn(...args);
    };
  }
  const context = {Math:math, module:{exports:{}}, exports:{}};
  vm.runInNewContext(source, context, {filename:file});
  return {library:context.module.exports, calls};
};
