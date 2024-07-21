import { randomString } from "../../utils/random-string.js";
import { ContentType } from "../../utils/content-type.js";
import { Module } from "../module.js";
import { normalizeSlashes } from "../../utils/paths.js";
import { resolve } from "path";
import { buildEvents } from "../../events.js";

/** @import { IncomingMessage, ServerResponse } from "node:http"; **/

/** @import { ResponseData } from "../../server/http-server.js"; **/
/** @import { BuildConfig } from "../../build-config.js"; **/

const INJECTED_PATH = `/${randomString(16)}/hot-reload-listener.js`;

export class HotReload extends Module {
  /** @type {RegExp[]} */
  include;

  /**
   * @param {Object} options
   * @param {RegExp[]} [options.include]
   */
  constructor(options) {
    super();
    this.include = options.include ?? [/\.js$/];
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    const { buildConfig } = params;
    
    let absoluteBuildPath = normalizeSlashes(resolve(buildConfig.root));
    if (!absoluteBuildPath.endsWith("/")) {
      absoluteBuildPath += "/";
    }

    buildEvents.fileChanged.subscribe(async (event) => {
      if (!event.data.absolute.startsWith(absoluteBuildPath)) {
        return;
      }

      const path = event.data.absolute.slice(absoluteBuildPath.length);
      const canonicalPath = path;

      if (!this.include.some((pattern) => pattern.test(canonicalPath))) {
        return;
      }

      buildEvents.hotReload.publish(canonicalPath);
    });
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   * @param {IncomingMessage} params.req
   * @param {ServerResponse<IncomingMessage>} params.res
   */
  async onHttpRequest(params) {
    const { req, res } = params;

    if (!req.url) {
      return;
    }

    if (req.url !== INJECTED_PATH) {
      return;
    }

    res.statusCode = 200;
    res.setHeader("Content-Type", "application/javascript");
    res.end(getHotReloadListenerScript());
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   * @param {ResponseData | null} params.data
   * @param {IncomingMessage} params.req
   * @param {ServerResponse<IncomingMessage>} params.res
   * @returns {Promise<ResponseData | null>}
   */
  async onHttpResponse(params) {
    const { data, req } = params;

    if (data === null) {
      return data;
    }

    if (!req.url) {
      return data;
    }

    if (data.type === ContentType.HTML) {
      data.content = injectHtmlWithHotReloadListenerScript(data.content);
    }

    const isNodeModule = req.url.split("/").includes("node_modules");
    const isInjected = req.url === INJECTED_PATH;
    const shouldInject = !isNodeModule && !isInjected;

    if (data.type === ContentType.JS && shouldInject) {
      data.content = injectJsWithHotModuleReplacement(data.content);
    }

    return data;
  }
}

function getHotReloadListenerScript() {
  // language=JavaScript
  return `
    import { HotReload } from "@tobloef/hot-reload";

    const hotReload = new HotReload(window.location.origin);

    export const socket = new WebSocket(\`ws://${window.location.host}\`);

    socket.addEventListener("message", handleMessage);

    socket.addEventListener("open", () => {
      const hotEmoji = String.fromCodePoint(0x1F525);
      console.info(\`\${hotEmoji} Hot reloading enabled\`);
    });

    /**
     * @param {MessageEvent} event
     */
    async function handleMessage(event) {
      const prefix = "hot reload: ";

      if (!event.data.startsWith(prefix)) {
        return;
      }

      const canonicalPath = event.data.slice(prefix.length);

      const wasAccepted = await hotReload.reload(canonicalPath);

      if (!wasAccepted) {
        console.debug(\`Hot reload for "\${canonicalPath}" was not accepted, reloading the page\`);
        window.location.reload();
        return;
      }

      console.debug(\`Hot reload for "\${canonicalPath}" was accepted\`);
    }
  `;
}

/** @param {Buffer} fileContent */
function injectHtmlWithHotReloadListenerScript(fileContent) {
  // TODO
  return fileContent;
}

/** @param {Buffer} fileContent */
function injectJsWithHotModuleReplacement(fileContent) {
  // TODO
  return fileContent;
}
