/**
 * @param {() => void} onQuit
 */
export function setupQuitHandler(onQuit) {
  process.stdin.setRawMode(true);
  process.stdin.resume();
  process.stdin.setEncoding("utf8");
  process.stdin.on("data", (key) => {
    if (typeof key !== "string") {
      return;
    }

    if (key === "q") {
      onQuit();
    }

    if (key === "\u0003") {
      onQuit();
    }
  });
}
