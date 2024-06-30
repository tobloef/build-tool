import { createServer } from "node:http";
import { log, LogLevel } from "../utils/logging.js";
import { fileExists } from "../utils/file-exists.js";
import { readFile } from "node:fs/promises";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { getMimeType } from "../utils/get-mime-type.js";
import { join } from "node:path";

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
    directory,
  } = options;

  return async (req, res) => {

    let path = req.url;
    if (path === undefined || path === "/") {
      path = "/index.html";
    }

    const filePath = `${directory}${path}`;

    if (!await fileExists(filePath)) {
      res.statusCode = 404;
      res.setHeader("Content-Type", "text/plain");
      res.end("Not found");
      log(LogLevel.ERROR, `File not found: ${filePath}`);
      return;
    }

    let file = await readFile(filePath);

    if (live && path.endsWith(".html")) {
      file = await injectScript(path, file, "./injected/live-reload.js");
    }

    log(LogLevel.VERBOSE, `Serving file: ${filePath}`);

    res.statusCode = 200;
    res.setHeader("Content-Type", getMimeType(filePath));
    res.end(file);
  };
}

/**
 * @param {string} htmlPath
 * @param {Buffer} file
 * @param {string} relativeScriptPath
 * @return {Promise<Buffer>}
 */
async function injectScript(htmlPath, file, relativeScriptPath) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = dirname(__filename);
  const scriptPath = join(__dirname, relativeScriptPath);
  const script = `<script type="module">${await readFile(scriptPath)}</script>`;
  const fileString = file.toString();
  const newFileString = fileString.replace(/(\n?\t*<\/body>)/, `${script}$1`);

  log(LogLevel.VERBOSE, `Injected script "${scriptPath}" into "${htmlPath}"`);

  return Buffer.from(newFileString);
}