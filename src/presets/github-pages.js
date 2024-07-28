import { BuildConfig } from "../build-config.js";
import {
  Copy,
  GenerateImportMap,
  NpmInstall,
} from "../module/index.js";
import { Clean } from "../module/modules/clean.js";

const githubPages = new BuildConfig({
  modules: [
    new Clean({
      path: "docs",
    }),
    new Copy({
      from: "src",
      to: "docs",
      include: [
        /.+\.js$/,
        /.+\.html$/,
      ],
      exclude: [/[\/\\]node_modules[\\\/]/],
    }),
    new Copy({
      from: ".",
      to: "docs",
      include: [/^package\.json$/],
      exclude: [/[\/\\]node_modules[\\\/]/],
      middleware: (input) => {
        // Remove devDependencies from package.json
        const packageJson = JSON.parse(input.toString());
        delete packageJson.devDependencies;
        return Buffer.from(JSON.stringify(packageJson, null, 2));
      }
    }),
    new NpmInstall({
      path: "docs",
    }),
    new GenerateImportMap({
      packagePath: "docs",
      outputPath: "docs",
      exclude: [/[\/\\]node_modules[\\\/]/],
    }),
  ],
});

export default githubPages;
