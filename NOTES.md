## Hot Reloading Limitations

* JS files imported directly by HTML is not hot-reloaded, only their imports (and their imports ofc)

## To-do

* Make injected hot script be an importable module (so you can use it without injection)
* Figure out how to register that a file type should be handled hotly
* Figure out how to live-reload in cases where hot-reloading is not possible. Maybe consolidate the two approaches, so the client handles if it should live-reload? That way we also have a script less maybe.
* 