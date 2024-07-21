import { Module } from "../module.js";
import {
  log,
  LogLevel,
} from "../../utils/logging.js";
import { rm } from "node:fs/promises";

/** @import { BuildConfig } from "../../build-config.js"; */

export class Clean extends Module {
  /**
   * Path to the directory to clean.
   * @type {string}
   */
  path;

  /**
   * @param {Object} options
   * @param {string} options.path
   */
  constructor(options) {
    super();
    this.path = options.path;
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    await super.onBuild(params);

    log(LogLevel.INFO, `🧹 Cleaning directory "${this.path}"`);

    await rm(this.path, { recursive: true, force: true });
  }
}
