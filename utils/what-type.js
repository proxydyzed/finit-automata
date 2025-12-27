export function whatType(value) {
  if (typeof value === "object") {
    if (value === null) {
      return "null";
    }

    return value.constructor?.name ?? "@unknown";
  }

  return typeof value;
}
