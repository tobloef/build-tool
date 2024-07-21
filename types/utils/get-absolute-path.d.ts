/**
 * @param {string} path
 * @param {Object} [options]
 * @param {boolean} [options.isFolder]
 * @returns {string}
 */
export function getAbsolutePath(path: string, options?: {
    isFolder?: boolean | undefined;
} | undefined): string;
