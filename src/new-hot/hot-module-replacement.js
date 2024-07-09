import { HotReload } from "./hot-reload.js";

export class HotModuleReplacement extends HotReload {
  /** @type {boolean} */
  cache = true;

  #moduleCache = {};

  constructor(importUrl) {
    super(importUrl);
  }

  subscribe(relativePath, attributesOrCallback, callbackOrUndefined) {
    const canonicalPath = this.getCanonicalUrl(relativePath);

    const attributes = typeof attributesOrCallback !== "function"
      ? attributesOrCallback
      : undefined;

    const callback = typeof attributesOrCallback === "function"
      ? attributesOrCallback
      : callbackOrUndefined;

    const wrappedCallback = async ({ attributes }) => {
      const newModule = await this.#importModule(canonicalPath, attributes);

      callback(newModule);
    };

    super.subscribe(relativePath, wrappedCallback, { attributes });
  }

  async trigger(relativePath) {
    const canonicalPath = this.getCanonicalUrl(relativePath);

    delete this.#moduleCache[canonicalPath];

    return super.trigger(canonicalPath);
  }

  async #importModule(canonicalPath, attributes) {
    const attributesString = JSON.stringify(attributes);

    const cachedModule = this.#moduleCache[canonicalPath]?.[attributesString];

    if (this.cache && cachedModule) {
      return cachedModule;
    }

    const importPromise = new Promise(async (resolve) => {
      const cacheBuster = `?noCache=${Date.now()}`;
      const newModule = await import(
        `${canonicalPath}${cacheBuster}`,
        attributes ? { with: attributes } : undefined,
        );
      resolve(newModule);
    });


    if (this.cache) {
      if (this.#moduleCache[canonicalPath] === undefined) {
        this.#moduleCache[canonicalPath] = {};
      }
      this.#moduleCache[canonicalPath][attributesString] = importPromise;
    }

    const newModule = await importPromise;

    return newModule;
  }
}