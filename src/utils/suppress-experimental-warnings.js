// @ts-nocheck
// noinspection JSValidateTypes

export function suppressExperimentalWarnings() {
  const originalEmit = process.emit;

  process.emit = function (name, data) {
    if (
      name === `warning` &&
      typeof data === `object` &&
      data.name === `ExperimentalWarning`
    ) {
      return false;
    }

    return originalEmit.apply(process, arguments);
  };
}