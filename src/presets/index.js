import { join } from "node:path";
import dev from "./dev.js";
import githubPages from "./github-pages.js";

/** @import { BuildConfig } from "../build-config.js"; */

/** @type {Record<keyof presetPaths, BuildConfig>} */
export const presets = {
  "presets/dev": dev,
  "presets/github-pages": githubPages,
}

export const presetPaths = {
  "presets/dev": join(import.meta.dirname, "dev.js"),
  "presets/github-pages": join(import.meta.dirname, "github-pages.js"),
};

/**
 * @param {string} path
 * @returns {path is keyof presetPaths}
 */
export function isPreset(path) {
  return Object.keys(presetPaths).includes(path);
}
