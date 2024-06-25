/**
 * @abstract
 */
export class Module {
  /** @type {string} */
  label;

  /**
   * @param {Object} options
   * @param {string} options.label The label for the module.
   */
  constructor(options) {
    this.label = options.label;
  }

  /**
   * @abstract
   * @return {Promise<void>}
   */
  async runOnce() {
    throw new Error(`Cannot call abstract method "run". Override it in a subclass.`);
  }

  /**
   * @abstract
   * @return {Promise<void>}
   */
  async runContinuously() {
    throw new Error(`Cannot call abstract method "runContinuously". Override it in a subclass.`);
  }
}