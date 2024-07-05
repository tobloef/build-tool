import { createServer } from "node:http";
import { log, LogLevel } from "../utils/logging.js";
import { fileExists } from "../utils/file-exists.js";
import { readFile } from "node:fs/promises";
import { getMimeType } from "../utils/get-mime-type.js";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { proxyWithHotImports } from "../hot/proxy-with-hot-imports.js";
import { resolve } from "path";

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
  } = options;

  return async (req, res) => {

    let path = req.url;

    if (path === undefined || path === "/") {
      path = "/index.html";
    }

    let wasInjected = false;
    if (path.startsWith("/@injected/")) {
      const thisDirectory = join(import.meta.dirname, "injected");
      path = path.replace("/@injected/", `${thisDirectory}/`);
      wasInjected = true;
    } else {
      path = `${directory}${path}`;
    }

    if (!await fileExists(path)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      res.end("Not found");
      // TODO: File not found: build/Users/dkTobLof/Code/build-tool-test/build/value?t=1720131501415
      log(LogLevel.ERROR, `File not found: ${path}`);
      return;
    }

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
      if (hot && !path.includes("node_modules") && !wasInjected) {
        log(LogLevel.VERBOSE, `Hot-proxying file: ${path}`);
        file = await proxyWithHotImports(file.toString(), resolve(path));
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