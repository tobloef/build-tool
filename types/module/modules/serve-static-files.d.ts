/** @import { IncomingMessage, ServerResponse } from "node:http"; */
/** @import { ResponseData } from "../../server/http-server.js"; */
export class ServeStaticFiles extends Module {
    /**
     * @param {Object} options
     * @param {string} [options.path]
     */
    constructor(options: {
        path?: string | undefined;
    });
    /**
     * Path of the directory to serve static files from.
     * @type {string}
     */
    path: string;
    /**
     * @param {Object} params
     * @param {ResponseData | null} params.data
     * @param {IncomingMessage} params.req
     * @param {ServerResponse<IncomingMessage>} params.res
     * @returns {Promise<ResponseData | null>}
     */
    onHttpResponse(params: {
        data: ResponseData | null;
        req: IncomingMessage;
        res: ServerResponse<IncomingMessage>;
    }): Promise<ResponseData | null>;
}
import { Module } from "../module.js";
import type { ResponseData } from "../../server/http-server.js";
import type { IncomingMessage } from "node:http";
import type { ServerResponse } from "node:http";
