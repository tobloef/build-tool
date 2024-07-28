import { BuildConfig } from "../build-config.js";
import {
  ExtensionlessHtml,
  GenerateImportMap,
  HotReload,
  ServeStaticFiles,
} from "../module/index.js";

const dev = new BuildConfig({
  watch: true,
  serve: true,
  modules: [
    new ExtensionlessHtml(),
    new ServeStaticFiles({
      path: "src",
    }),
    new ServeStaticFiles({
      path: ".",
    }),
    new GenerateImportMap({
      serve: true,
    }),
    new HotReload(),
  ],
});

export default dev;
