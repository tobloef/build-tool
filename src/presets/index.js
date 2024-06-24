import { createRequire } from "module";

const web = createRequire(import.meta.url)("./web.json");

const presets = {
  web,
};

export default presets;