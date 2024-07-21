![Build Tool Banner](https://github.com/tobloef/build-tool/assets/12204005/641c2ea4-991a-47b6-a4cd-1958813f9c9b)

### Modular build system for web projects, written in Node.js 📦

## Goals

* This project follows my [Wheel Reinventor's Principles](https://github.com/tobloef/wheel-reinventors-principles): In short, it's made from scratch for learning and to tailor it to my specific use cases.
* **Extensibility:** Must be usable across multiple projects, with the possibility of creating project-specific extensions.
* **Vanilla JS:** Written in vanilla JavaScript with [JSDoc](https://github.com/jsdoc/jsdoc) annotations for type checking, no transpilation step necessary.

> [!WARNING]
> This project was created primarily for personal use. For this reason, it is not fully documented and I would not recommend using it. That said, I hope it can at least be inspirational for your own projects.

## Features

* Configuration-driven pipelines ([see example pipelines]()).
* Extensible module system ([list of built-in modules]()).
* Build once or continuously watch for changes.
* Support for both live reloading (refresh page) and hot reloading (swap changed assets out on the fly).
* Generate import maps for your dependencies (useful to load from `node_modules` for example).

## Usage

```
// TODO
```

## Limitations

* `require` is not supported, which can be problematic for certain dependencies.
