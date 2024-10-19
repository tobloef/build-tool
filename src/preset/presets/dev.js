import { BuildConfig } from "../../build-config.js";
import {
  ExtensionlessHtml,
  ImportMaps,
  HotReload,
  ServeStaticFiles,
} from "../../module/index.js";

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
    new ImportMaps({
      path: "src",
      serve: true,
      include: [/\.html$/],
    }),
    new HotReload({
      include: [/^src[\/\\]/],
    }),
  ],
});

export default dev;
