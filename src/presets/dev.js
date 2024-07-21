import { BuildConfig } from "../build-config.js";
import { ExtensionlessHtml, GenerateImportMap, ServeStaticFiles } from "../module/index.js";

const dev = new BuildConfig({
  watch: true,
  serve: true,
  modules: [
    new ExtensionlessHtml(),
    new ServeStaticFiles(),
    new GenerateImportMap({
      serve: true,
    }),
  ],
});

export default dev;
