/**
 * @param {string} path
 * @returns {path is keyof presetPaths}
 */
export function isPreset(path: string): path is "presets/dev" | "presets/github-pages";
export const presetPaths: {
    "presets/dev": string;
    "presets/github-pages": string;
};
