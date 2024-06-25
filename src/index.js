import { cli } from "./cli.js";
import { suppressExperimentalWarnings } from "./utils/suppress-experimental-warnings.js";
import { isCli } from "./utils/is-cli.js";

export * from "./presets/index.js";

suppressExperimentalWarnings();

if (await isCli(import.meta.url)) {
  await cli();
}

