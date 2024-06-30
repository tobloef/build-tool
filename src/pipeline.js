import { BuildModule } from "./modules/build-module.js";
import { log, LogLevel } from "./logging.js";

/**
 * @param {BuildModule[]} pipeline
 * @return {Promise<void>}
 */
export async function runPipelineOnce(pipeline) {
  log(LogLevel.INFO, "🔧 Running build pipeline:");

  const startTime = performance.now();

  for (const module of pipeline) {
    await module.run();
  }

  const endTime = performance.now();
  const elapsedSeconds = (endTime - startTime) / 1000;

  log(LogLevel.INFO, `✅ Build completed in ${elapsedSeconds.toFixed(3)} seconds`);
}

/**
 * @param {BuildModule[]} pipeline
 * @return {Promise<void>}
 */
export async function runPipelineContinuously(pipeline) {
  log(LogLevel.INFO, "🔧 Running initial build");

  for (const module of pipeline) {
    await module.run();
  }

  log(LogLevel.INFO, "👀 Finished initial build, watching for changes...");

  for (const module of pipeline) {
    await module.watch();
  }
}