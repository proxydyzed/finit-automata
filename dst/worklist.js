/**
 * @template Work
 */
export class WorkList {
  buffer;
  index = 0;
  
  /**
   * @param {Work[]} buffer
   */
  constructor(buffer) {
    this.buffer = buffer;
  }

  *[Symbol.iterator]() {
    while (this.buffer.length > this.index) {
      this.index++;
      yield this.buffer.at(this.index - 1);
    }
  }
  
  *iter() {
    while (this.buffer.length > this.index) {
      this.index++;
      yield this.buffer[this.index - 1];
    }
  }

  has(value) {
    return this.buffer.includes(value, this.index);
  }

  add(value) {
    this.buffer.push(value);
  }
}
