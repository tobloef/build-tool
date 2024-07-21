/**
 * @template {function} T
 * @param {function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before calling the function.
 * @param {number} [maxWait] The maximum number of milliseconds to wait before calling the function.
 * @return {T} The debounced function.
 */
export function debounce<T extends Function>(func: Function, wait: number, maxWait?: number | undefined): T;
