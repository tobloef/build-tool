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
  directory;

  /** @type {string | null} */
  #packageJsonCache = null;
  /** @type {string | null} */
  #packageLockJsonCache = null;

  /**
   * @param {Object} options
   * @param {string} options.directory
   */
  constructor(options) {
    super();
    this.directory = options.directory;
  }

  async run() {
    log(LogLevel.INFO, `📦 Installing npm dependencies in "${this.directory}"`);

    const packageJsonPath = join(this.directory, "package.json");
    const packageLockJsonPath = join(this.directory, "package-lock.json");

    if (!await fileExists(packageJsonPath)) {
      throw new BuildError(`No package.json found in "${this.directory}"`);
    }

    if (!await fileExists(packageLockJsonPath)) {
      throw new BuildError(`No package-lock.json found in "${this.directory}"`);
    }

    const packageJson = await readFile(packageJsonPath, "utf-8");
    const packageLockJson = await readFile(packageLockJsonPath, "utf-8");

    this.#packageJsonCache = packageJson;
    this.#packageLockJsonCache = packageLockJson;

    const command = `npm install --omit=dev`;
    log(LogLevel.VERBOSE, `Executing "${command}" in ${this.directory}`);
    const childProcess = await exec(command, { cwd: this.directory });

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

    const absoluteDirectory = resolve(this.directory);

    /** @type {BuildEventListener<{ absolute: string, relative: string }>} */
    const handler = async (event) => {
      /**
       * @param {string} filename
       * @param {string | null} cache
       * @return {Promise<void>}
       */
      const checkAgainstFile = async (filename, cache) => {
        const absoluteFile = join(absoluteDirectory, filename);

        if (absoluteFile === event.data.absolute) {
          if (await fileExists(absoluteFile)) {
            const fileData = await readFile(absoluteFile, "utf-8");
            if (fileData === cache) return;
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
        }
      };

      await checkAgainstFile("package.json", this.#packageJsonCache);
      await checkAgainstFile("package-lock.json", this.#packageLockJsonCache);
    };

    buildEvents.fileChanged.subscribe(handler);
  }
}
