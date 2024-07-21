/** @import { BuildConfig } from "./build-config.js"; */
/**
 * @param {BuildConfig} buildConfig
 * @return {Promise<void>}
 */
export function runPipelineOnce(buildConfig: BuildConfig): Promise<void>;
/**
 * @param {BuildConfig} buildConfig
 * @return {Promise<void>}
 */
export function runPipelineContinuously(buildConfig: BuildConfig): Promise<void>;
import type { BuildConfig } from "./build-config.js";
