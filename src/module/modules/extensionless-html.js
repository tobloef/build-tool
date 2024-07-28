import { Module } from "../module.js";
import { fileExists } from "../../utils/file-exists.js";

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

    let path = req.url.split("?")[0];
    if (path.startsWith("/")) {
      path = path.slice(1);
    }

    const lastPathPart = path.split("/").pop();
    const hasExtension = lastPathPart?.includes(".") ?? false;

    if (hasExtension) {
      return;
    }

    const fileWithoutExtensionExists = await fileExists(path);

    if (fileWithoutExtensionExists) {
      return;
    }

    const pathWithExtension = `${path}.html`;

    const typeWithExtensionExists = await fileExists(pathWithExtension);

    if (path !== "" && typeWithExtensionExists) {
      req.url = `/${pathWithExtension}`;
      return;
    }

    let pathWithIndexHtml = path;
    if (!pathWithIndexHtml.endsWith("/") && pathWithIndexHtml !== "") {
      pathWithIndexHtml += "/";
    }
    pathWithIndexHtml += "index.html";

    const urlWithIndexHtml = `/${pathWithIndexHtml}`;

    req.url = urlWithIndexHtml;
  }
}
