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
  static cliOptions = {};

  /**
   * Called when the project is being built.
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {}

  /**
   * Called when the project starts watching for changes.
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {}

  /**
   * Called before the HTTP server starts handling a request.
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   * @param {IncomingMessage} params.req
   * @param {ServerResponse<IncomingMessage>} params.res
   */
  async onHttpRequest(params) {}

  /**
   * Called before the HTTP server sends a response.
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   * @param {ResponseData | null} params.data
   * @param {IncomingMessage} params.req
   * @param {ServerResponse<IncomingMessage>} params.res
   * @returns {Promise<ResponseData | null>}
   */
  async onHttpResponse(params) {
    return params.data;
  }
}