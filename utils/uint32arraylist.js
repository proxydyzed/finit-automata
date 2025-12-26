import { ArrayListLike } from "./arraylist.js";

export class Uint32 {
  static max = 2 ** 31;

  static verify(value) {
    if (typeof value !== "number") {
      throw new TypeError(`Expected value to be a number, but got ${typeof value}`);
    }

    // if (0 > value || value >= this.max) {
    //   throw new Error(`Expected an uint32, but got ${String(value)}`);
    // }

    return Math.floor(value);
  }
};

export const Uint32ArrayListLike = ArrayListLike(Uint32);
