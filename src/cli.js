import { pathToFileURL } from "url";
import { existsSync } from "node:fs";
import { log, LogLevel, useLogLevel } from "./logging.js";
import { getPackageJson } from "./utils/package.js";
import presets from "./presets/index.js";
import { readFile } from "node:fs/promises";
import { BuildConfig } from "./build-config.js";
import { parseArgs } from "node:util";
import { Module } from "./modules/module.js";

/** @import {Module} from "./modules/module.js"; */

export async function cli() {
  const { values: args } = parseArgs({
    options: {
      verbose: { type: "boolean" },
      quiet: { type: "boolean" },
    },
    allowPositionals: true,
  });

  if (args.verbose) {
    useLogLevel(LogLevel.VERBOSE);
  }

  if (args.quiet) {
    useLogLevel(LogLevel.ERROR);
  }

  log(LogLevel.INFO, ""); // Ensuring a newline to fix my stupid terminal

  const buildConfig = await getBuildConfig();

  log(LogLevel.VERBOSE, `Using build config: ${JSON.stringify(buildConfig, null, 2)}`);

  await runPipeline(buildConfig.pipeline);
}

/**
 * @return {Promise<BuildConfig>}
 */
async function getBuildConfig() {
  const buildConfigJson = await getBuildConfigJson();
  return BuildConfig.fromJSON(buildConfigJson);
}

/**
 * @return {Promise<any>}
 */
async function getBuildConfigJson() {
  const path = process.argv[2] ?? `${process.cwd()}/build-config.json`;

  if (!existsSync(path) && !isPreset(path)) {
    log(
      LogLevel.ERROR,
      `No build config found in "${path}".` +
      "\nYou must either:" +
      "\n  * Have a build-config.json file in the working directory" +
      "\n  * Specify a path to a build config as the first argument" +
      `\n  * Specify a preset as the first argument (available presets: ${Object.keys(presets).join(",")})`,
    );
    process.exit(1);
  }

  if (isPreset(path)) {
    return presets[path];
  }

  const buildConfigString = await readBuildConfig(path);

  try {
    return JSON.parse(buildConfigString);
  } catch (error) {
    log(LogLevel.ERROR, `Failed to parse build config:\n${error.message}`);
    process.exit(1);
  }
}

/**
 * @param {string} path
 * @returns {path is keyof presets}
 */
function isPreset(path) {
  return Object.keys(presets).includes(path);
}

/**
 * @param {string} path Path to the build config file.
 * @returns {Promise<string>} The build config file content.
 */
async function readBuildConfig(path) {
  if (!existsSync(path)) {
    log(LogLevel.ERROR, `Build config file not found at "${path}".`);
    process.exit(1);
  }

  const buildConfigString = await readFile(path, { encoding: "utf-8" });

  return buildConfigString;
}

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

/**
 *
 * @param {Module[]} pipeline
 * @return {Promise<void>}
 */
async function runPipeline(pipeline) {
  log(LogLevel.INFO, "Running build pipeline:");

  const startTime = performance.now();

  for (const module of pipeline) {
    if (module.label) {
      log(LogLevel.INFO, ` ${module.label}`);
    }
    await module.run();
  }

  const endTime = performance.now();
  const elapsedSeconds = (endTime - startTime) / 1000;

  log(LogLevel.INFO, ` ✅ Build completed in ${elapsedSeconds.toFixed(3)} seconds`);
}