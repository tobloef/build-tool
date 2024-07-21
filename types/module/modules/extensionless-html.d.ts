/** @import { IncomingMessage, ServerResponse } from "node:http"; */
export class ExtensionlessHtml extends Module {
    /**
     * @param {Object} params
     * @param {IncomingMessage} params.req
     * @param {ServerResponse<IncomingMessage>} params.res
     */
    onHttpRequest(params: {
        req: IncomingMessage;
        res: ServerResponse<IncomingMessage>;
    }): Promise<void>;
}
import { Module } from "../module.js";
import type { IncomingMessage } from "node:http";
import type { ServerResponse } from "node:http";
