import {
  AlphabetOffset,
  AlphabetReference,
  StartState,
} from "../nfa/export.js";

import {
  IndentingWriter,
  assert,
  // ArrayListLike,
  // Uint32ArrayListLike,
  // poisonPill,
} from "../utils/export.js";

import {
  Instruction,
  InstructionRefOffset,
} from "./instruction.js";

class Context {
  subset;
  ir;
  writer = new IndentingWriter();
  labelIndex = 0;
  labelMap = new Map();

  constructor(subset, ir) {
    this.subset = subset;
    this.ir  = ir;
  }

  getInst(instIndex) {
    return this.ir.instructions.at(instIndex - InstructionRefOffset);
  }

  newLabel(index) {
    this.labelIndex++;
    const label = `state${this.labelIndex - 1}`;
    this.labelMap.set(index, label);
    return label;
  }

  getLabel(index) {
    return this.labelMap.get(index) ?? "?";
  }

  getAlphaChar(alphaOffset) {
    return `'${JSON.stringify(this.subset.alphabets.at(alphaOffset)).slice(1, -1)}'`;
  }

  unpackStateData(inst) {
    const data = {
      reachable: false,
      token: inst.data.data1,
      edges: -1,
      edgesLength: 0,
    };

    switch (inst.tag) {
      case Instruction.Tag.stateAccepting: {
        break;
      }

      case Instruction.Tag.stateReachable:
        data.reachable = true;
        // fall through
      case Instruction.Tag.state:
        data.edges = inst.data.data2;
        data.edgesLength = this.ir.extra.at(data.edges);
        break;
    }

    return Instruction.State.from(data);
  }

  unpackEdgeData(inst) {
    const data = {
      recursive: false,
      instIndex: -1,
      alphabets: -1,
      alphabetsLength: 0,
    };

    switch (inst.tag) {
      case Instruction.Tag.edgeCircular:
        data.recursive = true;
        // fall through
      case Instruction.Tag.edge:
        data.instIndex = inst.data.data1;
        data.alphabets = inst.data.data2;
        data.alphabetsLength = this.ir.extra.at(data.alphabets);
        break;
    }

    return Instruction.Edge.from(data);
  }
}

export function runIr(subset, ir) {
  const ctx = new Context(subset, ir);
  const inst = ir.instructions.at(0);
  assert(inst.tag === Instruction.Tag.start, "Expected start instruction");

  const instIndex = inst.data.data1;

  // boilerplate1(ctx);
  // ctx.writer.writeLine("/*");
  run(ctx, instIndex, instIndex);
  // ctx.writer.writeLine("*/");
  // boilerplate2(ctx);

  return ctx.writer.string();
}

function run(ctx, instIndex, prevLabel) {
  const { writer } = ctx;
  if (instIndex < InstructionRefOffset) {
    switch (instIndex) {
      case Instruction.Ref.edgeFailImplicit: {
        writer.writeLine(`@edge(fail): {}`);
        break;
      }

      case Instruction.Ref.edgeEofImplicit: {
        writer.writeLine(`@edge(eof): {}`);
        break;
      }

      default: {
        assert(false, "Unreachable");
      }
    }

    return;
  }

  const inst = ctx.getInst(instIndex);
  // console.log(inst);

  switch (inst.tag) {
    case Instruction.Tag.state:
    case Instruction.Tag.stateAccepting:
    case Instruction.Tag.stateReachable:
    {
      const stateData = ctx.unpackStateData(inst);
      const tokenIndex = stateData.token;

      if (tokenIndex !== -1) {
        writer.writeLine(`@tag(${ctx.subset.tokens.get(tokenIndex)});`);
      }

      if (stateData.edgesLength > 0) {
        if (stateData.reachable) {
          writer.writeLine(`@state(${instIndex}) {`);
        } else {
          writer.writeLine(`@state(%) {`);
        }
        writer.indent++;

        for (const edgeIndex of ctx.ir.unpackArray(stateData.edges)) {
          run(ctx, edgeIndex, instIndex);
        }

        writer.indent--;
        writer.writeLine("}");
      }

      break;
    }

    case Instruction.Tag.edge:
    case Instruction.Tag.edgeCircular:
    {
      const edgeData = ctx.unpackEdgeData(inst);

      writer.writeLine(`@edge(${Array.from(ctx.ir.unpackArray(edgeData.alphabets), alphaIndex => {
        if (alphaIndex >= AlphabetOffset) {
          return "'" + JSON.stringify(ctx.subset.alphabets.at(alphaIndex - AlphabetOffset)).slice(1, -1) + "'";
        } else if (alphaIndex === AlphabetReference.fail) {
          return "fail";
        } else if (alphaIndex === AlphabetReference.eof) {
          return "eof";
        }

        assert(false, "Unreachable");
      }).join(", ")}) {`);

      writer.indent++;
      writer.writeLine("@increment();");
      const nextInstIndex = edgeData.instIndex;
      if (edgeData.recursive) {
        writer.writeLine(`@continue(${nextInstIndex});`);
      } else {
        run(ctx, nextInstIndex, prevLabel);
        // writer.writeLine(`@break(${prevLabel});`);
      }
      writer.indent--;
      writer.writeLine("}");
      break;
    }

    case Instruction.Tag.edgeEofCircular:
    case Instruction.Tag.edgeEof:
    {
      const nextInstIndex = inst.data.data1;
      writer.writeLine(`@edge(eof) {`);
      writer.indent++;
      if (inst.tag === Instruction.Tag.edgeEofCircular) {
        writer.writeLine(`@continue(${nextInstIndex});`);
      } else {
        run(ctx, nextInstIndex, prevLabel);
      }

      writer.indent--;
      writer.writeLine("}");
      break;
    }

    case Instruction.Tag.edgeFailCircular:
    case Instruction.Tag.edgeFail:
    {
      const nextInstIndex = inst.data.data1;
      writer.writeLine(`@edge(fail) {`);
      writer.indent++;
      writer.writeLine("@increment();");
      if (inst.tag === Instruction.Tag.edgeFailCircular) {
        writer.writeLine(`@continue(${nextInstIndex});`);
      } else {
        run(ctx, nextInstIndex, prevLabel);
      }

      writer.indent--;
      writer.writeLine("}");
      break;
    }

    default: {
      throw new Error(`Unexpected tag: %${inst.tag}`);
    }
  }
}


function boilerplate1(ctx) {
  ctx.writer.writeAll(`\
export class Token {
  tag;
  start;
  end;

  constructor(tag, start, end) {
    this.tag = tag;
    this.start = start;
    this.end = end;
  }
};

export const Tag = Object.freeze({
  __proto__: null,
  ${Array.from(ctx.subset.tokens, ([, token], i) => `${token}: ${JSON.stringify(token)}`).join(",\n  ")}
});

`);

  ctx.writer.writeLine("export function next(lexer) {");
  ctx.writer.indent++;
  ctx.writer.writeLine("const source = lexer.source;");
  ctx.writer.writeLine("let lastIndex = lexer.index;");
  ctx.writer.writeLine("let tag;");
}

function boilerplate2(ctx) {
  ctx.writer.writeLine("return new Token(tag, lastIndex, lexer.index);");
  ctx.writer.indent--;
  ctx.writer.writeLine("}");  
}
