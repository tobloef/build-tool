import { BuildConfig } from "../build-config.js";
import { Copy, NpmInstall } from "../modules/index.js";

const web = new BuildConfig({
  pipeline: [
    new Copy({
      files: [
        /.+.js$/,
        /.+.html$/,
      ],
    }),
    new Copy({
      from: ".",
      recursive: false,
      files: [
        /package.json/,
        /package-lock.json/,
      ],
    }),
    new NpmInstall(),
  ],
});

export default web;