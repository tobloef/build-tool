import { BuildConfig } from "../build-config.js";
import { Copy, NpmInstall } from "../modules/index.js";

const SOURCE_DIRECTORY = "src";
const BUILD_DIRECTORY = "docs";

const githubPages = new BuildConfig({
  pipeline: [
    new Copy({
      from: SOURCE_DIRECTORY,
      to: BUILD_DIRECTORY,
      files: [
        /.+.js$/,
        /.+.html$/,
      ],
    }),
    new Copy({
      from: ".",
      to: BUILD_DIRECTORY,
      recursive: false,
      files: [
        /package.json/,
        /package-lock.json/,
      ],
    }),
    new NpmInstall({
      directory: BUILD_DIRECTORY,
    }),
  ],
});

export default githubPages;