import { buildEvents, EventTypes } from "../events.js";
import { getOptionalString, getRequiredString } from "../utils/parsing.js";
import { Module } from "./module.js";
import { exec } from "node:child_process";

/**
 * Installs package dependencies using npm.
 */
export class NpmInstallModule extends Module {
  static type = "npm-install";

  /** @type {string | undefined} */
  directory;

  /**
   * @param {Object} options
   * @param {string} [options.label] The label for the module.
   * @param {string} options.directory The directory to run `npm install` in. Should be the directory containing the package.json file.
   */
  constructor(options) {
    super(options);
    this.directory = options.directory;

    buildEvents.addEventListener(EventTypes.FILE_CHANGED, (event) => {
      // TODO: Update the packages if the package.json file changes.
    });
  }

  /**
   * @param {any} json
   * @return {NpmInstallModule}
   */
  static fromJson(json) {
    try {
      return new NpmInstallModule({
        label: getOptionalString(json, "label"),
        directory: getRequiredString(json, "directory"),
      });
    } catch (error) {
      throw new Error(`Error parsing "${this.type}" module: ${error.message}`);
    }
  }

  async run() {
    await exec(`npm install --omit=dev`, { cwd: this.directory });
  }
}