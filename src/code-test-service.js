require("./code-service-types");

const { appLog } = require("./logger.js");
const log = appLog.extend("code-test-service");
const vm = require("node:vm");
const fs = require("fs/promises");
const Path = require("path");

// --------------------------------------------------

const indentity = (x) => x;

// const compose2 = (a, b) => (x) => a(b(x));

/**
 * @type {DoCheckFn}
 */
const doCheck = async (
  fileName,
  { filenameSubstitute = fileName, lineNumberFunc = indentity }
) => {
  log(`doCheck: checking file [${fileName}]:`);

  const codeToRun = await fs.readFile(fileName, { encoding: "utf-8" });
  try {
    const context = vm.createContext(getContext(fileName));
    vm.runInContext(codeToRun, context, {
      filename: fileName,
      lineOffset: 0,
    });
    return {
      fileName: filenameSubstitute,
      lineNumber: lineNumberFunc(1),
      pass: true,
    };
  } catch (err) {
    log("vm err: ", err);
    log("vm err stack: ", err.stack);
    const lineNumber = getLineNumberFromStackFileNameLine(
      getFileNameLineFromStack(fileName, err.stack)
    );

    log(`lineNumber from stack: [${lineNumber}]`);
    return {
      fileName: filenameSubstitute,
      lineNumber: lineNumberFunc(lineNumber),
      pass: false,
      error: err,
    };
  }
};

// --------------------------------------------------

const getContext = (fileName) => ({
  require: (requiredFileName) => {
    const fname = requiredFileName.startsWith(".")
      ? Path.join(process.cwd(), Path.parse(fileName).dir, requiredFileName)
      : requiredFileName;
    log(`custom require: [${fname}] (orig: [${requiredFileName}])`);
    return require(fname);
  },
  console,
  exports,
});

// -------------------------------------------------

/**
 *
 * @param {string} fileName
 * @returns {number} lineNumber part if lineNumber part is present in the fileName, or -1 if lineNumber is not found in the fileName string
 */
const getLineNumberFromStackFileNameLine = (fileName) => {
  const lineRegex = /:(\d+)(:\d+)?\)?\s*$/;
  const res = fileName.match(lineRegex);
  return res ? parseInt(res[1]) : -1;
  // return 0;
};

// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_expressions#escaping
const escapeRegExp = (string) => string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string

/**
 *
 * @param {string} fileName
 * @param {string[]} stackStr
 * @returns
 */
const getFileNameLineFromStack = (fileName, stackStr) => {
  const filenameRegex = new RegExp(escapeRegExp(fileName));
  return stackStr.split("\n").filter((s) => filenameRegex.test(s))[0] || "";
};
// ----------------------------

module.exports = {
  doCheck,
  getLineNumberFromStackFileName: getLineNumberFromStackFileNameLine,
  getFileNameLineFromStack,
};
