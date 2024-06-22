/** @import {Module} from "../modules/index.js" */

/**
 * @typedef {Object} BuildConfig
 * @property {Module[]} [modules] Modules to use in the build process. Will be run in order.
 * @property {boolean} [verbose] Whether to log verbose output.
 * @property {boolean} [quiet] Whether to log only errors.
 * @property {boolean} [clean] Whether to clean the output directory before building.
 * @property {boolean | WatchOptions} [watch] Whether to watch for changes and automatically rebuild.
 * @property {boolean | ServeOptions} [serve] Whether to start a development server.
 */


/**
 * @typedef {Object} WatchOptions
 */

/**
 * @typedef {Object} ServeOptions
 * @property {string} [address] The address to bind the server to.
 * @property {string} [port] The port to bind the server to.
 * @property {boolean} [open] Whether to open the served URL in the default browser.
 * @property {boolean} [hot] Whether to enable hot reloading.
 */