/**
 * @param {string} path
 * @returns {path is keyof presets}
 */
export function isPreset(path: string): path is "presets/dev" | "presets/github-pages";
export const presets: {
    "presets/dev": string;
    "presets/github-pages": string;
};
