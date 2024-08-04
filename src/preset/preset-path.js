import { join } from "node:path";

export const presetPaths = {
  "presets/dev": join(import.meta.dirname, "presets", "dev.js"),
  "presets/github-pages": join(import.meta.dirname, "presets", "github-pages.js"),
};

/**
 * @param {string} path
 * @returns {path is keyof presetPaths}
 */
export function isPreset(path) {
  return Object.keys(presetPaths).includes(path);
}
