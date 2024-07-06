/** @import {BuildModule} from "./modules/build-module.js"; */
import { log, LogLevel } from "./utils/logging.js";
import { isPreset, presets } from "./presets/index.js";
import { fileExists } from "./utils/file-exists.js";
import { join } from "node:path";
import { pathToFileURL } from "url";
import { DEFAULT_BUILD_DIR } from "./constants.js";

export class BuildConfig {
  /** @type {boolean} */
  clean = false;
  /** @type {boolean} */
  watch = false;
  /** @type {ServeOptions | null} */
  serve = null;
  /** @type {string[]} */
  ignoredFolders = ["node_modules", ".git"];
  /** @type {BuildModule[]} */
  pipeline = [];

  /**
   *  @param {Object} options
   *  @param {BuildModule[]} options.pipeline
   *  @param {boolean} [options.clean]
   *  @param {boolean} [options.watch]
   *  @param {ServeOptions} [options.serve]
   *
   *  @param {string[]} [options.ignoredFolders]
   */
  constructor(options) {
    this.pipeline = options.pipeline ?? this.pipeline;
    this.watch = options.watch ?? this.watch;
    this.serve = options.serve ?? this.serve;
    this.ignoredFolders = options.ignoredFolders ?? this.ignoredFolders;
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
  const possiblePaths = [
    process.argv[2],
    join(process.cwd(), "build-config.js"),
    join(process.cwd(), "build-config.mjs"),
  ];

  for (const path of possiblePaths) {
    if (!await fileExists(path) && !isPreset(path)) {
      continue;
    }

    if (isPreset(path)) {
      return presets[path];
    }

    return path;
  }

  log(
    LogLevel.ERROR,
    "No build config found. You must either:" +
    "\n  * Have a build-config.js (or .mjs) file in the working directory" +
    "\n  * Specify a path to a build config as the first argument" +
    `\n  * Specify a preset as the first argument (available presets: ${Object.keys(presets).join(",")})`,
  );
  process.exit(1);
}

/**
 * @typedef {Object} ServeOptions
 * @property {number} port
 * @property {string} address
 * @property {string} directory
 * @property {boolean} [live]
 * @property {boolean | HotOptions} [hot]
 * @property {boolean} [open]
 */

/**
 * @typedef {Object} HotOptions
 * @property {HotMode} [mode]
 */

/**
 * @typedef {"opt-in" | "opt-out"} HotMode
 */

/** @type {ServeOptions} */
export const DEFAULT_SERVE_OPTIONS = {
  port: 8080,
  address: "localhost",
  directory: DEFAULT_BUILD_DIR,
};
