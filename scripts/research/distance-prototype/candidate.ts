// Research only: no production imports or runtime dependency registration.
export interface Coordinate { latitude: number; longitude: number }
export interface Geodesic {
  Inverse(lat1: number, lon1: number, lat2: number, lon2: number): { s12: number };
}
let backend: Geodesic | undefined;
export function installResearchBackend(value: Geodesic): void { backend = value; }
export function candidateDistance(lhs: Coordinate, rhs: Coordinate): number {
  if (![lhs.latitude, lhs.longitude, rhs.latitude, rhs.longitude].every(Number.isFinite)
    || Math.abs(lhs.latitude) > 90 || Math.abs(rhs.latitude) > 90
    || Math.abs(lhs.longitude) > 180 || Math.abs(rhs.longitude) > 180) return NaN;
  if (!backend) throw new Error("Research geodesic backend not installed");
  return backend.Inverse(lhs.latitude, lhs.longitude, rhs.latitude, rhs.longitude).s12;
}
