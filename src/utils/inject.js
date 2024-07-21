import { indent } from "./indent.js";

/**
 * @param {string} html
 * @param {string} element
 */
export function injectIntoHead(html, element) {
  const indentLevel = html.match(/[\t ]*<head>/)?.[0]?.replace("<head>", "").length ?? 0;
  element = indent(element, indentLevel + 1);
  return html.replace(/<\/head>/, `${element}\n${indent("</head>", indentLevel)}`);
}

/**
 * @param {string} html
 * @param {string} element
 */
export function injectIntoBody(html, element) {
  const indentLevel = html.match(/[\t ]*<body>/)?.[0]?.replace("<body>", "").length ?? 0;
  element = indent(element, indentLevel + 1);
  return html.replace(/<\/body>/, `${element}\n${indent("</body>", indentLevel)}`);
}
