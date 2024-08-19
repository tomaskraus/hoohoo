const { getCodeBlockList } = require("../src/engine");

describe("engine.getCodeBlockList", () => {
  test("returns empty list from empty input", () => {
    expect(getCodeBlockList("".split("\n"), "js")).toEqual([]);
  });

  test("returns empty list from input without code blocks", () => {
    expect(getCodeBlockList(`hello`.split("\n"), "js")).toEqual([]);
  });

  test("returns empty list from multi-line input without code blocks", () => {
    expect(
      getCodeBlockList(
        `hello, 
        world`.split("\n"),
        "js"
      )
    ).toEqual([]);
  });

  test("returns the content of one item from input with one code block", () => {
    const result = getCodeBlockList(
      `hello,
\`\`\`js
code 
 block
\`\`\` 
world`.split("\n"),
      "js"
    );
    expect(result.length).toEqual(1);
    expect(result[0].startIndex).toEqual(2);
    expect(result[0].data).toEqual(["code ", " block"]);
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
    const results = getCodeBlockList(
      `hello,
\`\`\`t
b1
\`\`\` 
world
\`\`\`js
b2
\`\`\``.split("\n"),
      "js"
    );

    expect(results.length).toEqual(1);
    expect(results[0].startIndex).toEqual(6);
    expect(results[0].data).toEqual(["b2"]);
  });
});
