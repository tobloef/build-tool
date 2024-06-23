/** @import { BuildConfig } from "./src/build-config/index.js" */

import { copy, npmInstall } from "../modules/index.js";

/** @type {BuildConfig} */
const webPreset = {
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

export default webPreset;