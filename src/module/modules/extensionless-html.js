import { Module } from "../module.js";
import { readFile } from "node:fs/promises";
import { fileExists } from "../../utils/file-exists.js";
import { getContentTypeByPath } from "../../utils/content-type.js";

/** @import { IncomingMessage, ServerResponse } from "node:http"; */

export class ExtensionlessHtml extends Module {

  /**
   * @param {Object} params
   * @param {IncomingMessage} params.req
   * @param {ServerResponse<IncomingMessage>} params.res
   */
  async onHttpRequest(params) {
    const { req } = params;

    if (req.url === undefined) {
      return;
    }

    const lastPathPart = req.url.split("/").pop();
    const hasExtension = lastPathPart?.includes(".") ?? false;

    if (hasExtension) {
      return;
    }

    const fileWithoutExtensionExists = await fileExists(req.url);

    if (fileWithoutExtensionExists) {
      return;
    }

    const urlWithExtension = `${req.url}.html`;

    const typeWithExtensionExists = await fileExists(urlWithExtension);

    if (typeWithExtensionExists) {
      req.url = urlWithExtension;
      return;
    }

    const urlWithIndexHtml = `${req.url}/index.html`;

    const indexHtmlExists = await fileExists(urlWithIndexHtml);

    if (indexHtmlExists) {
      req.url = urlWithIndexHtml;
      return;
    }
  }
}