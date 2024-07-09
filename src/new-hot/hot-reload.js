import { assertExhaustive } from "../utils/assert-exhaustive.js";

export class HotReload {
  /** @type {boolean} */
  fullReloadFallback = true;

  /** @type {"every" | "some"} */
  acceptMode = "every";

  #callbacks = {};

  constructor(importUrl) {
    this.importUrl = importUrl;
  }

  /**
   * @param {string} url
   * @param {Callback} callback
   * @param {Record<string, unknown>} [meta]
   */
  subscribe(url, callback, meta) {
    const canonicalUrl = this.getCanonicalUrl(url);

    if (this.#callbacks[canonicalUrl] === undefined) {
      this.#callbacks[canonicalUrl] = [];
    }

    this.#callbacks[canonicalUrl] = [
      ...this.#callbacks[canonicalUrl],
      { callback, meta: meta ?? {} },
    ];
  }

  /**
   * @param {string} url
   * @param {Callback} callback
   */
  unsubscribe(url, callback) {
    const canonicalUrl = this.getCanonicalUrl(url);

    this.#callbacks[canonicalUrl] = this.#callbacks[canonicalUrl]
      ?.filter(({ callback: cb }) => cb !== callback);
  }

  async trigger(url) {
    const canonicalUrl = this.getCanonicalUrl(url);

    if (this.#callbacks[canonicalUrl] === undefined) {
      return false;
    }

    const promises = this.#callbacks[canonicalUrl]
      .map(async ({ callback, meta }) => callback(meta));

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

  getCanonicalUrl(url) {
    // TODO
  }

  #fullReload() {
    window.location.reload();
  }
}