// Research only. Usage: node compare_geodesic.cjs <Swift JSON> <GeographicLib JS>
// The third-party implementation stays outside production and the lockfile.
const fs = require('node:fs');
const path = require('node:path');
const rows = JSON.parse(fs.readFileSync(process.argv[2], 'utf8'));
const libraryPath = path.resolve(process.argv[3]);
const geo = require(libraryPath);
const crypto = require('node:crypto');
const stats = { cases: rows.length, librarySHA256: crypto.createHash('sha256')
  .update(fs.readFileSync(libraryPath)).digest('hex'), maximumErrorMeters: 0,
  aboveDistanceTolerance: 0, movingThresholdMismatches: 0, displacementThresholdMismatches: 0 };
let worst;
const thresholdExamples = [];
for (const row of rows) {
  const meters = geo.Geodesic.WGS84.Inverse(row.latitude, row.longitude, row.latitude2, row.longitude2).s12;
  if (!Number.isFinite(meters) || !Number.isFinite(row.appleMeters)) throw new Error('Nonfinite research result');
  const error = Math.abs(meters - row.appleMeters);
  if (error > stats.maximumErrorMeters) { stats.maximumErrorMeters = error; worst = { ...row, ellipsoidMeters: meters, error }; }
  if (error > 0.05) stats.aboveDistanceTolerance++;
  // Arithmetic decisions only, assuming one-second interval and no averaging.
  // Not a claim of full MovementIntegrityProcessor replay.
  if ((meters >= 0.55) !== (row.appleMeters >= 0.55)) stats.movingThresholdMismatches++;
  if ((meters >= 1.5) !== (row.appleMeters >= 1.5)) stats.displacementThresholdMismatches++;
  if (thresholdExamples.length < 4 && ((meters >= 0.55) !== (row.appleMeters >= 0.55)
    || (meters >= 1.5) !== (row.appleMeters >= 1.5))) thresholdExamples.push({ ...row, ellipsoidMeters: meters, error });
}
console.log(JSON.stringify({ stats, worst, thresholdExamples }, null, 2));
