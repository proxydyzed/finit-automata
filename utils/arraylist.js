export function ArrayListLike(TypeArg) {
  if ("verify" in TypeArg) {
    if (typeof TypeArg.verify !== "function") {
      throw new TypeError(`Expected TypeArg.verify to be a function`);
    }
  } else {
    throw new TypeError(`Expected a "verify" field in TypeArg`);
  }

  return class ArrayList {
    buffer = [];
    current = 0;

    static TypeArg = TypeArg;

    get length() {
      throw new Error("Stupid");
    }

    setSize(size) {
      if (typeof size !== "number") {
        throw new TypeError(`Expected length to be a number, but got ${typeof size}`);
      }

      if (0 > size || size > this.buffer.length) {
        throw new Error(`Can not set length out of bound`);
      }

      this.current = size;
    }

    getSize() {
      return this.current;
    }

    slice(from, to) {
      return ArrayListSlice.from({
        buffer: this.buffer,
        from: from,
        to: to,
      });
    }

    append(value) {
      const verified = TypeArg.verify(value);
      this.appendAssumeType(verified);
    }

    appendAssumeType(value) {
      if (this.current < this.buffer.length) {
        this.buffer[this.current] = value;
        this.current++;
      } else {
        this.buffer.push(value);
        this.current++;
      }
    }

    detach() {
      if (this.current === 0) {
        throw new Error(`Can not pop from empty buffer`);
      }

      this.current--;
      const value = this.buffer.at(this.current);
      return value;
    }

    appendArray(values) {
      if (!Array.isArray(values)) {
        throw new TypeError(`Expected an array, but got ${
          typeof values === "object" ? (values === null ? "null" : values.constructor?.name ?? "object") : typeof values
        }`);
      }

      for (const value of values) {
        this.append(value);
      }
    }

    appendSlice(slice) {
      for (let i = slice.start; i < slice.end; i++) {
        this.append(slice.buffer.at(i));
      }
    }

    at(index) {
      if (typeof index !== "number") {
        throw new TypeError(`Expected index to be a number, but got ${typeof index}`);
      }

      if (index >= this.buffer.length || index + this.buffer.length < 0) {
        throw new RangeError(`Index (${index}) is outside of buffer length (${this.buffer.length})`);
      }

      return this.buffer.at(index);
    }

    set(index, value) {
      if (typeof index !== "number") {
        throw new TypeError(`Expected index to be a number, but got ${typeof index}`);
      }

      if (index >= this.buffer.length || index + this.buffer.length < 0) {
        throw new RangeError(`Index (${index}) is outside of buffer length (${this.buffer.length})`);
      }

      const verified = TypeArg.verify(value);
      this.buffer[index] = verified;
    }

    *[Symbol.iterator]() {
      for (let i = 0; i < this.current; i++) {
        yield this.buffer.at(i);
      }
    }
  };
};

export class ArrayListSlice {
  buffer;
  start;
  end;

  constructor(buffer, start, end) {
    this.buffer = buffer;
    this.start  = start;
    this.end    = end;
  }

  getSize() {
    return this.end - this.start;
  }

  at(index) {
    if (typeof index !== "number") {
      throw new TypeError(`Expected index to be a number, but got ${typeof index}`);
    }

    const offset = this.start + index;

    if (offset >= this.buffer.length || offset + this.buffer.length < 0) {
      throw new RangeError(`Index (${offset}) is outside of buffer length (${this.buffer.length})`);
    }

    return this.buffer.at(offset);
  }

  *[Symbol.iterator]() {
    for (let i = this.start; i < this.end; i++) {
      yield this.buffer.at(i);
    }
  }

  *reverseIterator() {
    for (let i = this.end - 1; i >= this.start; i--) {
      yield this.buffer.at(i);
    }
  }

  // static empty() {
  //   return new ArrayListSlice(null, 0, 0);
  // }

  static from(slice) {
    if ("buffer" in slice) {
      if (typeof slice.buffer !== "object") {
        throw new TypeError(`Expected slice.buffer to be a object, but got ${typeof slice.buffer}`);
      }
      if (slice.buffer === null) {
        throw new TypeError(`slice.buffer can not be null`);
      }
    } else {
      throw new TypeError("Expected a \"buffer\" field");
    }

    if ("from" in slice) {
      if (typeof slice.from !== "number") {
        throw new TypeError(`Expected slice.from to be a number, but got ${typeof slice.from}`);
      }
    } else {
      throw new TypeError("Expected a \"from\" field");
    }

    if ("to" in slice) {
      if (typeof slice.to !== "number") {
        throw new TypeError(`Expected slice.to to be a number, but got ${typeof slice.to}`);
      }
    } else {
      throw new TypeError("Expected a \"to\" field");
    }

    if (slice.from > slice.to) {
      throw new RangeError(`Invalid range, from (${slice.from}) > to (${slice.to})`);
    }

    if (slice.from < 0) {
      throw new RangeError(`Invalid range, from (${slice.from}) < 0`);
    }

    if (slice.to > slice.buffer.length) {
      throw new RangeError(`Invalid range, slice.to (${slice.to}) > slice.buffer.length (${slice.buffer.length})`);
    }

    return new this(slice.buffer, slice.from, slice.to);
  }
};

// try {
//   const slice = ArrayListSlice.from({
//     buffer: [],
//     from: 0,
//     to: 0,
//   });
// } catch (error) {
//   console.error(error);
// }

// const slice = new ArrayListSlice([1, 2, 3, 4, 5, 6], 1, 3);
// for (const elem of slice) {
//   console.log(elem);
// }
