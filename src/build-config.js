/** @import {Module} from "./modules/module.js"; */
import { CopyModule } from "./modules/copy.js";
import { NpmInstallModule } from "./modules/npm-install.js";

export class BuildConfig {
  /** @type {Module[]} */
  pipeline;

  /**
   *  @param {Object} options
   *  @param {Module[]} options.pipeline The modules to run in the build pipeline.
   */
  constructor(options) {
    this.pipeline = options.pipeline;
  }


  /**
   * @param {any} json
   * @return {BuildConfig}
   */
  static fromJSON(json) {
    if (!Array.isArray(json.pipeline)) {
      throw new Error(`Expected "pipeline" to be an array of modules.`);
    }

    const pipeline = json.pipeline.map((/** @type {any} */ moduleJson) => {
      if (!moduleJson.module) {
        throw new Error(`Expected module to have a "module" property.`);
      }

      const options = { label: moduleJson.label, ...moduleJson.options };

      switch (moduleJson.module) {
        case CopyModule.type:
          return CopyModule.fromJson(options);
        case NpmInstallModule.type:
          return NpmInstallModule.fromJson(options);
        default:
          throw new Error(`Unknown module: ${moduleJson.module}`);
      }
    });

    return new BuildConfig({
      pipeline,
    });
  }
}