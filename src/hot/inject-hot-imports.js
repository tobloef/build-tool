import { dirname, resolve } from "path";
import { parseImports } from "./parse-imports.js";
import { join } from "node:path";

/**
 * @param {string} code
 * @param {string} modulePath
 * @param {string} rootPath
 * @return {Promise<string>}
 */
export async function injectHotImports(code, modulePath, rootPath) {
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
      isBare,
      canonicalPath,
    } = parseImportPath(importPath, modulePath, rootPath);

    if (isBare) {
      continue;
    }

    let assign = `${importName} = {...await modules.get("${canonicalPath}")}`;
    if (exportName !== "*") {
      assign += `["${exportName}"]`;
    }
    assign += ";";
    assigns.push(assign);

    lets.push(`let ${importName};`);
    listeners.add(`modules.onReload("${canonicalPath}", ${reimportFunction});`);
  }

  return (
    `${lets.join("\n")}` +
    (lets.length > 0 ? "\n\n" : "") +
    "await (async () => {\n\t" +
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
 * @param {string} parentPath
 * @param {string} rootPath
 * @return {{ isBare: boolean, canonicalPath: string }}
 */
function parseImportPath(importPath, parentPath, rootPath) {
  const isAbsolute = importPath.startsWith("/");

  const isRelative = (
    importPath.startsWith("./") ||
    importPath.startsWith("../")
  );

  const isBare = !isAbsolute && !isRelative;

  if (!isRelative) {
    return {
      isBare,
      canonicalPath: importPath,
    };
  }

  const canonicalPath = resolve(dirname(parentPath), importPath)
    .replace(resolve(rootPath), "");

  return {
    isBare,
    canonicalPath,
  };
}