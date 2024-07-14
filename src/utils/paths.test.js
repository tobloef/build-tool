import { describe, it } from "node:test";
import { join, normalizeSlashes } from "./paths.js";
import * as assert from "node:assert";

describe("joinPaths", () => {
  it("relative paths", () => {
    const input = [".", "./a/b", "./c"];
    const expected = "./a/b/c";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("backslashes", () => {
    const input = [".", ".\\a\\b", ".\\c"];
    const expected = ".\\a\\b\\c";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("no dots", () => {
    const input = ["a/b", "c"];
    const expected = "a/b/c";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("empty input", () => {
    const expected = "";
    const actual = join();

    assert.strictEqual(actual, expected);
  });

  it("single input", () => {
    const input = ["./a/b"];
    const expected = "./a/b";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("absolute path", () => {
    const input = ["/a/b", "./c"];
    const expected = "/a/b/c";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("absolute child path", () => {
    const input = ["./a/b", "/c"];
    const expected = "./a/b/c";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("dot slash", () => {
    const input = ["./", "./a", "./"];
    const expected = "./a";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("dot slash", () => {
    const input = [".", "./a", "."];
    const expected = "./a";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("dot dot slash", () => {
    const input = ["./a/b/c", "../d", "../../e"];
    const expected = "./a/e";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });

  it("beginning dot dot slash", () => {
    const input = ["../a/b", "./c"];
    const expected = "../a/b/c";
    const actual = join(...input);

    assert.strictEqual(actual, expected);
  });
});

describe("normalizeSlashes", () => {
  it("forward slashes", () => {
    const input = "a/b/c";
    const expected = "a/b/c";
    const actual = normalizeSlashes(input);

    assert.strictEqual(actual, expected);
  });

  it("backslashes", () => {
    const input = "a\\b\\c";
    const expected = "a/b/c";
    const actual = normalizeSlashes(input);

    assert.strictEqual(actual, expected);
  });

  it("mixed slashes", () => {
    const input = "a\\b/c";
    const expected = "a/b/c";
    const actual = normalizeSlashes(input);

    assert.strictEqual(actual, expected);
  });

  it("no slashes", () => {
    const input = "abc";
    const expected = "abc";
    const actual = normalizeSlashes(input);

    assert.strictEqual(actual, expected);
  });

  it("empty string", () => {
    const input = "";
    const expected = "";
    const actual = normalizeSlashes(input);

    assert.strictEqual(actual, expected);
  });
});