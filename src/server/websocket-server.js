import { WebSocketServer } from "ws";
import { log, LogLevel } from "../utils/logging.js";
import { buildEvents } from "../events.js";

/** @import { Server } from "node:http"; */
/** @import { WebSocket } from "ws"; */

/** @import { BuildConfig } from "../build-config.js"; */

/**
 * @param {Server} httpServer
 * @param {BuildConfig} buildConfig
 * @return {WebSocketServer}
 */
export function attachWebSocketServer(httpServer, buildConfig) {
  const wsServer = new WebSocketServer({ server: httpServer });

  wsServer.on("connection", createConnectionHandler(buildConfig));

  log(LogLevel.VERBOSE, "Attached WebSocket server to HTTP server");

  return wsServer;
}

/**
 *
 * @param {BuildConfig} buildConfig
 */
function createConnectionHandler(buildConfig) {
  /**
   * @param {WebSocket} socket
   */
  return (socket) => {
    log(LogLevel.VERBOSE, "WebSocket connection opened");

    socket.on("error", (error) => {
      log(LogLevel.ERROR, `WebSocket error: ${error}`);
    });

    socket.on("close", () => {
      log(LogLevel.VERBOSE, "WebSocket connection closed");
    });

    socket.on("message", async (message) => {
      log(LogLevel.VERBOSE, `WebSocket server message received: ${message}`);
    });
  };
}
