import { buildEvents, EventTypes } from "../events.js";
import { getOptionalString, getOptionalStringArray, getRequiredString } from "../utils/parsing.js";
import { Module } from "./module.js";
import { copyFile, cp, glob, lstat, mkdir } from "node:fs/promises";

/**
 * Copies files from one directory to another, preserving the directory structure.
 */
export class CopyModule extends Module {
  static type = "copy";

  /** @type {string} */
  from;
  /** @type {string} */
  to;
  /** @type {string[]} */
  files;

  /**
   *
   * @param {Object} options
   * @param {string} [options.label] The label for the module.
   * @param {string} options.from The source directory to copy files from.
   * @param {string} options.to The destination directory to copy files to.
   * @param {string[]} [options.files] The glob patterns to match the files to copy. Otherwise, all files are copied.
   */
  constructor(options) {
    super(options);
    this.from = options.from;
    this.to = options.to;
    this.files = options.files ?? ["**/*"];


    buildEvents.addEventListener(EventTypes.FILE_CHANGED, (event) => {
      // TODO: Copy the file to the destination if it matches a glob pattern.
    });
  }

  /**
   * @param {any} json
   * @return {CopyModule}
   */
  static fromJson(json) {
    try {
      return new CopyModule({
        label: getOptionalString(json, "label"),
        from: getRequiredString(json, "from"),
        to: getRequiredString(json, "to"),
        files: getOptionalStringArray(json, "files"),
      });
    } catch (error) {
      throw new Error(`Error parsing "${this.type}" module: ${error.message}`);
    }
  }

  async run() {
    for (const file of this.files) {
      const matches = await glob(file, { cwd: this.from });
      for await (const match of matches) {
        const source = `${this.from}/${match}`;
        const destination = `${this.to}/${match}`;
        const stats = await lstat(source);
        if (stats.isDirectory()) {
          await cp(source, destination, { recursive: true });
        } else {
          const destinationDir = destination.substring(0, destination.lastIndexOf("/"));
          await mkdir(destinationDir, { recursive: true });
          await copyFile(source, destination);
        }
      }
    }
  }
}