import { BuildConfig } from "../build-config.js";
import { Copy, GenerateImportMap, NpmInstall } from "../module/index.js";

const SOURCE_DIRECTORY = ".";
const BUILD_DIRECTORY = "docs";

const githubPages = new BuildConfig({
  modules: [
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
      packagePath: SOURCE_DIRECTORY,
      destinationPath: BUILD_DIRECTORY,
    }),
    new GenerateImportMap({
      outputPath: BUILD_DIRECTORY
    })
  ],
});

export default githubPages;
