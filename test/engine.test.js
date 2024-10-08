const {
  getCodeBlockList,
  getStartIndexFromExtractedFileName,
  getLineNumberFromStackFileName,
  getFileNameLineFromStack,
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

  test("returns also empty code blocks", () => {
    const results = getCodeBlockList(
      `hello,
\`\`\`js
\`\`\` 
world
\`\`\`js
 
\`\`\``.split("\n"),
      "js"
    );

    expect(results.length).toEqual(2);
    expect(results[0].data).toEqual([]);
    expect(results[1].data).toEqual([" "]);
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
  test("sets skip to code blocks with the same languageType if there is a skip-comment before them", () => {
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

    expect(results.length).toEqual(3);
    expect(results[0].startIndex).toEqual(2);
    expect(results[0].data).toEqual(["b0"]);
    expect(results[0].skip).toBeFalsy();

    expect(results[1].startIndex).toEqual(7);
    expect(results[1].data).toEqual(["b1"]);
    expect(results[1].skip).toBeTruthy();

    expect(results[2].startIndex).toEqual(11);
    expect(results[2].data).toEqual(["b2"]);
    expect(results[2].skip).toBeFalsy();
  });

  test("sets skip to code blocks with the same languageType if there is an alternative (markdown-doctest) skip-comment before them", () => {
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

    expect(results.length).toEqual(3);
    expect(results[0].startIndex).toEqual(2);
    expect(results[0].data).toEqual(["b0"]);
    expect(results[0].skip).toBeFalsy();

    expect(results[1].startIndex).toEqual(7);
    expect(results[1].data).toEqual(["b1"]);
    expect(results[1].skip).toBeTruthy();

    expect(results[2].startIndex).toEqual(12);
    expect(results[2].data).toEqual(["b2"]);
    expect(results[2].skip).toBeTruthy();
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

  test("skip-comment's power ends at the very next closing markdown code-tag, regardless of the language extension of opening code-tag", () => {
    const results = getCodeBlockList(
      `hello,
  <!-- skip --> 
    
\`\`\`js
b1
\`\`\` 

\`\`\`ts
b2
\`\`\``.split("\n"),
      "ts"
    );
    expect(results.length).toEqual(1);
    expect(results[0].startIndex).toEqual(8);
    expect(results[0].data).toEqual(["b2"]);
  });
});

// ---------------------------

describe("engine.getCodeBlockList - addHeaderLines", () => {
  test("adds a header content to the item from input with one code block", () => {
    const result = getCodeBlockList(
      `hello,
      x
\`\`\`js
code 
 block
\`\`\` 
world`.split("\n"),
      "js"
    );
    expect(result.length).toEqual(1);
    expect(result[0].startIndex).toEqual(3);
    expect(result[0].data).toEqual(["code ", " block"]);

    const newResult = result.map(addHeaderContent(["include", "---"]));
    expect(newResult.length).toEqual(1);
    expect(newResult[0].startIndex).toEqual(3);
    expect(newResult[0].data).toEqual(["include", "---", "code ", " block"]);
  });
});

// ---------------------------

describe("engine.getStartIndexFromFileName", () => {
  test("returns startIndex part if startIndex part is present in the fileName", () => {
    expect(getStartIndexFromExtractedFileName("file_123.xy")).toEqual(122);
    expect(
      getStartIndexFromExtractedFileName("./tmp/file-20_30_1.xyz")
    ).toEqual(0);
    expect(getStartIndexFromExtractedFileName("_1.js")).toEqual(0);
  });
  test("returns -1 part if startIndex part is not present in the fileName", () => {
    expect(getStartIndexFromExtractedFileName("file_.xy")).toEqual(-1);
    expect(getStartIndexFromExtractedFileName("file.x")).toEqual(-1);
    expect(getStartIndexFromExtractedFileName("123")).toEqual(-1);
    expect(getStartIndexFromExtractedFileName("")).toEqual(-1);
  });
});
