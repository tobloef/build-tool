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
export class ImportMaps extends Module {
    /**
     * @param {Object} options
     * @param {string} options.path Path to the file or directory of files to inject the import map into.
     * @param {RegExp[]} [options.include=[]] If specified and the path is a directory, only files matching these patterns will have the import map injected.
     * @param {RegExp[]} [options.exclude=[]] If specified and the path is a directory, files matching these patterns will not have the import map injected.
     * @param {string} [options.packagePath="."] Path of the package to generate the import map for. This should be the directory containing the package.json file.
     * @param {boolean} [options.serve=true] Whether to inject import maps into files served by the development server.
     * @param {boolean} [options.write=false] Whether to write the import map into files in the specified path.
     */
    constructor(options: {
        path: string;
        include?: RegExp[] | undefined;
        exclude?: RegExp[] | undefined;
        packagePath?: string | undefined;
        serve?: boolean | undefined;
        write?: boolean | undefined;
    });
    /** @type {string} */
    path: string;
    /** @type {RegExp[]} */
    include: RegExp[];
    /** @type {RegExp[]} */
    exclude: RegExp[];
    /** @type {string} */
    packagePath: string;
    /** @type {boolean} */
    serve: boolean;
    /** @type {boolean} */
    write: boolean;
    #private;
}
export type ImportMap = {
    imports: Record<string, string>;
    scopes: Record<string, Record<string, string>>;
};
import { Module } from "../module.js";
