import { Module } from "../module.js";
import { join } from "node:path";
import {
  readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { fileExists } from "../../utils/file-exists.js";
import BuildError from "../../build-error.js";
import { normalizeSlashes } from "../../utils/paths.js";
import { ContentType } from "../../utils/content-type.js";
import { Buffer } from "node:buffer";
import {
  log,
  LogLevel,
} from "../../utils/logging.js";
import { directoryExists } from "../../utils/directory-exists.js";
import { buildEvents } from "../../events.js";
import { indent } from "../../utils/indent.js";
import { getAbsolutePath } from "../../utils/get-absolute-path.js";
import { injectIntoHead } from "../../utils/inject.js";

/** @import { IncomingMessage, ServerResponse } from "node:http"; **/

/** @import { ResponseData } from "../../server/http-server.js"; **/
/** @import { BuildConfig } from "../../build-config.js"; **/

/**
 * @typedef {Object} ImportMap
 * @property {Record<string, string>} imports
 * @property {Record<string, Record<string, string>>} scopes
 */

/**
 * Generates an import map for the project's dependencies.
 */
export class GenerateImportMap extends Module {
  /**
   * If set, the import map will be injected into the HTML file(s) at this path.
   * Can the path to a file or a directory.
   * @type {string | null}
   */
  outputPath;

  /**
   * Whether to automatically inject the import map into served HTML files.
   * @type {boolean}
   */
  serve;

  /**
   * Path of the package to generate the import map for.
   * This should be the directory containing the package.json file.
   * @type {string}
   */
  packagePath;

  /**
   * Files to exclude from the import map.
   * @type {RegExp[]}
   */
  exclude;

  /**
   * @param {Object} [options]
   * @param {string} [options.outputPath]
   * @param {boolean} [options.serve]
   * @param {string} [options.packagePath]
   * @param {RegExp[]} [options.exclude]
   */
  constructor(options) {
    super();
    this.outputPath = options?.outputPath || null;
    this.serve = options?.serve || false;
    this.packagePath = options?.packagePath || ".";
    this.exclude = options?.exclude || [];
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    if (this.outputPath === null) {
      return;
    }

    log(LogLevel.INFO, `🗺️ Generating import map for HTML files in "${this.outputPath}"`);

    const importMapScript = await this.#generateScriptElement(this.packagePath);

    if (await fileExists(this.outputPath)) {
      const htmlContent = await readFile(this.outputPath, "utf-8");
      const newHtml = injectIntoHead(htmlContent, importMapScript);
      log(LogLevel.VERBOSE, `Injecting import map into HTML file "${this.outputPath}":\n${importMapScript}`);
      await writeFile(this.outputPath, newHtml);
    } else if (await directoryExists(this.outputPath)) {
      const files = await readdir(this.outputPath, { recursive: true });
      for (const file of files) {
        if (!file.endsWith(".html")) {
          continue;
        }

        const filePath = join(this.outputPath, file);

        if (this.exclude.some((regex) => regex.test(filePath))) {
          continue;
        }

        const htmlContent = await readFile(filePath, "utf-8");
        const newHtml = injectIntoHead(htmlContent, importMapScript);
        log(LogLevel.VERBOSE, `Injecting import map into HTML file "${filePath}":\n${importMapScript}`);
        await writeFile(filePath, newHtml);
      }
    } else {
      throw new BuildError(`No HTML file or directory found at "${this.outputPath}"`);
    }
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    if (this.outputPath === null) {
      return;
    }

    const isOutputPathADirectory = await directoryExists(this.outputPath);
    const isOutputPathAFile = !isOutputPathADirectory;

    buildEvents.fileChanged.subscribe(async (event) => {
      if (this.outputPath === null) {
        return;
      }

      const absoluteOutputPath = getAbsolutePath(this.outputPath);

      const isAHtmlFileInOutputPath = event.data.absolute.startsWith(absoluteOutputPath) && event.data.absolute.endsWith(".html");

      const shouldInjectImportMap = (
        (isOutputPathADirectory && isAHtmlFileInOutputPath) ||
        (isOutputPathAFile && event.data.absolute === absoluteOutputPath)
      )

      if (!shouldInjectImportMap) {
        return;
      }

      const importMapScript = await this.#generateScriptElement(this.packagePath);
      const htmlContent = await readFile(event.data.absolute, "utf-8");
      const newHtml = injectIntoHead(htmlContent, importMapScript);
      log(LogLevel.VERBOSE, `Injecting import map into HTML file "${event.data.relative}":\n${importMapScript}`);
      await writeFile(event.data.absolute, newHtml);
    });
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   * @param {ResponseData | null} params.data
   * @param {IncomingMessage} params.req
   * @param {ServerResponse<IncomingMessage>} params.res
   * @returns {Promise<ResponseData | null>}
   */
  async onHttpResponse(params) {
    if (!this.serve) {
      return params.data;
    }

    const { data, req } = params;

    if (data?.type !== ContentType.HTML) {
      return data;
    }

    const scriptElement = await this.#generateScriptElement(this.packagePath);

    log(LogLevel.VERBOSE, `Injecting import map into HTML file "${req.url}":\n${scriptElement}`);

    const newHtml = injectIntoHead(data.content.toString(), scriptElement);

    data.content = Buffer.from(newHtml);

    return data;
  }

  /**
   * @param {string} packagePath
   * @returns {Promise<string>}
   */
  async #generateScriptElement(packagePath) {
    const startTime = performance.now();

    /** @type {ImportMap} */
    const importMap = {
      imports: {},
      scopes: {}
    };

    await this.#populateImportMap(packagePath, importMap);

    const importMapString = JSON.stringify(importMap, null, 2);

    const importMapScript = `<script type="importmap">\n${indent(importMapString, 1)}\n</script>`;

    const endTime = performance.now();

    log(LogLevel.VERBOSE, `Generated import map in ${((endTime - startTime) / 1000).toFixed(3)} seconds`);

    return importMapScript;
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

      const isInOwnModules = await directoryExists(pathInOwnModules) && packagePath !== this.packagePath;
      const isInProjectModules = await directoryExists(pathInProjectModules);

      if (!isInOwnModules && !isInProjectModules) {
        throw new BuildError(`Dependency "${dependency}" not found for package "${packageName}"`);
      }

      const dependencyPackagePath = isInOwnModules ? pathInOwnModules : pathInProjectModules;
      const dependencyPackageJsonPath = join(dependencyPackagePath, "package.json");
      const dependencyPackageJsonFile = await readFile(dependencyPackageJsonPath, "utf-8");
      const dependencyPackageJson = JSON.parse(dependencyPackageJsonFile);
      let dependencyEntryFile = dependencyPackageJson.module ?? dependencyPackageJson.main ?? "index.js";

      if (dependencyEntryFile.startsWith("./")) {
        dependencyEntryFile = dependencyEntryFile.slice(2);
      }

      if (isInOwnModules) {
        const scope = `/${normalizeSlashes(packagePath)}`;
        if (importMap.scopes[scope] === undefined) {
          importMap.scopes[scope] = {};
        }

        importMap.scopes[scope][`${dependency}`] = `/${normalizeSlashes(pathInOwnModules)}/${dependencyEntryFile}`;
        importMap.scopes[scope][`${dependency}/`] = `/${normalizeSlashes(pathInOwnModules)}/`;
      } else {
        importMap.imports[`${dependency}`] = `/${normalizeSlashes(pathInProjectModules)}/${dependencyEntryFile}`;
        importMap.imports[`${dependency}/`] = `/${normalizeSlashes(pathInProjectModules)}/`;
      }

      await this.#populateImportMap(dependencyPackagePath, importMap);
    }
  }
}
