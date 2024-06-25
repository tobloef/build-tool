import { Module } from "./module.js";
import fs from "fs/promises";

/**
 * Copies files from one directory to another, preserving the directory structure.
 */
export class Copy extends Module {
  /** @type {string} */
  from;
  /** @type {string} */
  to;
  /** @type {RegExp[] | undefined} */
  files;

  /**
   *
   * @param {Object} options
   * @param {string} options.label The label for the module.
   * @param {string} options.from The source directory to copy files from.
   * @param {string} options.to The destination directory to copy files to.
   * @param {RegExp[]} [options.files] The RegExp patterns to match the files to copy. Otherwise, all files are copied.
   * @param {boolean} [options.recursive=true] Whether to copy files recursively from subdirectories.
   */
  constructor(options) {
    super(options);
    this.from = options.from;
    this.to = options.to;
    this.files = options.files;
    this.recursive = options.recursive ?? true;
  }

  async runOnce() {
    // Get all files in the source directory recursively
    // For each file, check if the path matches any of the RegExp patterns
    // If it does, copy the file to the destination directory, preserving the directory structure

    const files = await fs.readdir(
      this.from,
      { withFileTypes: true, recursive: this.recursive },
    );

    for (const file of files) {
      if (file.isDirectory()) {
        continue;
      }

      const fullPath = `${file.parentPath}/${file.name}`;
      const relativePath = fullPath.replace(this.from, "");
      const matchesRegex = this.files?.some((regex) => regex.test(relativePath)) ?? true;

      if (!matchesRegex) {
        continue;
      }

      const fullDestinationPath = `${this.to}/${relativePath}`;
      const destinationDirectory = fullDestinationPath.replace(`/${file.name}`, "");

      await fs.mkdir(destinationDirectory, { recursive: true });

      await fs.copyFile(fullPath, fullDestinationPath);
    }
  }

  async runContinuously() {
    // TODO
  }
}