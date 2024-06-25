/** @import {Module} from "./modules/module.js"; */
import { log, LogLevel } from "./logging.js";
import { isPreset, presets } from "./presets/index.js";
import { fileExists } from "./utils/file-exists.js";

export class BuildConfig {
  /** @type {Module[]} */
  static pipeline;

  /**
   *  @param {Object} options
   *  @param {Module[]} options.pipeline The modules to run in the build pipeline.
   */
  constructor(options) {
    this.pipeline = options.pipeline;
  }
}

/**
 * @return {Promise<BuildConfig>}
 */
export async function getBuildConfig() {
  const buildConfigPath = await getBuildConfigPath();

  const imported = await import(buildConfigPath);

  if (!imported.default) {
    throw new Error("No default export found in build config");
  }

  return imported.default;
}

/**
 * @return {Promise<string>}
 */
async function getBuildConfigPath() {
  const path = process.argv[2] ?? `${process.cwd()}/build-config.js`;

  if (!await fileExists(path) && !isPreset(path)) {
    log(
      LogLevel.ERROR,
      `No build config found in "${path}".` +
      "\nYou must either:" +
      "\n  * Have a build-config.js file in the working directory" +
      "\n  * Specify a path to a build config as the first argument" +
      `\n  * Specify a preset as the first argument (available presets: ${Object.keys(presets).join(",")})`,
    );
    process.exit(1);
  }

  if (isPreset(path)) {
    return presets[path];
  }

  return path;
}

