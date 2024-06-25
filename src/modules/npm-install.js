import { Module } from "./module.js";
import { exec } from "node:child_process";
import { getLogLevel, log, LogLevel } from "../logging.js";

/**
 * Installs package dependencies using npm.
 */
export class NpmInstall extends Module {
  /** @type {string | undefined} */
  directory;

  /**
   * @param {Object} options
   * @param {string} options.label The label for the module.
   * @param {string} options.directory The directory to run `npm install` in. Should be the directory containing the package.json file.
   */
  constructor(options) {
    super(options);
    this.directory = options.directory;
  }

  async runOnce() {
    const command = `npm install --omit=dev`;
    log(LogLevel.VERBOSE, `Executing "${command}" in ${this.directory}`);
    const childProcess = await exec(command, { cwd: this.directory });

    const logLevel = getLogLevel();

    if (logLevel <= LogLevel.VERBOSE) {
      childProcess.stdout?.pipe(process.stdout);
    }

    if (logLevel <= LogLevel.ERROR) {
      childProcess.stderr?.pipe(process.stderr);
    }

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

  async runContinuously() {
    // TODO
  }
}
