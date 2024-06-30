/** @import {BuildModule} from "./modules/build-module.js"; */
import { log, LogLevel } from "./logging.js";
import { isPreset, presets } from "./presets/index.js";
import { fileExists } from "./utils/file-exists.js";
import { join } from "node:path";
import { pathToFileURL } from "url";

export class BuildConfig {
  /** @type {boolean} */
  watch = false;
  /** @type {string[]} */
  ignored_folders = ["node_modules", ".git"];
  /** @type {BuildModule[]} */
  pipeline = [];

  /**
   *  @param {Object} options
   *  @param {BuildModule[]} options.pipeline The modules to run in the build pipeline.
   *  @param {boolean} [options.watch] Whether to watch for changes and rebuild.
   *  @param {string[]} [options.ignored_folders] The folders to ignore when watching for changes.
   */
  constructor(options) {
    this.pipeline = options.pipeline ?? this.pipeline;
    this.watch = options.watch ?? this.watch;
    this.ignored_folders = options.ignored_folders ?? this.ignored_folders;
  }
}

/**
 * @return {Promise<BuildConfig>}
 */
export async function getBuildConfig() {
  const buildConfigPath = await getBuildConfigPath();

  const imported = await import(pathToFileURL(buildConfigPath).href);

  if (!imported.default) {
    throw new Error("No default export found in build config");
  }

  return imported.default;
}

/**
 * @return {Promise<string>}
 */
async function getBuildConfigPath() {
  const path = process.argv[2] ?? join(process.cwd(), "build-config.js");

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

