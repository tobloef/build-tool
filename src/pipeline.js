import { log, LogLevel } from "./utils/logging.js";
import { watch } from "fs/promises";
import { buildEvents } from "./events.js";
import { debounce } from "./utils/debounce.js";
import { resolve } from "path";
import { Copy } from "./modules/index.js";

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
  log(LogLevel.INFO, "👀 Watching files for changes...");

  setupReloadEvents(buildConfig);
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

    const absolutePath = resolve(filename);

    const absoluteIgnoredFolders = buildConfig.ignoredFolders.map((folder) => resolve(folder));

    if (absoluteIgnoredFolders.some((folder) => absolutePath.startsWith(folder))) {
      continue;
    }

    if (!perPathDebouncedHandlers.has(absolutePath)) {
      perPathDebouncedHandlers.set(
        absolutePath,
        debounce(() => buildEvents.fileChanged.publish({
          absolute: absolutePath,
          relative: filename,
        }), 10),
      );
    }

    perPathDebouncedHandlers.get(absolutePath)();
  }
}

/**
 * @param {BuildConfig} buildConfig
 * @return {void}
 */
function setupReloadEvents(buildConfig) {
  if (!buildConfig.serve) {
    return;
  }

  const absoluteBuildPath = resolve(buildConfig.serve.directory);

  buildEvents.fileChanged.subscribe(async (event) => {
    log(LogLevel.VERBOSE, `File changed: ${event.data.relative}`);

    if (!event.data.absolute.startsWith(absoluteBuildPath)) {
      return;
    }

    // TODO: Figure out how to register that a file type should be handled hotly
    // TODO: Build up a dependency graph to hot reload in the correct order
    // TODO: Don't hot reload if file has a "// @no-hot" comment
    // TODO: Don't hot reload if the file is not in the dependency graph (i.e. not imported)

    const isJsFile = event.data.relative.endsWith(".js");

    const shouldHotReload = isJsFile;
    const shouldLiveReload = !shouldHotReload;

    if (shouldHotReload) {
      buildEvents.hotReload.publish(event.data.absolute);
    }

    if (shouldLiveReload) {
      buildEvents.liveReload.publish();
    }
  });
}