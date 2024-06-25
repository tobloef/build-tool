import { join } from "node:path";

export const presets = {
  web: join(import.meta.dirname, "web.js"),
};

/**
 * @param {string} path
 * @returns {path is keyof presets}
 */
export function isPreset(path) {
  return Object.keys(presets).includes(path);
}
