import { join } from "node:path";

export const presets = {
  "preset/dev": join(import.meta.dirname, "dev.js"),
  "preset/github-pages": join(import.meta.dirname, "github-pages.js"),
};

/**
 * @param {string} path
 * @returns {path is keyof presets}
 */
export function isPreset(path) {
  return Object.keys(presets).includes(path);
}
