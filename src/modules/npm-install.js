import { BuildModule } from "./build-module.js";
import { exec } from "node:child_process";
import { log, LogLevel } from "../utils/logging.js";
import { buildEvents } from "../events.js";
import { join } from "node:path";
import { debounce } from "../utils/debounce.js";
import { readFile } from "node:fs/promises";
import { fileExists } from "../utils/file-exists.js";
import BuildError from "../build-error.js";
import { resolve } from "path";

/** @import { BuildEventListener } from "../events.js"; */

/**
 * Installs package dependencies using npm.
 */
export class NpmInstall extends BuildModule {
  /** @type {string} */
  from;
  /** @type {string} */
  to;

  /**
   * @param {Object} options
   * @param {string} options.from
   * @param {string} options.to
   */
  constructor(options) {
    super();
    this.from = options.from;
    this.to = options.to;
  }

  async run() {
    log(LogLevel.INFO, `📦 Installing npm dependencies from "${this.from}" to "${this.to}"`);

    const packageJsonPath = join(this.from, "package.json");
    const packageLockJsonPath = join(this.from, "package-lock.json");

    if (!await fileExists(packageJsonPath)) {
      throw new BuildError(`No package.json found in "${this.from}"`);
    }

    if (!await fileExists(packageLockJsonPath)) {
      throw new BuildError(`No package-lock.json found in "${this.from}"`);
    }

    const command = `npm install --omit=dev --install-links --prefix ${this.to}`;
    log(LogLevel.VERBOSE, `Executing "${command}"`);
    const childProcess = exec(command);

    childProcess.stdout?.on("data", (data) => {
      log(LogLevel.VERBOSE, data);
    });

    childProcess.stderr?.on("data", (data) => {
      log(LogLevel.ERROR, data);
    });

    try {
      const exitCode = await new Promise((resolve, reject) => {
        childProcess.on("exit", resolve);
        childProcess.on("error", reject);
      });

      if (exitCode !== 0) {
        throw new Error(`Got non-zero exit code ${exitCode}`);
      }

      buildEvents.hotReload.publish("node_modules/");
    } catch (error) {
      throw new Error(`Failed to install dependencies`);
    }
  }

  async watch() {
    const debouncedRun = debounce(async () => this.run(), 100);

    const absoluteDirectory = resolve(this.from);

    /** @type {BuildEventListener<{ absolute: string, relative: string }>} */
    const handler = async (event) => {
      /**
       * @param {string} filename
       * @return {Promise<void>}
       */
      const checkAgainstFile = async (filename) => {
        const absoluteFile = join(absoluteDirectory, filename);

        if (absoluteFile !== event.data.absolute) {
          return;
        }

        log(LogLevel.VERBOSE, `File "${filename}" changed, running npm install`);
        try {
          await debouncedRun();
        } catch (error) {
          if (error instanceof BuildError) {
            log(LogLevel.ERROR, `${error.message}. Skipping npm install until the issue is resolved.`);
          } else {
            throw error;
          }
        }
      };

      await checkAgainstFile("package.json");
      await checkAgainstFile("package-lock.json");
    };

    buildEvents.fileChanged.subscribe(handler);
  }
}
