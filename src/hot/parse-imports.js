const identifier = `(?:[a-zA-Z_][a-zA-Z0-9_]*)`;

const importedName = `(?:\\s+as\\s+(${identifier}))`;
const exportedName = `(${identifier})`;

const pair = `(${exportedName}${importedName}?)`;
const oneOrMorePairs = `(?:${pair}(?:,\\s+${pair})*)`;

const namedImports = `(?:\\{\\s+${oneOrMorePairs}?\\s+\\})`;
const namespaceImport = `(?:(\\*)${importedName}?)`;
const defaultImport = `(?:(${identifier})${importedName}?)`;

const someImport = `(?:${namedImports}|${namespaceImport}|${defaultImport})`;
const oneOrMoreImports = `(?<imports>${someImport}(?:,\\s+${someImport})*)`;

const path = `(?<path>["'][^"']*?["'])`;

const importStatement = `import\\s+${oneOrMoreImports}\\s+from\\s+${path};?\n?`;

const namedImportsRegex = new RegExp(namedImports, "g");
const namespaceImportRegex = new RegExp(namespaceImport, "g");
const defaultImportRegex = new RegExp(defaultImport, "g");
const importRegex = new RegExp(importStatement, "g");
const pairRegex = new RegExp(pair, "g");

/**
 * @typedef {Object} ImportInfo
 * @property {string} path
 * @property {string} exportName
 * @property {string} importName
 */

/**
 * @param {string} code
 * @return {{ imports: ImportInfo[], remainingCode: string }}
 */
export function parseImports(code) {
  let imports = [];

  const { matches, remaining: remainingCode } = consumeMatches(code, importRegex);

  for (const match of matches) {
    const {
      namedGroups: {
        imports: importsString,
        path: pathString,
      },
    } = match;

    const path = pathString.slice(1, -1);

    let remainingImportString = importsString;

    const {
      matches: namedImportsMatches,
      remaining: remainingAfterNamed,
    } = consumeMatches(remainingImportString, namedImportsRegex);
    remainingImportString = remainingAfterNamed;

    const {
      matches: namespaceImportMatches,
      remaining: remainingAfterNamespace,
    } = consumeMatches(remainingImportString, namespaceImportRegex);
    remainingImportString = remainingAfterNamespace;

    const {
      matches: defaultImportMatches,
      remaining: remainingAfterDefault,
    } = consumeMatches(remainingImportString, defaultImportRegex);
    remainingImportString = remainingAfterDefault;

    for (const namedImportsMatch of namedImportsMatches) {
      const { matchedText } = namedImportsMatch;

      const { matches: pairMatches } = consumeMatches(matchedText, pairRegex);

      for (const pairMatch of pairMatches) {
        const exportName = pairMatch.unnamedGroups[1];
        const importName = pairMatch.unnamedGroups[2];

        imports.push({
          path,
          exportName,
          importName: importName ?? exportName,
        });
      }
    }

    for (const namespaceImportMatch of namespaceImportMatches) {
      const exportName = namespaceImportMatch.unnamedGroups[0];
      const importName = namespaceImportMatch.unnamedGroups[1];

      imports.push({
        path,
        exportName,
        importName,
      });
    }

    for (const defaultImportMatch of defaultImportMatches) {
      const exportName = "default";
      const importName = defaultImportMatch.unnamedGroups[0];

      imports.push({
        path,
        exportName,
        importName,
      });
    }
  }

  return {
    imports,
    remainingCode,
  };
}

/**
 * @typedef {Object} RegexMatch
 * @property {number} start
 * @property {number} end
 * @property {string} matchedText
 * @property {Record<string, string>} namedGroups
 * @property {string[]} unnamedGroups
 */

/**
 * @param {string} string
 * @param {RegExp} regex
 * @return {{ remaining: string, matches: RegexMatch[] }}
 */
function consumeMatches(string, regex) {
  let remaining = string;

  let matches = [...remaining.matchAll(regex)].map((match) => ({
    /** @type {number} */
    start: match.index,
    /** @type {number} */
    end: match.index + match[0].length,
    /** @type {string} */
    matchedText: match[0],
    /** @type {Record<string, string>} */
    namedGroups: match.groups ?? {},
    /** @type {string[]} */
    unnamedGroups: match.slice(1),
  }));

  for (const match of matches) {
    const { start, end } = match;

    const sliceSize = end - start;

    remaining = remaining.slice(0, start) + remaining.slice(end);

    for (const match of matches) {
      if (match.start > start) {
        match.start -= sliceSize;
        match.end -= sliceSize;
      }
    }
  }

  return { remaining, matches };
}