/**
 * @param {Set<any>} set1
 * @param {Set<any>} set2
 */
export function setsAreEqual(set1, set2) {
  if (set1.size !== set2.size) {
    return false;
  }

  for (const elem of set1) {
    if (!set2.has(elem)) {
      return false;
    }
  }

  return true;
}
