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
import { ContentType, getContentTypeByPath } from "../../utils/content-type.js";
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
import { importRegex } from "@tobloef/hot-reload";

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
export class ImportMaps extends Module {
  /** @type {string} */
  path;

  /** @type {RegExp[]} */
  include;

  /** @type {RegExp[]} */
  exclude;

  /** @type {string} */
  packagePath;

  /** @type {boolean} */
  serve;

  /** @type {boolean} */
  write;

  /** @type {ImportMap | undefined} */
  #importMap;

  /**
   * @param {Object} options
   * @param {string} options.path Path to the file or directory of files to inject the import map into.
   * @param {RegExp[]} [options.include=[]] If specified and the path is a directory, only files matching these patterns will have the import map injected.
   * @param {RegExp[]} [options.exclude=[]] If specified and the path is a directory, files matching these patterns will not have the import map injected.
   * @param {string} [options.packagePath="."] Path of the package to generate the import map for. This should be the directory containing the package.json file.
   * @param {boolean} [options.serve=true] Whether to inject import maps into files served by the development server.
   * @param {boolean} [options.write=false] Whether to write the import map into files in the specified path.
   */
  constructor(options) {
    super();
    this.path = options.path;
    this.include = options.include ?? [];
    this.exclude = options.exclude ?? [];
    this.packagePath = options.packagePath ?? ".";
    this.serve = options.serve ?? true;
    this.write = options.write ?? false;
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onBuild(params) {
    if (!this.write) {
      return;
    }

    log(LogLevel.INFO, `🗺️ Generating and writing import maps in "${this.path}".`);
    if (this.include.length > 0) {
      log(LogLevel.VERBOSE, `Including ${this.include.map((regex) => `"${regex.source}"`).join(", ")}`);
    }
    if (this.exclude.length > 0) {
      log(LogLevel.VERBOSE, `Excluding ${this.exclude.map((regex) => `"${regex.source}"`).join(", ")}`);
    }

    if (this.#importMap === undefined) {
      this.#importMap = await this.#generateImportMap(this.packagePath);
    }

    await this.#injectIntoPath(this.path, this.#importMap);
  }

  /**
   * @param {Object} params
   * @param {BuildConfig} params.buildConfig
   */
  async onWatch(params) {
    if (!this.write) {
      return;
    }

    const isPathADirectory = await directoryExists(this.path);
    const absoluteOutputPath = getAbsolutePath(this.path);

    buildEvents.fileChanged.subscribe(async (event) => {
      const isFileInPath = event.data.absolute.startsWith(absoluteOutputPath);
      const isFileAtPath = event.data.absolute === absoluteOutputPath;

      if (
        (isPathADirectory && !isFileInPath) ||
        (!isPathADirectory && !isFileAtPath)
      ) {
        return;
      }

      if (this.#importMap === undefined) {
        this.#importMap = await this.#generateImportMap(this.packagePath);
      }

      await this.#injectIntoPath(event.data.absolute, this.#importMap);
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

    if (data === null) {
      return data;
    }

    if (this.#importMap === undefined) {
      this.#importMap = await this.#generateImportMap(this.packagePath);
    }

    const filePath = typeof data.meta?.filePath === "string"
      ? data.meta.filePath
      : undefined;

    if (filePath === undefined) {
      log(LogLevel.WARNING, `Cannot inject import map into response with no file path, skipping.`);
      return data;
    }

    if (
      this.include.length > 0 &&
      this.include.every((regex) => !regex.test(filePath))
    ) {
      return data;
    }

    if (this.exclude.some((regex) => regex.test(filePath))) {
      return data;
    }

    const importMapForPath = await this.#transformImportMapForPath(
      this.#importMap,
      filePath,
    );

    log(LogLevel.VERBOSE, `Injecting import map into ile "${filePath}" served at "${req.url}".`);

    const newContent = await this.#injectIntoContent(
      data.content.toString(),
      data.type,
      importMapForPath,
    );

    data.content = Buffer.from(newContent);

    return data;
  }

  /**
   * @param {string} packagePath
   * @returns {Promise<ImportMap>}
   */
  async #generateImportMap(packagePath) {
    const startTime = performance.now();

    /** @type {ImportMap} */
    const importMap = {
      imports: {},
      scopes: {}
    };

    await this.#populateImportMap(packagePath, importMap);

    const endTime = performance.now();

    log(LogLevel.VERBOSE, `Generated import map in ${((endTime - startTime) / 1000).toFixed(3)} seconds`);

    return importMap;
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

        const absolutePath = getAbsolutePath(pathInOwnModules);
        importMap.scopes[scope][`${dependency}`] = `${absolutePath}/${dependencyEntryFile}`;
        importMap.scopes[scope][`${dependency}/`] = `${absolutePath}/`;
      } else {
        const absolutePath = getAbsolutePath(pathInProjectModules);
        importMap.imports[`${dependency}`] = `${absolutePath}/${dependencyEntryFile}`;
        importMap.imports[`${dependency}/`] = `${absolutePath}/`;
      }

      await this.#populateImportMap(dependencyPackagePath, importMap);
    }
  }

  /**
   * @param {ImportMap} importMap
   * @returns {Promise<string>}
   */
  async #generateScriptElement(importMap) {
    const importMapString = JSON.stringify(importMap, null, 2);
    return `<script type="importmap">\n${indent(importMapString, 1)}\n</script>`;
  }

  /**
   * @param {string} path
   * @param {ImportMap} importMap
   */
  async #injectIntoPath(path, importMap) {
    if (await fileExists(path)) {
      const contentType = getContentTypeByPath(path);
      const fileContent = await readFile(path, "utf-8");

      const importMapForPath = await this.#transformImportMapForPath(importMap, path);

      const newContent = await this.#injectIntoContent(fileContent, contentType, importMapForPath);

      if (newContent === fileContent) {
        return;
      }

      log(LogLevel.VERBOSE, `Injecting import map into file "${path}".`);

      await writeFile(path, newContent);
    } else if (await directoryExists(this.path)) {
      await this.#injectIntoDirectory(path, importMap);
    } else {
      throw new BuildError(`Path "${this.path}" does not exist.`);
    }
  }

  /**
   * @param {ImportMap} importMap
   * @param {string} path
   * @returns {Promise<ImportMap>}
   */
  async #transformImportMapForPath(importMap, path) {
    /** @type {ImportMap} */
    const importMapForPath = { imports: {}, scopes: {} };

    const absolutePath = getAbsolutePath(path);

    /** @param {string} newImport */
    const makeRelativePath = async (newImport) => {
      let relativePath = await this.#getRelativePathBetween(absolutePath, newImport);
      relativePath = normalizeSlashes(relativePath);

      const isBare = !relativePath.startsWith(".") && !relativePath.startsWith("/");
      if (isBare) {
        relativePath = `./${relativePath}`;
      }

      return relativePath;
    }

    for (const [originalImport, newImport] of Object.entries(importMap.imports)) {
      const relativePath = await makeRelativePath(newImport);
      importMapForPath.imports[originalImport] = relativePath
    }

    for (const [scope, imports] of Object.entries(importMap.scopes)) {
      for (const [originalImport, newImport] of Object.entries(imports)) {
        if (importMapForPath.scopes[scope] === undefined) {
          importMapForPath.scopes[scope] = {};
        }

        const relativePath = await makeRelativePath(newImport);
        importMapForPath.scopes[scope][originalImport] = relativePath;
      }
    }

    return importMapForPath;
  }

  /**
   * @param {string} path
   * @param {ImportMap} importMap
   */
  async #injectIntoDirectory(path, importMap) {
    const files = await readdir(path, { recursive: true });

    for (const file of files) {
      if (
        this.include.length > 0 &&
        this.include.every((regex) => !regex.test(file))
      ) {
        continue;
      }

      if (this.exclude.some((regex) => regex.test(file))) {
        continue;
      }

      await this.#injectIntoPath(join(path, file), importMap);
    }
  }

  /**
   * @param {string} content
   * @param {ContentType} contentType
   * @param {ImportMap} importMap
   * @returns {Promise<string>}
   */
  async #injectIntoContent(content, contentType, importMap) {
    switch (contentType) {
      case ContentType.HTML: {
        return await this.#injectIntoHtml(content, importMap);
      }
      case ContentType.JS: {
        return await this.#injectIntoJs(content, importMap);
      }
      default: {
        log(LogLevel.WARNING, `Cannot inject import map into file "${this.path}" with content type "${contentType}", skipping.`);
        return content;
      }
    }
  }

  /**
   * @param {string} content
   * @param {ImportMap} importMap
   * @returns {Promise<string>}
   */
  async #injectIntoHtml(content, importMap) {
    const scriptElement = await this.#generateScriptElement(importMap);
    return injectIntoHead(content, scriptElement);
  }

  /**
   * @param {string} contents
   * @param {ImportMap} importMap
   * @returns {Promise<string>}
   */
  async #injectIntoJs(contents, importMap) {
    const imports = this.#getImports(contents);

    if (imports.length === 0) {
      return contents;
    }

    return this.#replaceImports(contents, imports, importMap);
  }

  /**
   * @param {string} content
   * @returns {Array<{ index: number, length: number, text: string }>}
   */
  #getImports(content) {
    let imports = [];

    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push({
        index: match.index,
        length: match[0].length,
        text: match[0],
      });
    }

    return imports;
  }

  /**
   * @param {string} content
   * @param {Array<{ index: number, length: number, text: string }>} imports
   * @param {ImportMap} importMap
   * @returns {string}
   */
  #replaceImports(content, imports, importMap) {
    for (const imp of imports) {
      const { text, length, index } = imp;
      for (const [originalImport, newImport] of Object.entries(importMap.imports)) {
        const quoteChar = originalImport.includes("'") ? "'" : '"';
        const originalImportStr = `${quoteChar}${originalImport}${quoteChar}`;
        if (text.includes(originalImportStr)) {
          const newImportStr = `${quoteChar}${newImport}${quoteChar}`;
          const newText = text.replace(originalImportStr, newImportStr);
          content = (
            content.slice(0, index) +
            newText +
            content.slice(index + length)
          );
        }
      }
    }

    return content;
  }

  /**
   * @param {string} from
   * @param {string} to
   * @returns {Promise<string>}
   */
  async #getRelativePathBetween(from, to) {
    const fromParts = from.split("/");
    const toParts = to.split("/");

    let i = 0;
    while (fromParts[i] === toParts[i]) {
      i++;
    }

    const remainingToParts = toParts.slice(i);
    let remainingFromParts = fromParts.slice(i);

    const isFile = await fileExists(from);
    if (isFile) {
      remainingFromParts = remainingFromParts.slice(0, -1);
    }

    const relativePath = [...remainingFromParts.map(() => ".."), ...remainingToParts].join("/");

    return relativePath;
  }
}
