import { Module } from "../module.js";
import { readFile } from "node:fs/promises";
import { fileExists } from "../../utils/file-exists.js";
import { getContentTypeByPath } from "../../utils/content-type.js";
import { join } from "../../utils/paths.js";

/** @import { IncomingMessage, ServerResponse } from "node:http"; */
/** @import { ResponseData } from "../../server/http-server.js"; */

export class ServeStaticFiles extends Module {
  /**
   * Path of the directory to serve static files from.
   * @type {string}
   */
  path;

  /**
   * @param {Object} options
   * @param {string} [options.path]
   */
  constructor(options) {
    super();
    this.path = options.path ?? "./";
  }

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

    let filePath = req.url.split("?")[0];

    if (filePath.startsWith("/")) {
      filePath = filePath.slice(1);
    }

    filePath = join(this.path, filePath);

    if (!await fileExists(filePath)) {
      return data;
    }

    const type = getContentTypeByPath(filePath);
    const content = await readFile(filePath);

    return {
      type,
      content
    };
  }
}
