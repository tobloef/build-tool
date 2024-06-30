import { BuildModule } from "./build-module.js";
import fs from "fs/promises";
import { join } from "node:path";
import { log, LogLevel } from "../logging.js";
import { buildEvents } from "../events.js";

/**
 * Copies files from one directory to another, preserving the directory structure.
 */
export class Copy extends BuildModule {
  /** @type {string} */
  from;
  /** @type {string} */
  to;
  /** @type {RegExp[] | undefined} */
  files;

  /**
   *
   * @param {Object} options
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

  async run() {
    let logMessage = `📄 Copying files from "${this.from}" to "${this.to}"`;
    if (this.files) {
      logMessage += `, matching ${this.files.map((regex) => `"${regex.source}"`).join(", ")}`;
    }
    log(LogLevel.INFO, logMessage);

    const files = await fs.readdir(
      this.from,
      { withFileTypes: true, recursive: this.recursive },
    );

    for (const file of files) {
      if (file.isDirectory()) {
        continue;
      }

      const fullPath = join(file.parentPath, file.name);

      await this.#copyIfMatch(fullPath);
    }
  }

  async watch() {
    buildEvents.fileChanged.subscribe(async (event) => {
      const fullPath = event.data;

      if (!fullPath.startsWith(this.from)) {
        return;
      }

      await this.#copyIfMatch(fullPath);
    });
  }

  /**
   * @param {string} path
   * @return {Promise<void>}
   */
  async #copyIfMatch(path) {
    const relativePath = path.replace(this.from, "");
    const matchesRegex = this.files?.some((regex) => regex.test(relativePath)) ?? true;

    if (!matchesRegex) {
      return;
    }

    const fullDestinationPath = join(this.to, relativePath);
    const destinationDirectory = fullDestinationPath.replace(/[\/\\][^\/\\]+$/, "");

    await fs.mkdir(destinationDirectory, { recursive: true });

    log(LogLevel.VERBOSE, `Copying ${path} to ${fullDestinationPath}`);
    await fs.copyFile(path, fullDestinationPath);
  }
}
