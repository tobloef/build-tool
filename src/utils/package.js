import { existsSync, readFileSync } from "fs";

/**
 * Find, read, and parse the package.json file.
 * @returns {Object}
 */
export function getPackageJson() {
  const path = findPackageJsonPath();
  const file = readFileSync(path, { encoding: "utf-8" });
  const parsed = JSON.parse(file);

  return parsed;
}

/**
 * Traverse folder tree upwards until we find a package.json.
 * @returns {string | null} Path of found package.json or null.
 */
function findPackageJsonPath() {
  let currentDir = import.meta.dirname;

  while (currentDir !== "") {
    const path = `${currentDir}/package.json`;

    if (existsSync(path)) {
      return path;
    }

    currentDir = currentDir.split("/").slice(0, -1).join("/");
  }

  return null;
}