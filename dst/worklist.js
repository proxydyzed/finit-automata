export class WorkList {
  buffer;
  index = 0;

  constructor(buffer) {
    this.buffer = buffer;
  }

  *[Symbol.iterator]() {
    while (this.buffer.length > this.index) {
      this.index++;
      yield this.buffer.at(this.index - 1);
    }
  }

  has(value) {
    return this.buffer.includes(value, this.index);
  }

  add(value) {
    this.buffer.push(value);
  }
}
