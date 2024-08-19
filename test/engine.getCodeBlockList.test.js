const { getCodeBlockList } = require("../src/engine");

describe("engine.getCodeBlockList", () => {
  test("returns empty list from empty input", () => {
    expect(getCodeBlockList("".split("\n"), "js")).toEqual([]);
  });

  test("returns empty list from input without code blocks", () => {
    expect(getCodeBlockList(`hello`.split("\n"), "js")).toEqual([]);
  });

  test("returns empty list from input without code blocks", () => {
    expect(
      getCodeBlockList(
        `hello, 
        world`.split("\n"),
        "js"
      )
    ).toEqual([]);
  });

  test("returns the content of one item from input with one code block", () => {
    expect(
      getCodeBlockList(
        `hello,
\`\`\`js
code 
 block
\`\`\` 
world`.split("\n"),
        "js"
      )
    ).toEqual([["code ", " block"]]);
  });

  test("omits empty code blocks", () => {
    expect(
      getCodeBlockList(
        `hello,
\`\`\`js
\`\`\` 
world
\`\`\`
\`\`\``.split("\n"),
        "js"
      )
    ).toEqual([]);
  });

  test("omits code blocks with different languageType", () => {
    expect(
      getCodeBlockList(
        `hello,
\`\`\`t
b1
\`\`\` 
world
\`\`\`js
b2
\`\`\``.split("\n"),
        "js"
      )
    ).toEqual([["b2"]]);
  });
});
