/** @import { IncomingMessage, ServerResponse } from "node:http"; **/
/** @import { ResponseData } from "../../server/http-server.js"; **/
/** @import { BuildConfig } from "../../build-config.js"; **/
/**
 * @typedef {Object} ImportMap
 * @property {Record<string, string>} imports
 * @property {Record<string, Record<string, string>>} scopes
 */
/**
 * Generates an import map for the project's dependencies.
 */
export class GenerateImportMap extends Module {
    /**
     * @param {Object} [options]
     * @param {string} [options.outputPath]
     * @param {boolean} [options.serve]
     * @param {string} [options.packagePath]
     * @param {RegExp[]} [options.exclude]
     */
    constructor(options?: {
        outputPath?: string | undefined;
        serve?: boolean | undefined;
        packagePath?: string | undefined;
        exclude?: RegExp[] | undefined;
    } | undefined);
    /**
     * If set, the import map will be injected into the HTML file(s) at this path.
     * Can the path to a file or a directory.
     * @type {string | null}
     */
    outputPath: string | null;
    /**
     * Whether to automatically inject the import map into served HTML files.
     * @type {boolean}
     */
    serve: boolean;
    /**
     * Path of the package to generate the import map for.
     * This should be the directory containing the package.json file.
     * @type {string}
     */
    packagePath: string;
    /**
     * Files to exclude from the import map.
     * @type {RegExp[]}
     */
    exclude: RegExp[];
    #private;
}
export type ImportMap = {
    imports: Record<string, string>;
    scopes: Record<string, Record<string, string>>;
};
import { Module } from "../module.js";
