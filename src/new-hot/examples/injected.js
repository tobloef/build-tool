// @ts-nocheck

import {HotModuleReload} from "../hot-module-reload.js";

let foo;
let bar;
let baz1;
let baz2;

await (async () => {
  const hmr = new HotModuleReload(import.meta.url);

  hmr.subscribe("./foo.js", (newModule) => {
    foo = newModule;
  });
  hmr.subscribe("./bar.json", {type: "json"}, (newModule) => {
    bar = newModule;
  });
  hmr.subscribe("./baz.js", (newModule) => {
    baz1 = newModule["baz1"];
  });
  hmr.subscribe("./baz.js", (newModule) => {
    baz2 = newModule["baz2"];
  });

  await hmr.trigger("./foo.js");
  await hmr.trigger("./bar.json");
  await hmr.trigger("./baz.js");
  await hmr.trigger("./baz.js");
})();