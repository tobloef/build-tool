const OutputFormat = {
  RESET: "\x1b[0m",
  DEFAULT_COLOR: "\x1b[39m",
  BOLD: "\x1b[1m",
  NO_BOLD: "\x1b[21m",
  RED: "\x1b[31m",
  GREEN: "\x1b[32m",
  YELLOW: "\x1b[33m",
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
    color: OutputFormat.DEFAULT_COLOR,
  },
  INFO: {
    level: 1,
    name: "Info",
    stream: process.stdout,
    color: OutputFormat.DEFAULT_COLOR,
  },
  WARNING: {
    level: 2,
    name: "Warning",
    stream: process.stderr,
    color: OutputFormat.YELLOW,
  },
  ERROR: {
    level: 3,
    name: "Error",
    stream: process.stderr,
    color: OutputFormat.RED,
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

  level.stream.write(level.color + message + OutputFormat.RESET);
}
