/**
 * @abstract
 */
export class BuildModule {
  /**
   * @abstract
   * @return {Promise<void>}
   */
  async run() {
    throw new Error(`Cannot call abstract method "${this.run.name}". Override it in a subclass.`);
  }

  /**
   * @abstract
   * @return {Promise<void>}
   */
  async watch() {
    throw new Error(`Cannot call abstract method "${this.watch.name}". Override it in a subclass.`);
  }
}