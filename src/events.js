export const buildEvents = {
  /** @type {BuildEventType<string>} */
  fileChanged: createBuildEventType(),
  /** @type {BuildEventType<void>} */
  reloadRequested: createBuildEventType(),
};


/**
 * @template T
 * @typedef {Object} BuildEventType
 * @property {(listener: BuildEventListener<T>) => Unsubscribe} subscribe
 * @property {(event: T) => void} publish
 */

/**
 * @template T
 * @typedef {(event: BuildEvent<T>) => Promise<void>} BuildEventListener
 */

/**
 * @typedef {() => void} Unsubscribe
 */

/**
 * @template T
 * @typedef {Object} BuildEvent
 * @property {() => void} stopPropagation
 * @property {boolean} isPropagationStopped
 * @property {T} data
 */

/**
 * @template T
 * @returns {BuildEventType<T>}
 */
function createBuildEventType() {
  /** @type {Record<number, (event: BuildEvent<T>) => void>} */
  const listeners = {};

  let nextId = 0;

  return {
    subscribe: (listener) => {
      const id = nextId++;

      listeners[id] = listener;

      return () => {
        delete listeners[id];
      };
    },
    publish: (data) => {
      const event = {
        stopPropagation: () => {
          event.isPropagationStopped = true;
        },
        data,
        isPropagationStopped: false,
      };

      for (const listener of Object.values(listeners)) {
        listener(event);

        if (event.isPropagationStopped) {
          break;
        }
      }
    },
  };
}
