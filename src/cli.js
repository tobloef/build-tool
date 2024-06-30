import { log, LogLevel, setLogLevel } from "./logging.js";
import { getBuildConfig } from "./build-config.js";
import { inspect, parseArgs } from "node:util";
import { runPipelineContinuously, runPipelineOnce } from "./pipeline.js";

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

  buildConfig.watch = args.watch ?? buildConfig.watch;

  log(LogLevel.VERBOSE, `Using build config: ${inspect(buildConfig, { depth: null })}`);

  if (buildConfig.watch) {
    await runPipelineContinuously(buildConfig);
  } else {
    await runPipelineOnce(buildConfig);
  }

}

function getArgs() {
  const { values: args } = parseArgs({
    options: {
      verbose: { type: "boolean" },
      quiet: { type: "boolean" },
      watch: { type: "boolean" },
    },
    allowPositionals: true,
  });

  return args;
}