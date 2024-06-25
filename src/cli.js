import { log, LogLevel, setLogLevel } from "./logging.js";
import { getBuildConfig } from "./build-config.js";
import { parseArgs } from "node:util";
import { runPipeline } from "./pipeline.js";

export async function cli() {
  const args = getArgs();

  if (args.verbose) {
    setLogLevel(LogLevel.VERBOSE);
  }

  if (args.quiet) {
    setLogLevel(LogLevel.ERROR);
  }

  log(LogLevel.INFO, ""); // Ensuring a newline to fix my stupid terminal

  const buildConfig = await getBuildConfig();

  log(LogLevel.VERBOSE, `Using build config: ${JSON.stringify(buildConfig, null, 2)}`);

  await runPipeline(buildConfig.pipeline);
}

function getArgs() {
  const { values: args } = parseArgs({
    options: {
      verbose: { type: "boolean" },
      quiet: { type: "boolean" },
    },
    allowPositionals: true,
  });

  return args;
}