import { BuildConfig } from "../build-config.js";
import { Copy } from "../modules/copy.js";
import { NpmInstall } from "../modules/npm-install.js";

class WebPreset extends BuildConfig {
  static pipeline = [
    new Copy({
      label: "📄 Copying source files",
      from: "src",
      to: "build",
      files: [
        /.+.js$/,
        /.+.html$/,
      ],
    }),
    new Copy({
      label: "📄 Copying package files",
      from: ".",
      to: "build",
      recursive: false,
      files: [
        /package.json/,
        /package-lock.json/,
      ],
    }),
    new NpmInstall({
      label: "📦 Installing dependencies",
      directory: "build",
    }),
  ];
}

export default WebPreset;