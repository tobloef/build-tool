import {
  log,
  LogLevel,
} from "./utils/logging.js";
import {
  isPreset,
  presets,
} from "./presets/index.js";
import { fileExists } from "./utils/file-exists.js";
import { join } from "node:path";
import { pathToFileURL } from "url";

/** @import {Module} from "./module/index.js"; */

export class BuildConfig {
  /** @type {Module[]} */
  modules;
  /** @type {boolean} */
  watch;
  /** @type {ServeOptions | false} */
  serve;
  /** @type {string[]} */
  ignoredFolders;

  /**
   *  @param {Object} options
   *  @param {Module[]} [options.modules]
   *  @param {boolean} [options.watch]
   *  @param {boolean | ServeOptions} [options.serve]
   *  @param {string[]} [options.ignoredFolders]
   */
  constructor(options) {
    this.modules = options.modules ?? [];
    this.watch = options.watch ?? false;
    this.serve = options.serve === true ? new ServeOptions() : options.serve ?? false;
    this.ignoredFolders = options.ignoredFolders ?? ["node_modules", ".git"];
  }
}

export class ServeOptions {
  /** @type {number} */
  port;
  /** @type {string} */
  address;
  /** @type {boolean} */
  open;

  /**
   * @param {Object} [options]
   * @param {number} [options.port]
   * @param {string} [options.address]
   * @param {boolean} [options.open]
   */
  constructor(options) {
    this.port = options?.port ?? 3007;
    this.address = options?.address ?? "localhost";
    this.open = options?.open ?? false;
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
    "Build config not found. You must either:" +
    "\n  * Have a build-config.js (or .mjs) file in the working directory" +
    "\n  * Specify a path to a build config as the first argument" +
    `\n  * Specify a preset as the first argument (available presets: ${Object.keys(presets).join(", ")})`,
  );
  process.exit(1);
}
