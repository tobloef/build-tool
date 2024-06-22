import { cli, isCli } from "./src/cli.js";


if (isCli(import.meta.url)) {
  await cli();
}