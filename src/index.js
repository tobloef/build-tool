import { cli, isCli } from "./cli.js";

if (isCli(import.meta.url)) {
  await cli();
}