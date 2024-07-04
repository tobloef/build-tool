import { dirname, resolve } from "path";
import { parseImports } from "./parse-imports.js";

/**
 * @param {string} code
 * @param {string} absolutePath
 * @return {Promise<string>}
 */
export async function proxyWithHotImports(code, absolutePath) {
  const { imports, remainingCode } = parseImports(code);

  if (imports.length === 0) {
    return code;
  }

  const UNIQUE_STRING = "UFVWldpE"; // Prevent collisions
  const reimportFunction = `reimport_${UNIQUE_STRING}`;
  const HOT_PACKAGE = "/@injected/hot.js";

  let lets = [];
  let assigns = [];
  let listeners = new Set();

  for (const importInfo of imports) {
    const {
      path: importPath,
      exportName,
      importName,
    } = importInfo;

    const {
      absolutePath: absoluteImportPath,
      isBare,
    } = parseImportPath(importPath, absolutePath);

    if (isBare) {
      continue;
    }

    lets.push(`let ${importName};`);
    assigns.push(`${importName} = await modules.get("${absoluteImportPath}")["${exportName}"];`);
    listeners.add(`modules.onReload("${absoluteImportPath}", ${reimportFunction});`);
  }

  return (
    `${lets.join("\n")}` +
    (lets.length > 0 ? "\n\n" : "") +
    "(async () => {\n\t" +
    `const { modules } = await import("${HOT_PACKAGE}");\n\n\t` +
    `const ${reimportFunction} = async () => {` +
    (assigns.length > 0 ? "\n\t\t" : "") +
    assigns.join("\n\t\t") +
    (assigns.length > 0 ? "\n\t" : "") +
    "}\n\n\t" +
    `await ${reimportFunction}();\n` +
    (listeners.size > 0 ? "\n\t" : "") +
    `${Array.from(listeners).join("\n\t")}` +
    (listeners.size > 0 ? "\n" : "") +
    "})()" +
    (remainingCode.length > 0 ? "\n\n" : "") +
    remainingCode
  );
}

/**
 * @param {string} importPath
 * @param {string} absoluteParentPath
 * @return {{ isBare: boolean, absolutePath: string }}
 */
function parseImportPath(importPath, absoluteParentPath) {
  const isAbsolute = importPath.startsWith("/");

  const isRelative = (
    importPath.startsWith("./") ||
    importPath.startsWith("../")
  );

  const isBare = !isAbsolute && !isRelative;

  const absolutePath = isRelative
    ? resolve(dirname(absoluteParentPath), importPath)
    : importPath;

  return {
    isBare,
    absolutePath,
  };
}
