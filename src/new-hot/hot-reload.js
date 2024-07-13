import {assertExhaustive} from "../utils/assert-exhaustive.js";

/** @typedef {(meta: Record<string, unknown>) => Promise<void>} HotReloadCallback */

export class HotReload {
  /** @type {boolean} */
  fullReloadFallback = true;

  /** @type {boolean} */
  logging = true;

  /** @type {"every" | "some"} */
  acceptMode = "every";

  /**
   * Maps canonical URLs to arrays of callbacks.
   * @type {Record<
   *   string,
   *   Array<{
   *     callback: HotReloadCallback,
   *     meta: Record<string, unknown>
   *   }>
   * >}
   */
  #callbacks = {};

  /**
   * @param {string} importUrl
   * @param {Object} [options]
   * @param {boolean} [options.fullReloadFallback]
   * @param {boolean} [options.logging]
   * @param {"every" | "some"} [options.acceptMode]
   */
  constructor(importUrl, options) {
    this.importUrl = importUrl;
    this.fullReloadFallback = options?.fullReloadFallback ?? this.fullReloadFallback;
    this.logging = options?.logging ?? this.logging;
    this.acceptMode = options?.acceptMode ?? this.acceptMode;
  }

  /**
   * @param {string} url
   * @param {HotReloadCallback} callback
   * @param {Record<string, unknown>} [meta]
   */
  subscribe(url, callback, meta) {
    const canonicalUrl = this.getCanonicalUrl(url);

    if (this.#callbacks[canonicalUrl] === undefined) {
      this.#callbacks[canonicalUrl] = [];
    }

    this.#callbacks[canonicalUrl] = [
      ...this.#callbacks[canonicalUrl],
      {callback, meta: meta ?? {}},
    ];

    if (this.logging) {
      console.debug("Subscribed to hot reload", {
        canonicalUrl,
        relativeUrl: url,
      });
    }
  }

  /**
   * @param {string} url
   * @param {HotReloadCallback} callback
   */
  unsubscribe(url, callback) {
    const canonicalUrl = this.getCanonicalUrl(url);

    this.#callbacks[canonicalUrl] = this.#callbacks[canonicalUrl]
      ?.filter(({callback: cb}) => cb !== callback);

    if (this.logging) {
      console.debug("Unsubscribed from hot reload", {
        canonicalUrl,
        relativeUrl: url,
      });
    }
  }

  /**
   * @param {string} url
   * @returns {Promise<boolean>} Whether the hot reload was accepted by any of the callbacks.
   */
  async trigger(url) {
    const canonicalUrl = this.getCanonicalUrl(url);

    const callbacks = this.#callbacks[canonicalUrl];

    if (callbacks === undefined) {
      return false;
    }

    const promises = callbacks.map(async ({callback, meta}) => callback(meta));

    const results = await Promise.all(promises);

    let wasAccepted = false;
    switch (this.acceptMode) {
      case "every":
        wasAccepted = results.every((result) => result);
        break;
      case "some":
        wasAccepted = results.some((result) => result);
        break;
      default:
        assertExhaustive(this.acceptMode);
    }

    if (this.logging) {
      console.debug("Triggered hot reload", {
        canonicalUrl,
        relativeUrl: url,
        callbackCount: callbacks.length,
        accepted: wasAccepted,
      });
    }

    if (!wasAccepted && this.fullReloadFallback) {
      this.#fullReload();
    }

    return wasAccepted;
  }

  /**
   * @param {string} url
   * @returns {string}
   */
  getCanonicalUrl(url) {
    const canonicalUrl = new URL(url, this.importUrl).href;
    return canonicalUrl;
  }

  #fullReload() {
    if (this.logging) {
      console.debug("Doing full reload.");
    }
    window.location.reload();
  }
}