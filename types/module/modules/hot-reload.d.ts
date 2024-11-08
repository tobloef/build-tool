export class HotReload extends Module {
    /**
     * @param {Object} [options]
     * @param {RegExp[]} [options.include]
     * @param {RegExp[]} [options.exclude]
     * @param {boolean} [options.hotModuleReplacement]
     */
    constructor(options?: {
        include?: RegExp[] | undefined;
        exclude?: RegExp[] | undefined;
        hotModuleReplacement?: boolean | undefined;
    } | undefined);
    /** @type {RegExp[]} */
    include: RegExp[];
    /** @type {RegExp[]} */
    exclude: RegExp[];
    /** @type {boolean} */
    hotModuleReplacement: boolean;
}
import { Module } from "../module.js";
