#!/usr/bin/env node

import { log, LogLevel, setLogLevel } from "./utils/logging.js";
import { DEFAULT_SERVE_OPTIONS, getBuildConfig } from "./build-config.js";
import { inspect, parseArgs } from "node:util";
import { runPipelineContinuously, runPipelineOnce } from "./pipeline.js";
import { createHttpServer } from "./server/http-server.js";
import { createWebSocketServer } from "./server/websocket-server.js";

/** @import { BuildConfig, ServeOptions } from "./build-config.js"; */
/** @import { Server } from "node:http"; */

async function cli() {
  const args = getArgs();

  if (args.verbose) {
    setLogLevel(LogLevel.VERBOSE);
  }

  if (args.quiet) {
    setLogLevel(LogLevel.ERROR);
  }

  const buildConfig = await getBuildConfig();

  // Overwrite build config with CLI args
  buildConfig.watch = args.watch ?? buildConfig.watch;
  buildConfig.serve = args.serve ? DEFAULT_SERVE_OPTIONS : buildConfig.serve;
  if (buildConfig.serve) {
    buildConfig.serve.live = args.live ?? buildConfig.serve.live;
    buildConfig.serve.hot = args.hot ?? buildConfig.serve.hot;
  }

  log(LogLevel.VERBOSE, `Using build config: ${inspect(buildConfig, { depth: null })}`);

  await runPipelineOnce(buildConfig);

  if (buildConfig.serve) {
    const server = createHttpServer(buildConfig.serve);

    if (buildConfig.serve.live || buildConfig.serve.hot) {
      createWebSocketServer(buildConfig.serve, server);
    }

    await startServer(buildConfig.serve, server);
  }

  if (buildConfig.watch) {
    await runPipelineContinuously(buildConfig);
  }
}

function getArgs() {
  const { values: args } = parseArgs({
    options: {
      verbose: { type: "boolean" },
      quiet: { type: "boolean" },
      watch: { type: "boolean" },
      serve: { type: "boolean" },
      live: { type: "boolean" },
      hot: { type: "boolean" },
    },
    allowPositionals: true,
  });

  return args;
}

/**
 * @param {ServeOptions} serveOptions
 * @param {Server} server
 */
async function startServer(serveOptions, server) {
  return new Promise((resolve) => {
    const { port, address, live } = serveOptions;

    server.listen(port, address, () => {
      log(LogLevel.INFO, `🌐 Dev server running at http://${address}:${port}/`);

      if (live) {
        log(LogLevel.INFO, "🔄 Live reloading enabled");
      }

      resolve(undefined);
    });
  });
}

await cli();