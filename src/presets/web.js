import { BuildConfig } from "../build-config.js";
import { Copy } from "../modules/copy.js";
import { NpmInstall } from "../modules/npm-install.js";

const web = new BuildConfig({
  pipeline: [
    new Copy({
      from: "src",
      to: "build",
      files: [
        /.+.js$/,
        /.+.html$/,
      ],
    }),
    new Copy({
      from: ".",
      to: "build",
      recursive: false,
      files: [
        /package.json/,
        /package-lock.json/,
      ],
    }),
    new NpmInstall({
      directory: "build",
    }),
  ],
});

export default web;