export class HotReload extends Module {
    /**
     * @param {Object} [options]
     * @param {RegExp[]} [options.include]
     */
    constructor(options?: {
        include?: RegExp[] | undefined;
    } | undefined);
    /** @type {RegExp[]} */
    include: RegExp[];
}
import { Module } from "../module.js";
