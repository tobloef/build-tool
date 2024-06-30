import { clearTimeout } from "node:timers";

/**
 * @template {function} T
 * @param {function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before calling the function.
 * @param {number} [maxWait] The maximum number of milliseconds to wait before calling the function.
 * @return {function} The debounced function.
 */
export function debounce(func, wait, maxWait) {
  /** @type {number | NodeJS.Timeout | undefined} */
  let timeout;
  /** @type {number | NodeJS.Timeout | undefined} */
  let maxTimeout;

  /**
   * @param {any[]} args
   * @this {any}
   */
  return function (...args) {
    const trigger = () => {
      clearTimeout(timeout);
      timeout = undefined;
      clearTimeout(maxTimeout);
      maxTimeout = undefined;
      return func.apply(this, args);
    };

    clearTimeout(timeout);

    timeout = setTimeout(trigger, wait);

    if (maxWait !== undefined && maxTimeout === undefined) {
      maxTimeout = setTimeout(trigger, maxWait);
    }
  };
}