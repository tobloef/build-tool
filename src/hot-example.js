// Usage

import { hot } from "@tobloef/hot";

hot(import.meta.url).subscribe("./sub-folder/some-module.js", callback);
hot(import.meta.url).subscribe("./sub-folder/some-module.js", { type: "json" }, callback);

hot(import.meta.url).unsubscribe("./sub-folder/some-module.js", callback);

await hot(import.meta.url).trigger("./sub-folder/some-module.js");


// Library

let options = {
  cache: true,
  fullReloadFallback: true,
};

let moduleCache = {};

let callbacks = {};

export function hot(importUrl) {
  function subscribe(relativePath, attributesOrCallback, callbackOrUndefined) {
    const attributes = typeof attributesOrCallback !== "function"
      ? attributesOrCallback
      : undefined;

    const callback = typeof attributesOrCallback === "function"
      ? attributesOrCallback
      : callbackOrUndefined;

    const modulePath = getModulePath(importUrl, relativePath);

    if (callbacks[modulePath] === undefined) {
      callbacks[modulePath] = [];
    }

    callbacks[modulePath] = [
      ...callbacks[modulePath],
      { callback, attributes },
    ];
  }

  function unsubscribe(relativePath, callback) {
    const modulePath = getModulePath(importUrl, relativePath);

    if (callbacks[modulePath] === undefined) {
      return;
    }

    callbacks[modulePath] = callbacks[modulePath].filter(({ callback: cb }) => {
      return cb !== callback;
    });
  }

  async function trigger(relativePath) {
    const modulePath = getModulePath(importUrl, relativePath);

    delete moduleCache[modulePath];

    let wasAccepted = false;

    for (const { callback, attributes } of callbacks[modulePath]) {
      const newModule = await importModule(modulePath, attributes);
      wasAccepted ||= await callback(newModule);
    }

    if (!wasAccepted && options.fullReloadFallback) {
      fullReload();
    }

    return wasAccepted;
  }

  function configure(newOptions) {
    options = {
      ...options,
      ...newOptions,
    };
  }

  return {
    subscribe,
    unsubscribe,
    trigger,
    configure,
  };
}

function fullReload() {
  window.location.reload();
}

async function importModule(modulePath, attributes) {
  const attributesString = JSON.stringify(attributes);

  const cachedModule = moduleCache[modulePath]?.[attributesString];

  if (options.cache && cachedModule) {
    return cachedModule;
  }

  const importPromise = new Promise(async (resolve) => {
    const cacheBuster = `?noCache=${Date.now()}`;
    const newModule = await import(
      `${modulePath}${cacheBuster}`,
      attributes ? { with: attributes } : undefined,
      );
    resolve(newModule);
  });


  if (options.cache) {
    if (moduleCache[modulePath] === undefined) {
      moduleCache[modulePath] = {};
    }
    moduleCache[modulePath][attributesString] = importPromise;
  }

  const newModule = await importPromise;

  return newModule;
}

function getModulePath(importUrl, relativePath) {
  // TODO
}

// Injected

let foo;
let bar;
let baz1;
let baz2;

await (async () => {
  const { hot: hotModule } = import("@tobloef/hot");

  const hot = hotModule(import.meta.url);

  hot.subscribe("./foo.js", (newModule) => {
    foo = newModule;
  });
  hot.subscribe("./bar.json", { type: "json" }, (newModule) => {
    bar = newModule;
  });
  hot.subscribe("./baz.js", (newModule) => {
    baz1 = newModule["baz1"];
  });
  hot.subscribe("./baz.js", (newModule) => {
    baz2 = newModule["baz2"];
  });

  await hot.trigger("./foo.js");
  await hot.trigger("./bar.json");
  await hot.trigger("./baz.js");
  await hot.trigger("./baz.js");
})();