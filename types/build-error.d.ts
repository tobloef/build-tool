export default BuildError;
declare class BuildError extends Error {
    /**
     * @param {string} message
     */
    constructor(message: string);
}
