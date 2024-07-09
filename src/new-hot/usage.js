import { HotModuleReplacement } from "./hot-module-replacement.js";
import { HotReload } from "./hot-reload.js";

const hot = new HotReload(import.meta.url);
const hmr = new HotModuleReplacement(import.meta.url);

hmr.subscribe("./sub-folder/some-module.js", callback);
hmr.subscribe("./sub-folder/some-module.js", { type: "json" }, callback);

hmr.unsubscribe("./sub-folder/some-module.js", callback);

await hmr.trigger("./sub-folder/some-module.js");

hmr.subscribe("./sub-folder/some-module.js", callback);

await hot.trigger("./assets/model.obj");

function callback() {
}