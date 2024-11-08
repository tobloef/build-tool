import { randomString } from "../../utils/random-string.js";
import { ContentType } from "../../utils/content-type.js";
import { Module } from "../module.js";
import { buildEvents } from "../../events.js";
import {
  log,
  LogLevel,
} from "../../utils/logging.js";
import { injectIntoBody } from "../../utils/inject.js";
import { injectHotImports } from "@tobloef/hot-reload";
import { dedent } from "../../utils/indent.js";
import { normalizeSlashes } from "../../utils/paths.js";

/** @import { IncomingMessage, ServerResponse } from "node:http"; **/

/** @import { ResponseData } from "../../server/http-server.js"; **/
/** @import { BuildConfig } from "../../build-config.js"; **/

const INJECTED_PATH = `/${randomString(16)}/hot-reload-listener.js`;
const WS_PREFIX = "hot reload: ";

export class HotReload extends Module {
  /** @type {RegExp[]} */
  include;

  /** @type {RegExp[]} */
  exclude;

  /** @type {boolean} */
  hotModuleReplacement;

  /**
   * @param {Object} [options]
   * @param {RegExp[]} [options.include]
   * @param {RegExp[]} [options.exclude]
   * @param {boolean} [options.hotModuleReplacement]
   */
  constructor(options) {
    super();
    this.include = options?.include ?? [/\.js$/, /\.html$/, /\.css$/];
    this.exclude = options?.exclude ?? [];
    this.hotModuleReplacement = options?.hotModuleReplacement ?? true;
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    buildEvents.fileChanged.subscribe(async (event) => {
      const canonicalPath = normalizeSlashes(event.data.relative);

      const isIncluded = this.include.some((pattern) => pattern.test(canonicalPath));
      const isExcluded = this.exclude.some((pattern) => pattern.test(canonicalPath));

      if (!isIncluded || isExcluded) {
        return;
      }

      buildEvents.websocketMessage.publish(`${WS_PREFIX}${canonicalPath}`);
    });

    let message = "🔥 Hot reloading enabled";

    if (!this.hotModuleReplacement) {
      message += " (without hot module replacement)";
    }

    log(LogLevel.INFO, message);
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
    res.end(getHotReloadListenerScript(this.hotModuleReplacement));
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
    const shouldInject = !isNodeModule && !isInjected && this.hotModuleReplacement;

    if (data.type === ContentType.JS && shouldInject) {
      let path = req.url.split("?")[0];
      if (path.startsWith("/")) {
        path = path.slice(1);
      }

      const rootPath = String(params.data?.meta?.rootPath ?? "");
      data.content = injectJsWithHotModuleReplacement(data.content, path, rootPath);
    }

    return data;
  }
}

/**
 * @param {boolean} enableHotModuleReplacement
 */
function getHotReloadListenerScript(enableHotModuleReplacement) {
  // language=JavaScript
  return dedent(`
    (async () => {
      let hotReloadModule;
      try {
        hotReloadModule = await import("@tobloef/hot-reload");
      } catch (error) {
        console.error(\`Failed to import hot-reload module. Perhaps "@tobloef/hot-reload" is not installed?\`, error);
        return;
      }

      const { HotReload } = hotReloadModule;

      const hotReload = new HotReload(window.location.origin);

      const socket = new WebSocket(\`ws://\${window.location.host}\`);

      socket.addEventListener("message", handleMessage);

      socket.addEventListener("open", () => {
        const hotEmoji = String.fromCodePoint(0x1F525);

				let message = \`\${hotEmoji} Hot reloading enabled\`;

				if (!${enableHotModuleReplacement}) {
					message += " (without hot module replacement)";
				}
        
        console.info(message);
      });
      
      socket.addEventListener("close", () => {
        console.warn("WebSocket connection closed, hot reloading disabled until page is reloaded");
      });

      /**
       * @param {MessageEvent} event
       */
      async function handleMessage(event) {
        const prefix = "${WS_PREFIX}";

        if (!event.data.startsWith(prefix)) {
          return;
        }

        const canonicalPath = event.data.slice(prefix.length);

        const wasAccepted = await hotReload.reload(canonicalPath);

        if (!wasAccepted) {
          console.debug(\`Hot reload for "\${canonicalPath}" was not accepted, reloading the page.\`);
          window.location.reload();
          return;
        }

        console.debug(\`Hot reload for "\${canonicalPath}" was accepted\`);
      }
    })();
  `, 3).trim();
}

/** @param {Buffer} fileContent */
function injectHtmlWithHotReloadListenerScript(fileContent) {
  const html = fileContent.toString("utf-8");
  const script = `<script type="module" src="${INJECTED_PATH}"></script>`;
  const newHtml = injectIntoBody(html, script);
  return Buffer.from(newHtml);
}

/**
 * @param {Buffer} fileContent
 * @param {string} filePath
 * @param {string} [rootPath]
 */
function injectJsWithHotModuleReplacement(fileContent, filePath, rootPath) {
  const js = fileContent.toString("utf-8");
  const modulePath = filePath;
  const newJs = injectHotImports(js, modulePath, rootPath);
  return Buffer.from(newJs);
}
