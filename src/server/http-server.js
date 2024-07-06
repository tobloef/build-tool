import { createServer } from "node:http";
import { log, LogLevel } from "../utils/logging.js";
import { fileExists } from "../utils/file-exists.js";
import { readFile } from "node:fs/promises";
import { getMimeType } from "../utils/get-mime-type.js";
import { join } from "node:path";
import { injectHotImports } from "../hot/inject-hot-imports.js";

/** @import { IncomingMessage, ServerResponse, Server } from "node:http"; */

/** @import { ServeOptions } from "../build-config.js"; */

/**
 * @param {ServeOptions} options
 * @return {Server}
 */
export function createHttpServer(options) {
  const server = createServer();

  server.on("request", createRequestHandler(options));

  return server;
}

/**
 * @param {ServeOptions} options
 * @return {(req: IncomingMessage, res: ServerResponse) => Promise<void>}
 */
function createRequestHandler(options) {
  const {
    live,
    hot,
    directory,
    address,
    port,
  } = options;

  return async (req, res) => {
    const url = new URL(req.url ?? "", `http://${address}:${port}`);

    let path = url.pathname;

    if (path === undefined || path === "/") {
      path = "/index.html";
    }

    const filename = path?.split("/").pop();
    if (!filename?.includes(".")) {
      path += ".html";
    }

    let wasInjected = false;
    if (path.startsWith("/@injected/")) {
      const injectedSourceDir = join(import.meta.dirname, "injected").replace(/\\/g, "/");
      path = path.replace("/@injected/", `${injectedSourceDir}/`);
      wasInjected = true;
    } else {
      path = `${directory}${path}`;
    }

    if (!await fileExists(path)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      res.end("Not found");
      log(LogLevel.ERROR, `File not found: ${path}`);
      return;
    }

    /** @type {Buffer | string} */
    let file = await readFile(path);

    if (path.endsWith(".html")) {
      if (live) {
        file = await injectScript(path, file, "live-reload.js");
      }

      if (hot) {
        file = await injectScript(path, file, "hot.js");
      }
    }

    if (path.endsWith(".js")) {
      const isRelative = path.startsWith(directory);
      const isNodeModule = path.match(/(^|\/|\\)node_modules(\/|\\)/);
      if (hot && !isNodeModule && !wasInjected && isRelative) {
        const fileStr = file.toString();
        log(LogLevel.VERBOSE, `Hot-proxying file: ${path}`);
        file = await injectHotImports(fileStr, path, directory);
      }
    }

    log(LogLevel.VERBOSE, `Serving file: ${path}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", getMimeType(path));
    res.end(file);
  };
}

/**
 * @param {string} htmlPath
 * @param {Buffer} file
 * @param {string} relativeScriptPath Relative to "injected" directory
 * @return {Promise<Buffer>}
 */
async function injectScript(htmlPath, file, relativeScriptPath) {
  const scriptUrl = `/@injected/${relativeScriptPath}`;
  const script = `<script type="module" src="${scriptUrl}"></script>`;
  const fileString = file.toString();
  const newFileString = fileString.replace(/(\n?\t*<\/body>)/, `${script}$1`);

  log(LogLevel.VERBOSE, `Injected script "${relativeScriptPath}" into "${htmlPath}"`);

  return Buffer.from(newFileString);
}
