import path from "node:path";

/** @type {Record<string, string>} */
const mimeTypeByExtension = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".apng": "image/apng",
  ".avif": "image/avif",
  ".webp": "image/webp",
};

const defaultMimeType = "application/octet-stream";

/**
 * @param {string} filePath
 * @return {string}
 */
export const getMimeType = (filePath) => {
  const extension = path.extname(filePath);
  return mimeTypeByExtension[extension] ?? defaultMimeType;
};