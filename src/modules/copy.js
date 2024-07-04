import { BuildModule } from "./build-module.js";
import fs from "fs/promises";
import { join } from "node:path";
import { log, LogLevel } from "../utils/logging.js";
import { buildEvents } from "../events.js";
import { DEFAULT_BUILD_DIR, DEFAULT_SOURCE_DIR } from "../constants.js";
import { fileExists } from "../utils/file-exists.js";
import { readdir } from "node:fs/promises";
import { escapeRegExp } from "../utils/escape-regex.js";
import { dirname, resolve } from "path";

/**
 * Copies files from one directory to another, preserving the directory structure.
 */
export class Copy extends BuildModule {
  /** @type {string} */
  from = DEFAULT_SOURCE_DIR;
  /** @type {string} */
  to = DEFAULT_BUILD_DIR;
  /** @type {RegExp[] | null} */
  files = null;
  /** @type {boolean} */
  recursive = true;

  /**
   *
   * @param {Object} options
   * @param {string} [options.from]
   * @param {string} [options.to]
   * @param {RegExp[]} [options.files]
   * @param {boolean} [options.recursive]
   */
  constructor(options) {
    super();
    this.from = options.from ?? this.from;
    this.to = options.to ?? this.to;
    this.files = options.files ?? this.files;
    this.recursive = options.recursive ?? this.recursive;
  }

  async run() {
    let logMessage = `📄 Copying files from "${this.from}" to "${this.to}"`;
    if (this.files) {
      logMessage += `, matching ${this.files.map((regex) => `"${regex.source}"`).join(", ")}`;
    }
    log(LogLevel.INFO, logMessage);

    const files = await readdir(
      this.from,
      { withFileTypes: true, recursive: this.recursive },
    );

    for (const file of files) {
      if (file.isDirectory()) {
        continue;
      }

      const relativePath = join(file.parentPath, file.name);

      await this.#copyIfMatch(relativePath);
    }
  }

  async watch() {
    buildEvents.fileChanged.subscribe(async (event) => {
      if (!event.data.relative.startsWith(this.from)) {
        return;
      }

      await this.#copyIfMatch(event.data.relative);
    });
  }

  /**
   * @param {string} relativePath
   * @return {Promise<void>}
   */
  async #copyIfMatch(relativePath) {
    const absolutePath = resolve(relativePath);
    const absoluteFrom = resolve(this.from);
    const relativeToFrom = absolutePath.replace(absoluteFrom, "");
    const matchesRegex = this.files?.some((regex) => regex.test(relativeToFrom)) ?? true;

    if (!matchesRegex) {
      return;
    }

    const relativeToDestination = join(this.to, relativeToFrom);
    const destinationDirectory = dirname(relativeToDestination);

    if (!await fileExists(relativePath)) {
      if (await fileExists(relativeToDestination)) {
        log(LogLevel.VERBOSE, `Deleting ${relativePath} from ${destinationDirectory}`);
        await fs.rm(relativeToDestination);
      }
    } else {
      await fs.mkdir(destinationDirectory, { recursive: true });

      log(LogLevel.VERBOSE, `Copying ${relativePath} to ${relativeToDestination}`);

      await fs.copyFile(relativePath, relativeToDestination);
    }
  }
}
