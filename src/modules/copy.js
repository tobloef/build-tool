/** @import { Module } from "./index.js" */

/**
 * Build module to copy files from one directory to another.
 * @param {Object} options
 * @param {string} options.from Path to copy files from.
 * @param {string} options.to Path to copy files to. Will be created if it doesn't exist.
 * @param {string[]} [options.include] File extensions to include. Supports file paths and regular expressions.
 * @param {string[]} [options.exclude] File extensions to exclude. Supports file paths and regular expressions.
 * @param {boolean} [options.preserveFolderStructure] Create folders in the output directory to match the input directory.
 * @returns {Module}
 */
export function copy(options) {
  return {}
}