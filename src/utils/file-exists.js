import { access } from "node:fs/promises";
import { constants } from "node:fs";

/**
 * Check if the file at the given path exists.
 * @param file {string}
 * @return {Promise<boolean>}
 */
export async function fileExists(file) {
  try {
    await access(file, constants.F_OK);
    return true;
  } catch (e) {
    return false;
  }
}
