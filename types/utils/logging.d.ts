/**
 * Set the current log level.
 * @param level {LogLevelType}
 */
export function setLogLevel(level: LogLevelType): void;
/**
 * Get the current log level.
 * @returns {LogLevelType}
 */
export function getLogLevel(): LogLevelType;
/**
 * Log a message.
 * @param level {LogLevelType} The log level of the message.
 * @param {string} message The message to log.
 * @param {object} options
 * @param {boolean} [options.noNewline] If true, don't append a newline to the message.
 */
export function log(level: LogLevelType, message: string, { noNewline }?: {
    noNewline?: boolean | undefined;
}): void;
export namespace OutputFormat {
    let RESET: string;
    let DEFAULT_COLOR: string;
    let BOLD: string;
    let NO_BOLD: string;
    let RED: string;
    let GREEN: string;
    let YELLOW: string;
    let GREY: string;
}
/**
 * @typedef LogLevelType
 * @property {number} level
 * @property {string} name
 * @property {NodeJS.WriteStream} stream
 * @property {string} color
 */
/** @type {Record<string, LogLevelType>} */
export const LogLevel: Record<string, LogLevelType>;
export type LogLevelType = {
    level: number;
    name: string;
    stream: NodeJS.WriteStream;
    color: string;
};
