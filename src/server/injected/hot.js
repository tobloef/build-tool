// @ts-ignore
import { socket } from "/@injected/socket.js";

/** @type {Record<string, Record<string, () => void>>} */
let reloadCallbacks = {};

/** @type {Record<string, any>} */
let moduleCache = {};

let nextId = 0;

export const modules = {
  // TODO: Using absolute path is not quite right, it should be relative to the current page
  /** @param {string} absolutePath */
  get: async (absolutePath) => {
    if (moduleCache[absolutePath]) {
      console.debug(`Loading module "${absolutePath}" from cache`);
      return moduleCache[absolutePath];
    }

    console.debug(`Loading module "${absolutePath}" by importing it`);
    const module = await import((`${absolutePath}?noCache=${Date.now()}`));
    module["*"] = module;
    moduleCache[absolutePath] = module;
    return module;
  },
  /**
   * @param {string} absolutePath
   * @param {() => void} callback
   * */
  onReload: (absolutePath, callback) => {
    const id = nextId++;

    if (!reloadCallbacks[absolutePath]) {
      reloadCallbacks[absolutePath] = {};
    }

    reloadCallbacks[absolutePath][id] = callback;

    return () => {
      delete reloadCallbacks[absolutePath][id];
    };
  },
  /** @param {string} absolutePath */
  reload: (absolutePath) => {
    const callbacksForPath = Object.values(reloadCallbacks[absolutePath] ?? {});
    console.debug(`Calling ${callbacksForPath.length} callbacks for ${absolutePath} and removing it from cache`);
    delete moduleCache[absolutePath];
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