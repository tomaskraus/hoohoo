const {
  getCodeBlockList,
  getStartIndexFromFileName,
  addHeaderContent,
} = require("../src/engine");

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

// ---------------------------

describe("engine.getCodeBlockList - skip marks", () => {
  test("skip code blocks with the same languageType if there is a skip-comment before them", () => {
    const results = getCodeBlockList(
      `hello,
\`\`\`js
b0
\`\`\` 
    <!-- skip --> 

\`\`\`js
b1
\`\`\` 
world
\`\`\`js
b2
\`\`\``.split("\n"),
      "js"
    );

    expect(results.length).toEqual(2);
    expect(results[0].startIndex).toEqual(2);
    expect(results[0].data).toEqual(["b0"]);
    expect(results[1].startIndex).toEqual(11);
    expect(results[1].data).toEqual(["b2"]);
  });

  test("skip code blocks with the same languageType if there is an alternative (markdown-doctest) skip-comment before them", () => {
    const results = getCodeBlockList(
      `hello,
\`\`\`js
b0
\`\`\` 
    <!-- skip --> 

\`\`\`js
b1
\`\`\` 
<!-- skip-example --> 
world
\`\`\`js
b2
\`\`\``.split("\n"),
      "js"
    );

    expect(results.length).toEqual(1);
    expect(results[0].startIndex).toEqual(2);
    expect(results[0].data).toEqual(["b0"]);
  });

  test("return empty list if all the code is marked by skip-comment", () => {
    const results = getCodeBlockList(
      `hello,
    <!-- skip --> 
    
\`\`\`js
b1
\`\`\` 
<!--  skip   -->
\`\`\`js
b2
\`\`\``.split("\n"),
      "js"
    );

    expect(results.length).toEqual(0);
  });

  test("skip-comment(s) without code blocks do nothing", () => {
    const results = getCodeBlockList(
      `hello,
    <!-- skip --> 

    <!-- skip --> 
    `.split("\n"),
      "js"
    );

    expect(results.length).toEqual(0);
  });
});

// ---------------------------

describe("engine.getCodeBlockList - addHeaderLines", () => {
  test("adds a header content to the item from input with one code block", () => {
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

    const newResult = result.map(addHeaderContent(["include", "---"]));
    expect(newResult.length).toEqual(1);
    expect(newResult[0].startIndex).toEqual(2);
    expect(newResult[0].data).toEqual(["include", "---", "code ", " block"]);
  });
});

// ---------------------------

describe("engine.getStartIndexFromFileName", () => {
  test("returns startIndex part if startIndex part is present in the fileName", () => {
    expect(getStartIndexFromFileName("file_123.xy")).toEqual(123);
    expect(getStartIndexFromFileName("./tmp/file-20_30_0.xyz")).toEqual(0);
    expect(getStartIndexFromFileName("_1.js")).toEqual(1);
  });
  test("returns -1 part if startIndex part is not present in the fileName", () => {
    expect(getStartIndexFromFileName("file_.xy")).toEqual(-1);
    expect(getStartIndexFromFileName("file.x")).toEqual(-1);
    expect(getStartIndexFromFileName("123")).toEqual(-1);
    expect(getStartIndexFromFileName("")).toEqual(-1);
  });
});
