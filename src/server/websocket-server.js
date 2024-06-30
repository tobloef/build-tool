/** @import { ServeOptions } from "../build-config.js"; */
/** @import { Server } from "node:http"; */
/** @import { WebSocket } from "ws"; */

import { WebSocketServer } from "ws";
import { log, LogLevel } from "../utils/logging.js";
import { buildEvents } from "../events.js";

/**
 * @param {ServeOptions} options
 * @param {Server} [httpServer]
 * @return {WebSocketServer}
 */
export function createWebSocketServer(options, httpServer) {
  const { port, address } = options;

  const wsOptions = httpServer ? { server: httpServer } : { port, host: address };

  const wsServer = new WebSocketServer(wsOptions);

  wsServer.on("connection", createConnectionHandler(options));

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

    if (options.live) {
      unsubscribeLiveReload = buildEvents.liveReload.subscribe(async () => {
        log(LogLevel.VERBOSE, "Sending live reload message to client");
        socket.send("live reload");
      });
    }

    socket.on("error", (error) => {
      log(LogLevel.ERROR, `WebSocket error: ${error}`);
    });

    socket.on("close", () => {
      log(LogLevel.VERBOSE, "WebSocket connection closed");

      unsubscribeLiveReload?.();
    });

    socket.on("message", (message) => {
      log(LogLevel.VERBOSE, `WebSocket server message received: ${message}`);
    });
  };
}