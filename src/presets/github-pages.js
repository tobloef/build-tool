import { BuildConfig } from "../build-config.js";
import {
  Copy,
  GenerateImportMap,
  NpmInstall,
} from "../module/index.js";
import { Clean } from "../module/modules/clean.js";

const SOURCE_DIRECTORY = ".";
const BUILD_DIRECTORY = "docs";

const githubPages = new BuildConfig({
  modules: [
    new Clean({
      path: BUILD_DIRECTORY,
    }),
    new Copy({
      from: SOURCE_DIRECTORY,
      to: BUILD_DIRECTORY,
      include: [
        /.+\.js$/,
        /.+\.html$/,
      ],
      exclude: [/\/node_modules\//],
    }),
    new Copy({
      from: SOURCE_DIRECTORY,
      to: BUILD_DIRECTORY,
      include: [/^package\.json$/],
      exclude: [/\/node_modules\//],
      middleware: (input) => {
        // Remove devDependencies from package.json
        const packageJson = JSON.parse(input.toString());
        delete packageJson.devDependencies;
        return Buffer.from(JSON.stringify(packageJson, null, 2));
      }
    }),
    new NpmInstall({
      path: BUILD_DIRECTORY,
    }),
    new GenerateImportMap({
      packagePath: BUILD_DIRECTORY,
      outputPath: BUILD_DIRECTORY
    })
  ],
});

export default githubPages;
