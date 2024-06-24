/**
 * @param {any} object
 * @param {string} key
 * @returns {string}
 */
export function getRequiredString(object, key) {
  return getRequiredField(object, key, "string");
}

/**
 * @param {any} object
 * @param {string} key
 * @returns {string | undefined}
 */
export function getOptionalString(object, key) {
  return getOptionalField(object, key, "string");
}

/**
 * @param {any} object
 * @param {string} key
 * @returns {boolean}
 */
export function getRequiredBoolean(object, key) {
  return getRequiredField(object, key, "boolean");
}

/**
 * @param {any} object
 * @param {string} key
 * @returns {boolean | undefined}
 */
export function getOptionalBoolean(object, key) {
  return getOptionalField(object, key, "boolean");
}

/**
 * @param {any} object
 * @param {string} key
 * @returns {number}
 */
export function getRequiredNumber(object, key) {
  return getRequiredField(object, key, "number");
}

/**
 * @param {any} object
 * @param {string} key
 * @returns {number | undefined}
 */
export function getOptionalNumber(object, key) {
  return getOptionalField(object, key, "number");
}

/**
 * @param {any} object
 * @param {string} key
 * @returns {string[]}
 */
export function getRequiredStringArray(object, key) {
  if (!object[key]) {
    throw new Error(`Field "${key}" is required.`);
  }

  if (!Array.isArray(object[key]) || object[key].some((item) => typeof item !== "string")) {
    throw new Error(`Field "${key}" must be an array of strings.`);
  }

  return object[key];
}

/**
 * @param {any} object
 * @param {string} key
 * @returns {string[] | undefined}
 */
export function getOptionalStringArray(object, key) {
  if (!object[key]) {
    return undefined;
  }

  return getRequiredStringArray(object, key);
}

/**
 * @param {any} object
 * @param {string} key
 * @param {string} type
 * @return {*}
 */
function getRequiredField(object, key, type) {
  if (!object[key]) {
    throw new Error(`Field "${key}" is required.`);
  }

  if (typeof object[key] !== type) {
    throw new Error(`Field "${key}" must be a ${type}.`);
  }

  return object[key];
}

/**
 * @param {any} object
 * @param {string} key
 * @param {string} type
 * @return {* | undefined}
 */
function getOptionalField(object, key, type) {
  if (!object[key]) {
    return undefined;
  }

  return getRequiredField(object, key, type);
}