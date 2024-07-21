import { lstat } from "node:fs/promises";

/**
 * Check if the file at the given path exists and is indeed a file.
 * @param file {string}
 * @return {Promise<boolean>}
 */
export async function fileExists(file) {
  try {
    return (await lstat(file)).isFile();
  } catch (e) {
    return false;
  }
}
