/**
 * @param {string} text
 * @param {number} spaces
 */
export function indent(text, spaces) {
  const space = " ".repeat(spaces);
  return text.split("\n").map((line) => `${space}${line}`).join("\n");
}