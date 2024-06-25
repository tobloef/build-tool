import { pathToFileURL } from "url";
import { getPackageJson } from "./package.js";

/**
 * Check if the current module was called directly from the command line and not imported from another module.
 * @param rootModuleUrl {string} Obtained by calling `import.meta.url` in the root module.
 * @returns {Promise<boolean>}
 */
export async function isCli(rootModuleUrl) {
  const calledScript = pathToFileURL(process.argv[1]).href;

  // Could be called like "node ." or "node build-tool"
  const packageJson = await getPackageJson();

  if (typeof packageJson.main !== "string") {
    throw new Error(`Expected package.json "main" property to be a string.`);
  }

  const rootModuleUrlWithoutMainPath = rootModuleUrl
    .replace(packageJson.main ?? "", "")
    .replace(/\/$/, "");

  const result = (
    rootModuleUrl === calledScript ||
    rootModuleUrlWithoutMainPath === calledScript
  );

  return result;
}