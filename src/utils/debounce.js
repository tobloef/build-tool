import { clearTimeout } from "node:timers";

/**
 * @template {function} T
 * @param {function} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before calling the function.
 * @param {number} [maxWait] The maximum number of milliseconds to wait before calling the function.
 * @return {function} The debounced function.
 */
export function debounce(func, wait, maxWait) {
  if (func.constructor.name === "AsyncFunction") {
    return debounceAsync(func, wait, maxWait);
  } else {
    return debounceSync(func, wait, maxWait);
  }
}

/**
 * @template {function} T
 * @param {function} func
 * @param {number} wait
 * @param {number} [maxWait]
 * @return {function}
 */
function debounceSync(func, wait, maxWait) {
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

/**
 * @template {function} T
 * @param {function} func
 * @param {number} wait
 * @param {number} [maxWait]
 * @return {function}
 */
function debounceAsync(func, wait, maxWait) {
  /** @type {number | NodeJS.Timeout | undefined} */
  let timeout;
  /** @type {number | NodeJS.Timeout | undefined} */
  let maxTimeout;

  /**
   * @param {any[]} args
   * @this {any}
   */
  return async function (...args) {
    return new Promise((resolve, reject) => {
      const trigger = () => {
        clearTimeout(timeout);
        timeout = undefined;
        clearTimeout(maxTimeout);
        maxTimeout = undefined;
        func.apply(this, args).then(resolve, reject);
      };

      clearTimeout(timeout);

      timeout = setTimeout(trigger, wait);

      if (maxWait !== undefined && maxTimeout === undefined) {
        maxTimeout = setTimeout(trigger, maxWait);
      }
    });
  };
}