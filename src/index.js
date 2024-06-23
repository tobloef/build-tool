import { cli, isCli } from "./cli.js";

export * from "./modules/index.js";

if (isCli(import.meta.url)) {
  await cli();
}

