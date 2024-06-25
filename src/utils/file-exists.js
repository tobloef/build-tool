import { access } from "node:fs/promises";
import { constants } from "node:fs";

/**
 * Check if the file at the given path exists.
 * @param file {string}
 * @return {Promise<boolean>}
 */
export function fileExists(file) {
  return access(file, constants.F_OK)
    .then(() => true)
    .catch(() => false);
}