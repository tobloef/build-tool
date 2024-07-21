/** @import { BuildEventListener } from "../../events.js"; */
/** @import { BuildConfig } from "../../build-config.js"; */
export class NpmInstall extends Module {
    /**
     * @param {Object} options
     * @param {string} [options.path]
     */
    constructor(options: {
        path?: string | undefined;
    });
    /**
     * Path to the package to install dependencies in.
     * This should be the directory containing the package.json file.
     * @type {string}
     */
    path: string;
    #private;
}
import { Module } from "../module.js";
