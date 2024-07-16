import { BuildModule } from "./build-module.js";
import { log, LogLevel } from "../utils/logging.js";
import { join } from "node:path";
import {
  readFile,
  writeFile,
} from "node:fs/promises";
import { fileExists } from "../utils/file-exists.js";
import BuildError from "../build-error.js";
import { normalizeSlashes } from "../utils/paths.js";

/**
 * @typedef {Object} ImportMap
 * @property {Record<string, string>} imports
 * @property {Record<string, Record<string, string>>} scopes
 */

/**
 * Generates an import map for the project's dependencies.
 */
export class GenerateImportMap extends BuildModule {
  /**
   * Path of the package to generate the import map for.
   * This should be the directory containing the package.json file.
   * @type {string}
   */
  packagePath;

  /**
   * Either a path to a file to write the import map to or "inline" to inject it into the HTML file.
   * @type {"inline" | string}
   */
  output;

  /**
   * @param {Object} [options]
   * @param {string} [options.packagePath]
   * @param {"inline" | string} [options.output]
   */
  constructor(options) {
    super();
    this.packagePath = options?.packagePath || ".";
    this.output = options?.output || "inline";
  }

  async run() {
    log(LogLevel.INFO, `🗺️ Generating import map`);

    /** @type {ImportMap} */
    let importMap = {
      imports: {},
      scopes: {}
    };

    await this.#populateImportMap(this.packagePath, importMap);

    const importMapString = JSON.stringify(importMap, null, 2);

    log(LogLevel.VERBOSE, `Generated import map:\n${importMapString}`);

    if (this.output === "inline") {
      // TODO
    } else {
      await writeFile(this.output, importMapString);
      log(LogLevel.VERBOSE, `Import map written to "${this.output}"`)
    }
  }

  /**
   * @param {string} packagePath
   * @param {ImportMap} importMap
   */
  async #populateImportMap(packagePath, importMap) {
    const packageJsonPath = join(packagePath, "package.json");
    const packageJsonFile = await readFile(packageJsonPath, "utf-8");
    const packageJson = JSON.parse(packageJsonFile);
    const packageName = packageJson.name ?? "unknown package";
    const dependencies = packageJson.dependencies ?? {};

    for (const dependency of Object.keys(dependencies)) {
      const pathInOwnModules = join(packagePath, "node_modules", dependency);
      const pathInProjectModules = join(this.packagePath, "node_modules", dependency);

      const isInOwnModules = await fileExists(pathInOwnModules) && packagePath !== this.packagePath;
      const isInProjectModules = await fileExists(pathInProjectModules);

      if (!isInOwnModules && !isInProjectModules) {
        throw new BuildError(`Dependency "${dependency}" not found for package "${packageName}"`);
      }

      // TODO: This chunk could be optimized. We're going to do most of this work again in the next iteration.
      const dependencyPackagePath = isInOwnModules ? pathInOwnModules : pathInProjectModules;
      const dependencyPackageJsonPath = join(dependencyPackagePath, "package.json");
      const dependencyPackageJsonFile = await readFile(dependencyPackageJsonPath, "utf-8");
      const dependencyPackageJson = JSON.parse(dependencyPackageJsonFile);
      const dependencyMain = dependencyPackageJson.main ?? "index.js";

      if (isInOwnModules) {
        const scope = `/${normalizeSlashes(packagePath)}`;
        if (importMap.scopes[scope] === undefined) {
          importMap.scopes[scope] = {};
        }

        importMap.scopes[scope][`${dependency}`] = `/${normalizeSlashes(pathInOwnModules)}/${dependencyMain}`;
        importMap.scopes[scope][`${dependency}/`] = `/${normalizeSlashes(pathInOwnModules)}/`;
      } else {
        importMap.imports[`${dependency}`] = `/${normalizeSlashes(pathInProjectModules)}/${dependencyMain}`;
        importMap.imports[`${dependency}/`] = `/${normalizeSlashes(pathInProjectModules)}/`;
      }

      await this.#populateImportMap(dependencyPackagePath, importMap);
    }
  }

  async watch() {

  }
}
