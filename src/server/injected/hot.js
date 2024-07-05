// @ts-ignore
import { socket } from "/@injected/socket.js";

/** @type {Record<string, Record<string, () => void>>} */
let reloadCallbacks = {};

/** @type {Record<string, any>} */
let moduleCache = {};

let nextId = 0;

export const modules = {
  /** @param {string} canonicalPath */
  get: async (canonicalPath) => {
    if (moduleCache[canonicalPath]) {
      console.debug(`Loading module "${canonicalPath}" from cache`);
      return await moduleCache[canonicalPath];
    }

    console.debug(`Importing module "${canonicalPath}"`);
    moduleCache[canonicalPath] = new Promise(async (resolve) => {
      const module = await import((`${canonicalPath}?noCache=${Date.now()}`));
      resolve(module);
    });

    return await moduleCache[canonicalPath];
  },
  /**
   * @param {string} canonicalPath
   * @param {() => void} callback
   * */
  onReload: (canonicalPath, callback) => {
    const id = nextId++;

    if (!reloadCallbacks[canonicalPath]) {
      reloadCallbacks[canonicalPath] = {};
    }

    reloadCallbacks[canonicalPath][id] = callback;

    return () => {
      delete reloadCallbacks[canonicalPath][id];
    };
  },
  /** @param {string} canonicalPath */
  reload: (canonicalPath) => {
    const callbacksForPath = Object.values(reloadCallbacks[canonicalPath] ?? {});
    console.debug(`Calling ${callbacksForPath.length} callbacks for ${canonicalPath} and removing it from cache`);
    delete moduleCache[canonicalPath];
    callbacksForPath.forEach((callback) => callback());
  },
};

/**
 * @param {MessageEvent} event
 */
function handleMessage(event) {
  const prefix = "hot reload: ";
  if (event.data.startsWith(prefix)) {
    const absolutePath = event.data.slice(prefix.length);

    modules.reload(absolutePath);
  }
}

socket.addEventListener("message", handleMessage);

const hotEmoji = String.fromCodePoint(0x1F525);

console.info(`${hotEmoji} Hot reloading enabled`);