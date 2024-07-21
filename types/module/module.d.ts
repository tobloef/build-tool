/** @import { IncomingMessage, ServerResponse } from "node:http"; **/
/** @import { ParseArgsConfig } from "node:util"; **/
/** @import { ResponseData } from "../server/http-server.js"; **/
/** @import { BuildConfig } from "../build-config.js"; **/
/** @typedef {Exclude<ParseArgsConfig["options"], undefined>} CliOptions */
/**
 * @abstract
 */
export class Module {
    /** @type {CliOptions} */
    static cliOptions: CliOptions;
    /**
     * Called when the project is being built.
     * @param {Object} params
     * @param {BuildConfig} params.buildConfig
     */
    onBuild(params: {
        buildConfig: BuildConfig;
    }): Promise<void>;
    /**
     * Called when the project starts watching for changes.
     * @param {Object} params
     * @param {BuildConfig} params.buildConfig
     */
    onWatch(params: {
        buildConfig: BuildConfig;
    }): Promise<void>;
    /**
     * Called before the HTTP server starts handling a request.
     * @param {Object} params
     * @param {BuildConfig} params.buildConfig
     * @param {IncomingMessage} params.req
     * @param {ServerResponse<IncomingMessage>} params.res
     */
    onHttpRequest(params: {
        buildConfig: BuildConfig;
        req: IncomingMessage;
        res: ServerResponse<IncomingMessage>;
    }): Promise<void>;
    /**
     * Called before the HTTP server sends a response.
     * @param {Object} params
     * @param {BuildConfig} params.buildConfig
     * @param {ResponseData | null} params.data
     * @param {IncomingMessage} params.req
     * @param {ServerResponse<IncomingMessage>} params.res
     * @returns {Promise<ResponseData | null>}
     */
    onHttpResponse(params: {
        buildConfig: BuildConfig;
        data: ResponseData | null;
        req: IncomingMessage;
        res: ServerResponse<IncomingMessage>;
    }): Promise<ResponseData | null>;
}
export type CliOptions = Exclude<ParseArgsConfig["options"], undefined>;
import type { BuildConfig } from "../build-config.js";
import type { IncomingMessage } from "node:http";
import type { ServerResponse } from "node:http";
import type { ResponseData } from "../server/http-server.js";
import type { ParseArgsConfig } from "node:util";
