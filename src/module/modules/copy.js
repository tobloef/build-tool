import { Module } from "../module.js";
import { log, LogLevel } from "../../utils/logging.js";
import { readdir } from "node:fs/promises";
import { join, normalize } from "node:path";
import { buildEvents } from "../../events.js";
import { dirname, resolve } from "path";
import { fileExists } from "../../utils/file-exists.js";
import fs from "fs/promises";

/** @import { BuildConfig } from "../../build-config.js"; */

export class Copy extends Module {
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

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
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

    let somethingWasCopied = false;

    for (const file of files) {
      if (file.isDirectory()) {
        continue;
      }

      const relativePath = join(file.parentPath, file.name);

      if (relativePath.startsWith(this.to) && this.from !== this.to) {
        continue;
      }

      somethingWasCopied ||= await this.#copyFileIfIncluded(relativePath);
    }

    if (!somethingWasCopied) {
      log(LogLevel.WARNING, `No files were copied`);
    }
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    buildEvents.fileChanged.subscribe(async (event) => {
      const startsWithFrom = event.data.relative.startsWith(this.from);

      const fromIsWorkingDirectory = this.from === "." || this.from === "./";
      const isInFromFolder = fromIsWorkingDirectory || startsWithFrom;
      const isInToFolder = event.data.relative.startsWith(this.to);

      if (!isInFromFolder || (isInToFolder && this.from !== this.to)) {
        return;
      }

      await this.#copyFileIfIncluded(event.data.relative);
    });
  }

  /**
   * @param {string} path
   * @return {Promise<boolean>}
   */
  async #copyFileIfIncluded(path) {
    const absolutePath = resolve(path);

    let absoluteFrom = resolve(this.from);
    if (!absoluteFrom.endsWith("/")) {
      absoluteFrom += "/";
    }

    const relativeToFrom = absolutePath.replace(absoluteFrom, "");

    const matchesInclude = this.include?.some((regex) => regex.test(relativeToFrom)) ?? true;
    const matchesExclude = this.exclude?.some((regex) => regex.test(relativeToFrom)) ?? false;

    if (!matchesInclude || matchesExclude) {
      return false;
    }

    const relativeToDestination = join(this.to, relativeToFrom);
    const destinationDirectory = dirname(relativeToDestination);

    if (!await fileExists(path)) {
      if (await fileExists(relativeToDestination)) {
        log(LogLevel.VERBOSE, `Deleting ${path} from ${destinationDirectory}`);
        await fs.rm(relativeToDestination);
      }
    } else {
      await fs.mkdir(destinationDirectory, { recursive: true });

      log(LogLevel.VERBOSE, `Copying ${path} to ${relativeToDestination}`);

      await fs.copyFile(path, relativeToDestination);
    }

    return true;
  }
}