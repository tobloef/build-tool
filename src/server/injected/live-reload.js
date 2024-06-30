const reloadEmoji = String.fromCodePoint(0x1F504);

const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.debug(`${reloadEmoji} Live reloading enabled`);
});

socket.addEventListener("message", (event) => {
  if (event.data === "live reload") {
    console.debug("Live reloading page");
    window.location.reload();
  }
});

socket.addEventListener("close", () => {
  console.debug("Lost connection to dev server, refresh the page to reconnect");
});
