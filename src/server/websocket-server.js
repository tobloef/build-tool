/** @import { ServeOptions } from "../build-config.js"; */
/** @import { Server } from "node:http"; */
/** @import { WebSocket } from "ws"; */

import { WebSocketServer } from "ws";
import { log, LogLevel } from "../utils/logging.js";
import { buildEvents } from "../events.js";

/**
 * @param {Server} httpServer
 * @param {ServeOptions} options
 * @return {WebSocketServer}
 */
export function attachWebSocketServer(httpServer, options) {
  const wsServer = new WebSocketServer({ server: httpServer });

  wsServer.on("connection", createConnectionHandler(options));

  log(LogLevel.VERBOSE, "Attached WebSocket server to HTTP server");

  return wsServer;
}

/**
 *
 * @param {ServeOptions} options
 */
function createConnectionHandler(options) {
  /**
   * @param {WebSocket} socket
   */
  return (socket) => {
    log(LogLevel.VERBOSE, "WebSocket connection opened");

    /** @type {() => void} */
    let unsubscribeLiveReload;
    /** @type {() => void} */
    let unsubscribeHotReload;

    if (options.live) {
      unsubscribeLiveReload = buildEvents.liveReload.subscribe(async () => {
        log(LogLevel.VERBOSE, "Sending live reload message to client");
        socket.send("live reload");
      });
    }

    if (options.hot) {
      unsubscribeHotReload = buildEvents.hotReload.subscribe(async (event) => {
        log(LogLevel.VERBOSE, `Sending hot reload message with path "${event.data}" to client`);
        socket.send(`hot reload: ${event.data}`);
      });
    }

    socket.on("error", (error) => {
      log(LogLevel.ERROR, `WebSocket error: ${error}`);
    });

    socket.on("close", () => {
      log(LogLevel.VERBOSE, "WebSocket connection closed");

      unsubscribeLiveReload?.();
      unsubscribeHotReload?.();
    });

    socket.on("message", (message) => {
      log(LogLevel.VERBOSE, `WebSocket server message received: ${message}`);
    });
  };
}