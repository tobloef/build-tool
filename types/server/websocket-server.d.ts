/** @import { Server } from "node:http"; */
/** @import { WebSocket } from "ws"; */
/** @import { BuildConfig } from "../build-config.js"; */
/**
 * @param {Server} httpServer
 * @param {BuildConfig} buildConfig
 * @return {WebSocketServer}
 */
export function attachWebSocketServer(httpServer: Server, buildConfig: BuildConfig): WebSocketServer;
import type { Server } from "node:http";
import type { BuildConfig } from "../build-config.js";
import { WebSocketServer } from "ws";
