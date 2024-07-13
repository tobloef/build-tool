import {assertExhaustive} from "../utils/assert-exhaustive.js";

/** @typedef {(meta: Record<string, unknown>) => Promise<void>} HotReloadCallback */

export class HotReload {
  /** @type {boolean} */
  fullReloadFallback = true;

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
   */
  constructor(importUrl) {
    this.importUrl = importUrl;
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
  }

  /**
   * @param {string} url
   * @param {HotReloadCallback} callback
   */
  unsubscribe(url, callback) {
    const canonicalUrl = this.getCanonicalUrl(url);

    this.#callbacks[canonicalUrl] = this.#callbacks[canonicalUrl]
      ?.filter(({callback: cb}) => cb !== callback);
  }

  /**
   * @param {string} url
   */
  async trigger(url) {
    const canonicalUrl = this.getCanonicalUrl(url);

    if (this.#callbacks[canonicalUrl] === undefined) {
      return false;
    }

    const promises = this.#callbacks[canonicalUrl]
      .map(async ({callback, meta}) => callback(meta));

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
    // TODO
    return ""
  }

  #fullReload() {
    window.location.reload();
  }
}