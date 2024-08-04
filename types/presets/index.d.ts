/**
 * @param {string} path
 * @returns {path is keyof presetPaths}
 */
export function isPreset(path: string): path is "presets/dev" | "presets/github-pages";
/** @import { BuildConfig } from "../build-config.js"; */
/** @type {Record<keyof presetPaths, BuildConfig>} */
export const presets: Record<"presets/dev" | "presets/github-pages", BuildConfig>;
export const presetPaths: {
    "presets/dev": string;
    "presets/github-pages": string;
};
import type { BuildConfig } from "../build-config.js";
