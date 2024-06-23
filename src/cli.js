import { pathToFileURL } from "url";
import { existsSync } from "node:fs";
import { log, LogLevel } from "./logging.js";
import { getPackageJson } from "./utils/package.js";
import { presets } from "./build-configs/index.js";

export async function cli() {
  const buildConfig = await findBuildConfig();


  // TODO
}

async function findBuildConfig() {
  const path = process.argv[2] ?? `${process.cwd()}/build-config.js`;

  const isPreset = Object.keys(presets).includes(path);

  if (!existsSync(path) && !isPreset) {
    log(
      LogLevel.ERROR,
      `Error: No build config found in "${path}".` +
      "\nYou must either:" +
      "\n  * Have a build-config.js file in the working directory" +
      "\n  * Specify a path to a build config as the first argument" +
      `\n  * Specify a preset as the first argument (available presets: ${Object.keys(presets).join(",")})`,
    );
    process.exit(1);
    return;
  }

  if (isPreset) {
    return presets[path];
  }

  return await readBuildConfig(path);
}

async function readBuildConfig(path) {
  const relativeBuildConfigPath = pathToFileURL(path).href;
  const buildConfigModule = await import(relativeBuildConfigPath);

  if (!buildConfigModule.default) {
    log(LogLevel.ERROR, `Error: No default export found in build config "${path}".`);
    process.exit(1);
    return;
  }

  const buildConfig = buildConfigModule.default;

  return buildConfig;
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