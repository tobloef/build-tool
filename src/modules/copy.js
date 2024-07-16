import { BuildModule } from "./build-module.js";
import fs from "fs/promises";
import { join } from "node:path";
import { log, LogLevel } from "../utils/logging.js";
import { buildEvents } from "../events.js";
import { fileExists } from "../utils/file-exists.js";
import { readdir } from "node:fs/promises";
import { dirname, resolve } from "path";

/**
 * Copies files from one directory to another, preserving the directory structure.
 */
export class Copy extends BuildModule {
  /** @type {string} */
  from;
  /** @type {string} */
  to;
  /** @type {RegExp[] | null} */
  include;
  /** @type {RegExp[] | null} */
  exclude;
  /** @type {boolean} */
  recursive;

  /**
   *
   * @param {Object} options
   * @param {string} options.from
   * @param {string} options.to
   * @param {RegExp[]} [options.include]
   * @param {RegExp[]} [options.exclude]
   * @param {boolean} [options.recursive]
   */
  constructor(options) {
    super();
    this.from = options.from;
    this.to = options.to;
    this.include = options.include ?? null;
    this.exclude = options.exclude ?? null;
    this.recursive = options.recursive ?? true;
  }

  async run() {
    let logMessage = `📄 Copying files from "${this.from}" to "${this.to}"`;

    if (this.include) {
      logMessage += `, including ${this.include.map((regex) => `"${regex.source}"`).join(", ")}`;
    }

    if (this.exclude) {
      logMessage += `, excluding ${this.exclude.map((regex) => `"${regex.source}"`).join(", ")}`;
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

      if (relativePath.startsWith(this.to) && this.from !== this.to) {
        continue;
      }

      await this.#copyIfMatch(relativePath);
    }
  }

  async watch() {
    buildEvents.fileChanged.subscribe(async (event) => {
      const startsWithFrom = event.data.relative.startsWith(this.from);

      const fromIsWorkingDirectory = this.from === "." || this.from === "./";
      const isInFromFolder = fromIsWorkingDirectory || startsWithFrom;
      const isInToFolder = event.data.relative.startsWith(this.to);

      if (!isInFromFolder || (isInToFolder && this.from !== this.to)) {
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

    const matchesInclude = this.include?.some((regex) => regex.test(relativeToFrom)) ?? true;
    const matchesExclude = this.exclude?.some((regex) => regex.test(relativeToFrom)) ?? false;

    if (!matchesInclude || matchesExclude) {
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
