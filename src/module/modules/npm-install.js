import { Module } from "../module.js";
import {
  log,
  LogLevel,
} from "../../utils/logging.js";
import { join } from "node:path";
import BuildError from "../../build-error.js";
import { fileExists } from "../../utils/file-exists.js";
import { exec } from "child_process";
import { buildEvents } from "../../events.js";
import { debounce } from "../../utils/debounce.js";
import { getAbsolutePath } from "../../utils/get-absolute-path.js";

/** @import { BuildEventListener } from "../../events.js"; */
/** @import { BuildConfig } from "../../build-config.js"; */

export class NpmInstall extends Module {
  /**
   * Path to the package to install dependencies in.
   * This should be the directory containing the package.json file.
   * @type {string}
   */
  path;

  /**
   * @param {Object} options
   * @param {string} [options.path]
   */
  constructor(options) {
    super();
    this.path = options.path ?? "./";
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    await super.onBuild(params);

    log(LogLevel.INFO, `📦 Installing npm dependencies in "${this.path}"`);

    const packageJsonPath = join(this.path, "package.json");

    if (!await fileExists(packageJsonPath)) {
      throw new BuildError(`No package.json found in "${this.path}"`);
    }

    await this.#install();
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    await super.onWatch(params);

    const debouncedInstall = debounce(() => this.#install(), 100);

    /** @type {BuildEventListener<{ absolute: string, relative: string }>} */
    const handler = async (event) => {
      const absolutePackageJsonPath = getAbsolutePath(join(this.path, "package.json"));

      if (event.data.absolute !== absolutePackageJsonPath) {
        return;
      }

      log(LogLevel.VERBOSE, `File "package.json" changed, running npm install`);

      await debouncedInstall();
    };

    buildEvents.fileChanged.subscribe(handler);
  }

  async #install() {
    const command = `npm install --omit=dev --install-links`;
    log(LogLevel.VERBOSE, `Executing "${command}"`);

    const childProcess = exec(command, { cwd: this.path });

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
      log(LogLevel.ERROR, `Failed to install dependencies: ${error.message}`);
      throw new BuildError(`Failed to install dependencies`);
    }
  }
}
