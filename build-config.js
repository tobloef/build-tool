/** @import { BuildConfig } from "./src/build-config/index.js" */

import { copy } from "./src/modules/copy.js";
import { npmInstall } from "./src/modules/npm-install.js";

/** @type {BuildConfig} */
const buildConfig = {
  serve: true,
  watch: true,
  modules: [
    copy({
      from: "src",
      to: "dist",
    }),
    npmInstall({
      path: "dist",
    }),
  ],
};

export default buildConfig;