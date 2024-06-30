import { log, LogLevel } from "./logging.js";
import { watch } from "fs/promises";
import { buildEvents } from "./events.js";
import { debounce } from "./utils/debounce.js";

/** @import { BuildConfig } from "./build-config.js"; */

/**
 * @param {BuildConfig} buildConfig
 * @return {Promise<void>}
 */
export async function runPipelineOnce(buildConfig) {
  log(LogLevel.INFO, "🔧 Running build pipeline:");

  const startTime = performance.now();

  for (const module of buildConfig.pipeline) {
    await module.run();
  }

  const endTime = performance.now();
  const elapsedSeconds = (endTime - startTime) / 1000;

  log(LogLevel.INFO, `✅ Build completed in ${elapsedSeconds.toFixed(3)} seconds`);
}

/**
 * @param {BuildConfig} buildConfig
 * @return {Promise<void>}
 */
export async function runPipelineContinuously(buildConfig) {
  log(LogLevel.INFO, "🔧 Running initial build");

  for (const module of buildConfig.pipeline) {
    await module.run();
  }

  log(LogLevel.INFO, "👀 Finished initial build, watching for changes...");

  void watchFiles(buildConfig);

  for (const module of buildConfig.pipeline) {
    await module.watch();
  }
}

/**
 * @param {BuildConfig} buildConfig
 * @return {Promise<void>}
 */
async function watchFiles(buildConfig) {
  let perPathDebouncedHandlers = new Map();

  for await (const event of watch(".", { recursive: true })) {
    const { filename } = event;

    if (filename === null) {
      continue;
    }

    if (filename.endsWith("~")) {
      continue;
    }

    if (buildConfig.ignored_folders.some((folder) => filename.includes(folder))) {
      continue;
    }

    if (!perPathDebouncedHandlers.has(filename)) {
      perPathDebouncedHandlers.set(
        filename,
        debounce(() => buildEvents.fileChanged.publish(filename), 10),
      );
    }

    perPathDebouncedHandlers.get(filename)();
  }
}