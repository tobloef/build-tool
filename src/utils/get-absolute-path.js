import { resolve } from "path";
import { normalizeSlashes } from "./paths.js";

/**
 * @param {string} path
 * @param {Object} [options]
 * @param {boolean} [options.isFolder]
 * @returns {string}
 */
export function getAbsolutePath(path, options) {
  let absolutePath = normalizeSlashes(resolve(path));

  if (options?.isFolder && !absolutePath.endsWith("/")) {
    absolutePath += "/";
  }

  return absolutePath;
}
