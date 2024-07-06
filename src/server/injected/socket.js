export const socket = new WebSocket(`ws://${window.location.host}`);

socket.addEventListener("open", () => {
  console.debug("WebSocket connection established with dev server");
});

socket.addEventListener("close", () => {
  console.warn("Lost connection to dev server, refresh the page to reconnect");
});
