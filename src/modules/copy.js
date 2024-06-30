import { BuildModule } from "./build-module.js";
import fs from "fs/promises";
import { join } from "node:path";
import { log, LogLevel } from "../utils/logging.js";
import { buildEvents } from "../events.js";
import { DEFAULT_BUILD_DIR, DEFAULT_SOURCE_DIR } from "../constants.js";
import { fileExists } from "../utils/file-exists.js";
import { readdir } from "node:fs/promises";
import { escapeRegExp } from "../utils/escape-regex.js";

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
    const relativePath = path.replace(new RegExp(`^${escapeRegExp(this.from)}`), "");
    const matchesRegex = this.files?.some((regex) => regex.test(relativePath)) ?? true;

    if (!matchesRegex) {
      return;
    }

    const fullDestinationPath = join(this.to, relativePath);
    const destinationDirectory = fullDestinationPath.replace(/[\/\\][^\/\\]+$/, "");

    if (!await fileExists(path)) {
      if (await fileExists(fullDestinationPath)) {
        log(LogLevel.VERBOSE, `Deleting ${path} from ${fullDestinationPath}`);
        await fs.rm(fullDestinationPath);
      }
    } else {
      await fs.mkdir(destinationDirectory, { recursive: true });

      log(LogLevel.VERBOSE, `Copying ${path} to ${fullDestinationPath}`);
      await fs.copyFile(path, fullDestinationPath);
    }

    buildEvents.liveReload.publish();
  }
}
