import { Module } from "../module.js";
import { readFile } from "node:fs/promises";
import { fileExists } from "../../utils/file-exists.js";
import { getContentTypeByPath } from "../../utils/content-type.js";

/** @import { IncomingMessage, ServerResponse } from "node:http"; */
/** @import { ResponseData } from "../../server/http-server.js"; */

export class ServeStaticFiles extends Module {

  /**
   * @param {Object} params
   * @param {ResponseData | null} params.data
   * @param {IncomingMessage} params.req
   * @param {ServerResponse<IncomingMessage>} params.res
   * @returns {Promise<ResponseData | null>}
   */
  async onHttpResponse(params) {
    const { data, req } = params;

    if (data) {
      return data;
    }

    if (req.url === undefined) {
      return data;
    }

    let path = req.url.split("?")[0];
    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    if (!await fileExists(path)) {
      return data;
    }

    const type = getContentTypeByPath(path);
    const content = await readFile(path);

    return {
      type,
      content
    };
  }
}
