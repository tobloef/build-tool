import { pathToFileURL } from "url";
import { existsSync } from "node:fs";
import { log, LogLevel } from "./logging.js";
import { getPackageJson } from "./utils/package.js";

export async function cli() {
  const buildConfigPath = findBuildConfigPath();
  const relativeBuildConfigPath = pathToFileURL(buildConfigPath).href;
  const buildConfigModule = await import(relativeBuildConfigPath);

  if (!buildConfigModule.default) {
    log(LogLevel.ERROR, "Error: No default export found in build config.");
    process.exit(1);
  }

  const buildConfig = buildConfigModule.default;

  // TODO
}

function findBuildConfigPath() {
  let currentPath = process.cwd();

  if (process.argv[2]) {
    if (existsSync(process.argv[2])) {
      return process.argv[2];
    }
  } else if (existsSync(`${currentPath}/build-config.js`)) {
    return `${currentPath}/build-config.js`;
  }

  log(LogLevel.ERROR, "Error: No build config found. Must exist in working directory or be passed as the first argument.");
  process.exit(1);
}

/**
 * Check if the current module was called directly from the command line and not imported from another module.
 * @param rootModuleUrl {string} Obtained by calling `import.meta.url` in the root module.
 * @returns {boolean}
 */
export function isCli(rootModuleUrl) {
  const calledScript = pathToFileURL(process.argv[1]).href;

  // Could be called like "node ." or "node build-tool"
  const packageJson = getPackageJson();
  const rootModuleUrlWithoutMainPath = rootModuleUrl
    .replace(packageJson.main, "")
    .replace(/\/$/, "");

  const result = (
    rootModuleUrl === calledScript ||
    rootModuleUrlWithoutMainPath === calledScript
  );

  return result;
}