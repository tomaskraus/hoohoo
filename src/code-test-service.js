require("./code-service-types");

const { appLog } = require("./logger.js");
const log = appLog.extend("code-test-service");
const vm = require("node:vm");
const fs = require("fs/promises");
const Path = require("path");

const { doTests } = require("clogtest/src/engine.js")();

// --------------------------------------------------

/**
 *
 * @param {string} jsFileName
 * @returns {Promise<CodeCheckResult>}
 */
const doCheck = async (jsFileName) => {
  log(`doCheck: checking file [${jsFileName}]:`);

  const codeToRun = await fs.readFile(jsFileName, { encoding: "utf-8" });
  try {
    const context = vm.createContext(getContext(jsFileName));
    vm.runInContext(codeToRun, context, {
      filename: jsFileName,
      lineOffset: 0,
    });
    return {
      fileName: jsFileName,
      lineNumber: 1,
      pass: true,
    };
  } catch (err) {
    log("vm err: ", err);
    log("vm err stack: ", err.stack);
    const lineNumber = getLineNumberFromStackFileNameLine(
      getFileNameLineFromStack(jsFileName, err.stack)
    );

    log(`lineNumber from stack: [${lineNumber}]`);
    return {
      fileName: jsFileName,
      lineNumber,
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
  doTests,
  getLineNumberFromStackFileName: getLineNumberFromStackFileNameLine,
  getFileNameLineFromStack,
};
