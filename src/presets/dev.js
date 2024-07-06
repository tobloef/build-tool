import { BuildConfig, ServeOptions } from "../build-config.js";
import { Copy, NpmInstall } from "../modules/index.js";

const githubPages = new BuildConfig({
  watch: true,
  serve: new ServeOptions({
    hot: true,
    open: true,
  }),
});

export default githubPages;