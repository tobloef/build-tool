import { cli, isCli } from "./cli.js";
import { suppressExperimentalWarnings } from "./utils/suppress-experimental-warnings.js";

export * from "./presets/index.js";

suppressExperimentalWarnings();

if (await isCli(import.meta.url)) {
  await cli();
}

