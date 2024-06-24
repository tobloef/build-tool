export function suppressExperimentalWarnings() {
  const originalEmit = process.emit;

  process.emit = function (...args) {
    const [name, data] = args;

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