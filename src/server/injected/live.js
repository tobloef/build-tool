// @ts-ignore
import { socket } from "/@injected/socket.js";

/**
 * @param {MessageEvent} event
 */
function handleMessage(event) {
  if (event.data === "live reload") {
    console.debug("Live reloading page");
    window.location.reload();
  }
}

socket.addEventListener("message", handleMessage);

socket.addEventListener("open", () => {
  const reloadEmoji = String.fromCodePoint(0x1F504);
  console.info(`${reloadEmoji} Live reloading enabled`);
});
