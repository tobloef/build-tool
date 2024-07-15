/**
 * @param {string[]} paths
 */
export function join(...paths) {
  const usesBackslashes = paths.some((path) => path.includes("\\"));
  const parts = paths.flatMap((path) => path.split(/[\\/]/g));

  /** @type {string[]} */
  let newParts = [];

  for (const part of parts) {
    if (newParts.length === 0) {
      newParts.push(part);
      continue;
    }

    if (part === "..") {
      newParts = newParts.slice(0, -1);
      continue;
    }

    if (part === "." || part === "") {
      continue;
    }

    newParts.push(part);
  }

  return newParts.join(usesBackslashes ? "\\" : "/");
}

/**
 * @param {string} path
 */
export function normalizeSlashes(path) {
  return path.replace(/\\/g, "/");
}