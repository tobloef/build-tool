/**
 * @return {Promise<BuildConfig>}
 */
export function getBuildConfig(): Promise<BuildConfig>;
/** @import {Module} from "./module/index.js"; */
export class BuildConfig {
    /**
     *  @param {Object} options
     *  @param {Module[]} [options.modules]
     *  @param {boolean} [options.watch]
     *  @param {boolean | ServeOptions} [options.serve]
     *  @param {string[]} [options.ignoredFolders]
     */
    constructor(options: {
        modules?: Module[] | undefined;
        watch?: boolean | undefined;
        serve?: boolean | ServeOptions | undefined;
        ignoredFolders?: string[] | undefined;
    });
    /** @type {Module[]} */
    modules: Module[];
    /** @type {boolean} */
    watch: boolean;
    /** @type {ServeOptions | false} */
    serve: ServeOptions | false;
    /** @type {string[]} */
    ignoredFolders: string[];
}
export class ServeOptions {
    /**
     * @param {Object} [options]
     * @param {number} [options.port]
     * @param {string} [options.address]
     * @param {boolean} [options.open]
     */
    constructor(options?: {
        port?: number | undefined;
        address?: string | undefined;
        open?: boolean | undefined;
    } | undefined);
    /** @type {number} */
    port: number;
    /** @type {string} */
    address: string;
    /** @type {boolean} */
    open: boolean;
}
import type { Module } from "./module/index.js";
