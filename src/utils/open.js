import { assertExhaustive } from "./assert-exhaustive.js";
import { exec } from "child_process";

/**
 * Open a file or URL in the default application.
 * @param {string} path
 */
export function open(path) {
  const platform = getPlatform();

  const isUrl = path.includes("://");

  switch (platform) {
    case "windows":
      if (!isUrl) {
        path = path.replace(/\//g, "\\");
      }
      path = path.replace(/&/g, "\"&\"");
      exec(`start ${path}`);
      break;
    case "mac":
      exec(`open ${path}`);
      break;
    case "linux":
      exec(`xdg-open ${path}`);
      break;
    default:
      assertExhaustive(platform);
  }
}

/**
 * @returns {"windows" | "mac" | "linux"}
 */
function getPlatform() {
  switch (process.platform) {
    case "win32":
      return "windows";
    case "darwin":
      return "mac";
    default:
      return "linux"; // Naive assumption
  }
}
