import { Module } from "./modules/module.js";
import { log, LogLevel } from "./logging.js";

/**
 * @param {Module[]} pipeline
 * @return {Promise<void>}
 */
export async function runPipeline(pipeline) {
  log(LogLevel.INFO, "Running build pipeline:");

  const startTime = performance.now();

  for (const module of pipeline) {
    if (module.label) {
      log(LogLevel.INFO, ` ${module.label}`);
    }
    await module.runOnce();
  }

  const endTime = performance.now();
  const elapsedSeconds = (endTime - startTime) / 1000;

  log(LogLevel.INFO, ` ✅ Build completed in ${elapsedSeconds.toFixed(3)} seconds`);
}