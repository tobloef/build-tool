const OutputFormat = {
  Reset: "\x1b[0m",
  Bold: "\x1b[1m",
  NoBold: "\x1b[21m",
  DefaultColor: "\x1b[39m",
  Red: "\x1b[31m",
  Green: "\x1b[32m",
  Yellow: "\x1b[33m",
};

/**
 * @typedef LogLevelType
 * @property {number} level
 * @property {string} name
 * @property {NodeJS.WriteStream} stream
 * @property {string} color
 */

/** @type {Record<string, LogLevelType>} */
export const LogLevel = {
  VERBOSE: {
    level: 0,
    name: "Verbose",
    stream: process.stdout,
    color: OutputFormat.DefaultColor,
  },
  INFO: {
    level: 1,
    name: "Info",
    stream: process.stdout,
    color: OutputFormat.DefaultColor,
  },
  WARNING: {
    level: 2,
    name: "Warning",
    stream: process.stderr,
    color: OutputFormat.Yellow,
  },
  ERROR: {
    level: 3,
    name: "Error",
    stream: process.stderr,
    color: OutputFormat.Red,
  },
};

/** @type {LogLevelType} */
let currentLogLevel = LogLevel.INFO;

/**
 * Set the current log level.
 * @param level {LogLevelType}
 */
export function useLogLevel(level) {
  currentLogLevel = level;
}

/**
 * Log a message.
 * @param level {LogLevelType} The log level of the message.
 * @param {string} message The message to log.
 * @param {object} options
 * @param {boolean} [options.noNewline] If true, don't append a newline to the message.
 */
export function log(level, message, { noNewline = false } = {}) {
  if (level.level < currentLogLevel.level) {
    return;
  }

  if (!noNewline) {
    message += "\n";
  }

  level.stream.write(level.color + message + OutputFormat.Reset);
}
