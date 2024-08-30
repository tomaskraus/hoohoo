const {
  getLineNumberFromStackFileName,
  getFileNameLineFromStack,
} = require("../src/code-test-service");

describe("engine.getLineNumberFromStackFileName", () => {
  test("returns lineNumber part if lineNumber part is present in the fileName", () => {
    expect(getLineNumberFromStackFileName("file.xy:123")).toEqual(123);
    expect(getLineNumberFromStackFileName("./tmp/file-20_30:1.xyz:2")).toEqual(
      2
    );
    expect(getLineNumberFromStackFileName("_.js:1")).toEqual(1);
  });
  test("returns only the lineNumber part and not the column one", () => {
    expect(getLineNumberFromStackFileName("file.xy:122:45")).toEqual(122);
  });
  test("returns -1 part if lineNumber part is not present in the fileName", () => {
    expect(getLineNumberFromStackFileName("file_.xy:")).toEqual(-1);
    expect(getLineNumberFromStackFileName("file.x")).toEqual(-1);
    expect(getLineNumberFromStackFileName("123")).toEqual(-1);
    expect(getLineNumberFromStackFileName("")).toEqual(-1);
  });
});

describe("engine.getFileNameLineFromStack", () => {
  test("find that in the stack, first line", () => {
    expect(
      getFileNameLineFromStack(
        "_example-1_0004_76.js",
        `examples/example-1_hh/_example-1_0004_76.js:7
    console.log("hu!";
                ^^^^^
    
    SyntaxError: missing ) after argument list
        at new Script (node:vm:116:7)
        at createScript (node:vm:268:10)
        at Object.runInContext (node:vm:299:10)
        at doCheck (/home/ts-user/Dokumenty/ts/hoohoo/src/code-test-service.js:25:8)
        at async Promise.all (index 3)
        at async safeRunner (/home/ts-user/Dokumenty/ts/hoohoo/src/index.js:15:18)
        at async Command.<anonymous> (/home/ts-user/Dokumenty/ts/hoohoo/src/index.js:96:24)`
      )
    ).toMatch("example-1_hh/_example-1_0004_76.js:7");
  });

  test("find that in the stack, somewhere", () => {
    expect(
      getFileNameLineFromStack(
        "_example-1_0004_76.js",
        `- /home/ts-user/Dokumenty/ts/hoohoo/src/code-test-service.js
    - /home/ts-user/Dokumenty/ts/hoohoo/src/main.js
    - /home/ts-user/Dokumenty/ts/hoohoo/src/index.js
    - /home/ts-user/Dokumenty/ts/hoohoo/bin/hoohoo.js
        at Module._resolveFilename (node:internal/modules/cjs/loader:1143:15)
        at Module._load (node:internal/modules/cjs/loader:984:27)
        at Module.require (node:internal/modules/cjs/loader:1231:19)
        at require (node:internal/modules/helpers:179:18)
        at require (/home/ts-user/Dokumenty/ts/hoohoo/src/code-test-service.js:53:12)
        at examples/example-1_hh/_example-1_0004_76.js:5:13
        at Script.runInContext (node:vm:148:12)
        at Object.runInContext (node:vm:300:6)
        at doCheck (/home/ts-user/Dokumenty/ts/hoohoo/src/code-test-service.js:25:8)
        at async Promise.all (index 3) {`
      )
    ).toMatch("at examples/example-1_hh/_example-1_0004_76.js:5:13");
  });

  test("not in the stack", () => {
    expect(
      getFileNameLineFromStack(
        "_example-1_0004_76.js",
        `- /home/ts-user/Dokumenty/ts/hoohoo/src/code-test-service.js`
      )
    ).toEqual("");
  });
});
