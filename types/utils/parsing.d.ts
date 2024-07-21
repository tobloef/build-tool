/**
 * @param {any} object
 * @param {string} key
 * @returns {string}
 */
export function getRequiredString(object: any, key: string): string;
/**
 * @param {any} object
 * @param {string} key
 * @returns {string | undefined}
 */
export function getOptionalString(object: any, key: string): string | undefined;
/**
 * @param {any} object
 * @param {string} key
 * @returns {boolean}
 */
export function getRequiredBoolean(object: any, key: string): boolean;
/**
 * @param {any} object
 * @param {string} key
 * @returns {boolean | undefined}
 */
export function getOptionalBoolean(object: any, key: string): boolean | undefined;
/**
 * @param {any} object
 * @param {string} key
 * @returns {number}
 */
export function getRequiredNumber(object: any, key: string): number;
/**
 * @param {any} object
 * @param {string} key
 * @returns {number | undefined}
 */
export function getOptionalNumber(object: any, key: string): number | undefined;
/**
 * @param {any} object
 * @param {string} key
 * @returns {string[]}
 */
export function getRequiredStringArray(object: any, key: string): string[];
/**
 * @param {any} object
 * @param {string} key
 * @returns {string[] | undefined}
 */
export function getOptionalStringArray(object: any, key: string): string[] | undefined;
