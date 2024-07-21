/**
 * @param {string} text
 * @param {number} amount
 */
export function indent(text, amount) {
  const space = "\t".repeat(amount);
  return text.split("\n").map((line) => `${space}${line}`).join("\n");
}

/**
 * @param {string} text
 * @param {number} amount
 */
export function dedent(text, amount) {
  return text.split("\n")
    .map((line) => line.slice(amount))
    .join("\n");
}
