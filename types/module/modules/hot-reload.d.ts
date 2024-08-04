export class HotReload extends Module {
    /**
     * @param {Object} [options]
     * @param {RegExp[]} [options.include]
     * @param {boolean} [options.hotModuleReplacement]
     */
    constructor(options?: {
        include?: RegExp[] | undefined;
        hotModuleReplacement?: boolean | undefined;
    } | undefined);
    /** @type {RegExp[]} */
    include: RegExp[];
    /** @type {boolean} */
    hotModuleReplacement: boolean;
}
import { Module } from "../module.js";
