/** @import { IncomingMessage, ServerResponse, Server } from "node:http"; */
/** @import { BuildConfig, ServeOptions } from "../build-config.js"; */
/** @typedef {{ content: Buffer, type: ContentType }} ResponseData */
/**
 * @param {BuildConfig} buildConfig
 * @return {Server}
 */
export function createHttpServer(buildConfig: BuildConfig): Server;
/**
 * @param {Server} server
 * @param {ServeOptions} serveOptions
 */
export function startServer(server: Server, serveOptions: ServeOptions): Promise<any>;
export type ResponseData = {
    content: Buffer;
    type: ContentType;
};
import type { BuildConfig } from "../build-config.js";
import type { Server } from "node:http";
import type { ServeOptions } from "../build-config.js";
import { ContentType } from "../utils/content-type.js";
