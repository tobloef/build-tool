/**
 * @abstract
 */
export class Module {
  static type = "unknown module";

  /** @type {string | undefined} */
  label;

  /**
   * @param {Object} options
   * @param {string} [options.label] The label for the module.
   */
  constructor(options) {
    this.label = options.label;
  }

  /**
   * @abstract
   * @param {any} json
   * @return {Module}
   */
  static fromJSON(json) {
    throw new Error(`Cannot call abstract method "fromJSON". Override it in a subclass.`);
  }

  /**
   * @abstract
   * @return {Promise<void>}
   */
  async run() {
    throw new Error(`Cannot call abstract method "run". Override it in a subclass.`);
  }
}