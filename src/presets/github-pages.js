import { BuildConfig } from "../build-config.js";
import { Copy, NpmInstall } from "../modules/index.js";

const SOURCE_DIRECTORY = ".";
const BUILD_DIRECTORY = "docs";

const githubPages = new BuildConfig({
  pipeline: [
    new Copy({
      from: SOURCE_DIRECTORY,
      to: BUILD_DIRECTORY,
      include: [
        /.+.js$/,
        /.+.html$/,
      ],
      exclude: [
        /node_modules/,
      ]
    }),
    new NpmInstall({
      from: SOURCE_DIRECTORY,
      to: BUILD_DIRECTORY,
    }),
  ],
});

export default githubPages;
