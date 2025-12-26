export class IndentingWriter {
  buffer = "";
  indent = 0;

  writeAll(str) {
    this.buffer += str;
  }

  writeLine(str) {
    this.buffer += "  ".repeat(this.indent) + str + "\r\n";
  }

  writeIndent() {
    this.buffer += "  ".repeat(this.indent);
  }

  writeNewLine() {
    this.buffer += "\r\n";
  }

  string() {
    return this.buffer;
  }
}
