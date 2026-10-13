/** SplitMix64, matching Swift WaykinCore's wrapping UInt64 operations. */
import { type U64, U64_ZERO, U64_ONE, add, eq, mul, parseU64, shr, xor } from "./uint64.js";

const GOLDEN_RATIO = parseU64("11400714819323198485");
const MUL_1 = parseU64("13787848793156543929");
const MUL_2 = parseU64("10723151780598845931");
export const SPLITMIX_GOLDEN_RATIO: U64 = GOLDEN_RATIO;

export interface RngLike {
  next(): U64;
  clone(): RngLike;
}

export function splitmix64Next(state: U64): readonly [U64, U64] {
  const nextState = add(state, GOLDEN_RATIO);
  let z = nextState;
  z = mul(xor(z, shr(z, 30)), MUL_1);
  z = mul(xor(z, shr(z, 27)), MUL_2);
  return [nextState, xor(z, shr(z, 31))];
}

export class SeededRandomNumberGenerator implements RngLike {
  private state: U64;

  constructor(seed: U64) {
    this.state = eq(seed, U64_ZERO) ? GOLDEN_RATIO : seed;
  }

  next(): U64 {
    const [newState, out] = splitmix64Next(this.state);
    this.state = newState;
    return out;
  }

  clone(): SeededRandomNumberGenerator {
    const copy = new SeededRandomNumberGenerator(U64_ONE);
    copy.state = this.state;
    return copy;
  }
}
