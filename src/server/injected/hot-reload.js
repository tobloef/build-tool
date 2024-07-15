// @ts-ignore
import { socket } from "/@injected/socket.js";
import { HotReload } from "@tobloef/hot-reload";

const hotReload = new HotReload(window.location.origin);

socket.addEventListener("message", handleMessage);

socket.addEventListener("open", () => {
  const hotEmoji = String.fromCodePoint(0x1F525);
  console.info(`${hotEmoji} Hot reloading enabled`);
});

/**
 * @param {MessageEvent} event
 */
function handleMessage(event) {
  const prefix = "hot reload: ";

  if (!event.data.startsWith(prefix)) {
    return;
  }

  const canonicalPath = event.data.slice(prefix.length);

  const wasAccepted = hotReload.reload(canonicalPath);

  if (!wasAccepted) {
    window.location.reload();
  }
}
