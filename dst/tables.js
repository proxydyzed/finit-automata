/**
 * @template Elem
 */
export class FixedColumnTable {
  buffer;
  cols;
  rows;
  
  /**
   * @param {number} columns
   * @param {() => Elem} init
   */
  constructor(columns, init) {
    this.cols = columns;
    this.rows = 0;
    this.buffer = Array.from({ length: 0 }, () => init());
  }

  get(pos) {
    const { row, col } = TablePosition.from(pos);
    const index = row * this.cols + col;

    if (this.buffer.length > index) {
      return this.buffer[index];
    }
    
    return null;
  }

  push(elem) {
    this.buffer.push(elem);
  }

  *[Symbol.iterator]() {
    for (let i = 0; i < this.buffer.length; i += this.cols) {
      yield takeBuffer(this.buffer, i, this.cols);
    }
  }
};

function* takeBuffer(buffer, offset, amount) {
  for (let i = 0; i < amount; i++) {
    yield buffer.at(offset + i);
  }
}

/**
 * @template Elem
 */
export class ValuePointer {
  deref;
  
  /**
   * @param {Elem} deref
   */
  constructor(deref) {
    this.deref = deref;
  }
};

export class TablePosition {
  row;
  col;
  
  /**
   * @param {number} row
   * @param {number} col
   */
  constructor(row, col) {
    this.row = row;
    this.col = col;
  }
  
  static from(inst) {
    if ("row" in inst) {
      if (typeof inst.row !== "number") {
        throw new TypeError(`Expected field "row" to be a number, but got ${typeof inst.row}`);
      }
    } else {
      throw new TypeError(`Expected a "row" field`);
    }
    if ("col" in inst) {
      if (typeof inst.col !== "number") {
        throw new TypeError(`Expected field "col" to be a number, but got ${typeof inst.col}`);
      }
    } else {
      throw new TypeError(`Expected a "col" field`);
    }
    
    return new this(inst.row, inst.col);
  }
}

// const table = new FixedColumnTable(3);
// table.allocRow();
// console.log(table);
// console.log(table.get({ row: 0, col: 0 }));
