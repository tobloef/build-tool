/** @import { BuildConfig } from "../../build-config.js"; */
export class Clean extends Module {
    /**
     * @param {Object} options
     * @param {string} options.path
     */
    constructor(options: {
        path: string;
    });
    /**
     * Path to the directory to clean.
     * @type {string}
     */
    path: string;
}
import { Module } from "../module.js";
