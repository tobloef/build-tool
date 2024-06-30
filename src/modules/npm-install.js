import { BuildModule } from "./build-module.js";
import { exec } from "node:child_process";
import { log, LogLevel } from "../logging.js";
import { buildEvents } from "../events.js";
import { join } from "node:path";
import { debounce } from "../utils/debounce.js";
import { readFile } from "node:fs/promises";

/** @import { BuildEventListener } from "../events.js"; */

/**
 * Installs package dependencies using npm.
 */
export class NpmInstall extends BuildModule {
  /** @type {string | undefined} */
  directory;

  /** @type {string | null} */
  #packageJsonCache = null;
  /** @type {string | null} */
  #packageLockJsonCache = null;

  /**
   * @param {Object} options
   * @param {string} options.directory The directory to run `npm install` in. Should be the directory containing the package.json file.
   */
  constructor(options) {
    super(options);
    this.directory = options.directory;
  }

  async run() {

    const packageJson = await readFile(join(this.directory ?? "", "package.json"), "utf-8");
    const packageLockJson = await readFile(join(this.directory ?? "", "package-lock.json"), "utf-8");

    if (this.#packageJsonCache === packageJson && this.#packageLockJsonCache === packageLockJson) {
      log(LogLevel.VERBOSE, "Skipping npm install because package files haven't changed");
      return;
    }

    log(LogLevel.INFO, `📦 Installing npm dependencies in ${this.directory}`);

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
    } catch (error) {
      throw new Error(`Failed to install dependencies`);
    }
  }

  async watch() {
    const debouncedRun = debounce(() => this.run(), 100);

    /** @type {BuildEventListener<string>} */
    const handler = async (event) => {
      const path = event.data;

      if (join(this.directory ?? "", "package.json") === path) {
        await debouncedRun();
      }

      if (join(this.directory ?? "", "package-lock.json") === path) {
        await debouncedRun();
      }
    };

    buildEvents.fileChanged.subscribe(handler);
  }
}
