import { Module } from "../module.js";
import { join, normalize } from "node:path";
import {
  glob, readdir,
  readFile,
  writeFile,
} from "node:fs/promises";
import { fileExists } from "../../utils/file-exists.js";
import BuildError from "../../build-error.js";
import { normalizeSlashes } from "../../utils/paths.js";
import { ContentType } from "../../utils/content-type.js";
import { Buffer } from "node:buffer";
import { log, LogLevel } from "../../utils/logging.js";
import { directoryExists } from "../../utils/directory-exists.js";
import { buildEvents } from "../../events.js";
import { resolve } from "path";

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
   * Relative to the project root.
   * @type {string}
   */
  packagePath;

  /**
   * @param {Object} [options]
   * @param {string} [options.outputPath]
   * @param {boolean} [options.serve]
   * @param {string} [options.packagePath]
   */
  constructor(options) {
    super();
    this.outputPath = options?.outputPath || null;
    this.serve = options?.serve || false;
    this.packagePath = options?.packagePath || ".";
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    const { buildConfig } = params;

    if (this.outputPath === null) {
      return;
    }

    log(LogLevel.INFO, `🗺️ Generating import map`);

    const packagePathRelativeToProject = normalize(join(buildConfig.root, this.packagePath));

    const importMapScript = await this.#generateScriptElement(packagePathRelativeToProject);

    const outputPathRelativeToProject = normalize(join(buildConfig.root, this.outputPath));

    if (await fileExists(outputPathRelativeToProject)) {
      const htmlContent = await readFile(outputPathRelativeToProject, "utf-8");
      const newHtml = this.#injectImportMap(htmlContent, importMapScript);
      log(LogLevel.VERBOSE, `Injecting import map into HTML file "${outputPathRelativeToProject}"`);
      await writeFile(outputPathRelativeToProject, newHtml);
    } else if (await directoryExists(outputPathRelativeToProject)) {
      const files = await readdir(outputPathRelativeToProject, { recursive: true });
      for (const file of files) {
        if (!file.endsWith(".html")) {
          continue;
        }

        const filePath = join(outputPathRelativeToProject, file);
        const htmlContent = await readFile(filePath, "utf-8");
        const newHtml = this.#injectImportMap(htmlContent, importMapScript);
        log(LogLevel.VERBOSE, `Injecting import map into HTML file "${filePath}"`);
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
    const { buildConfig } = params;

    const packagePathRelativeToProject = normalize(join(buildConfig.root, this.packagePath));

    let absoluteOutputPath = resolve(buildConfig.root, this.outputPath ?? "./");
    if (!absoluteOutputPath.endsWith("/")) {
      absoluteOutputPath += "/";
    }

    const isOutputPathADirectory = await directoryExists(absoluteOutputPath);
    const isOutputPathAFile = !isOutputPathADirectory;

    buildEvents.fileChanged.subscribe(async (event) => {
      const isAHtmlFileInOutputPath = event.data.absolute.startsWith(absoluteOutputPath) && event.data.absolute.endsWith(".html");

      const shouldInjectImportMap = (
        (isOutputPathADirectory && isAHtmlFileInOutputPath) ||
        (isOutputPathAFile && event.data.absolute === absoluteOutputPath)
      )

      if (!shouldInjectImportMap) {
        return;
      }

      const importMapScript = await this.#generateScriptElement(packagePathRelativeToProject);
      const htmlContent = await readFile(event.data.absolute, "utf-8");
      const newHtml = this.#injectImportMap(htmlContent, importMapScript);
      log(LogLevel.VERBOSE, `Injecting import map into HTML file "${event.data.relative}"`);
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

    const { data, req, buildConfig } = params;

    if (data?.type !== ContentType.HTML) {
      return data;
    }

    log(LogLevel.VERBOSE, `Injecting import map into HTML file "${req.url}"`);

    const packagePathRelativeToProject = normalize(join(buildConfig.root, this.packagePath));

    const scriptElement = await this.#generateScriptElement(packagePathRelativeToProject);

    const newHtml = this.#injectImportMap(data.content.toString(), scriptElement);

    data.content = Buffer.from(newHtml);

    return data;
  }

  /**
   * @param {string} htmlContent
   * @param {string} importMapTag
   * @returns {string}
   */
  #injectImportMap(htmlContent, importMapTag) {
    return htmlContent.replace(/<\/head>/, `${importMapTag}</head>`);
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

    const importMapScript = `<script type="importmap">${importMapString}</script>`;

    const endTime = performance.now();

    log(LogLevel.VERBOSE, `Generated import map in ${(endTime - startTime).toFixed(3)}ms`);

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

      const isInOwnModules = await fileExists(pathInOwnModules) && packagePath !== this.packagePath;
      const isInProjectModules = await fileExists(pathInProjectModules);

      if (!isInOwnModules && !isInProjectModules) {
        throw new BuildError(`Dependency "${dependency}" not found for package "${packageName}"`);
      }

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
}
