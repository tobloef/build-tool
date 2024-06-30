import { clearTimeout } from "node:timers";

/**
 * @template {function} T
 * @param {T} func The function to debounce.
 * @param {number} wait The number of milliseconds to wait before calling the function.
 * @param {number} [maxWait] The maximum number of milliseconds to wait before calling the function.
 * @return {T} The debounced function.
 */
export function debounce(func, wait, maxWait) {
  let timeout;
  let maxTimeout;

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