require("./code-service-types");

const { appLog } = require("./logger.js");
const log = appLog.extend("code-test-service");
const vm = require("node:vm");
const fs = require("fs/promises");
const Path = require("path");

// --------------------------------------------------

/**
 * @type {DoCheckFn}
 */
const doCheck = async (
  fileName,
  {
    filenameSubstitute = fileName,
    exampleStartLineInMd = 0,
    exampleHeaderLineCount = 0,
  }
) => {
  log(`doCheck: checking file [${fileName}]:`);

  const codeToRun = await fs.readFile(fileName, { encoding: "utf-8" });
  try {
    const context = vm.createContext(getContext(fileName));
    vm.runInContext(codeToRun, context, {
      filename: filenameSubstitute,
      lineOffset: exampleStartLineInMd - exampleHeaderLineCount - 1,
    });
    return {
      fileName: filenameSubstitute,
      lineNumber: exampleStartLineInMd,
      pass: true,
    };
  } catch (err) {
    log("vm err: ", err);
    return {
      fileName: filenameSubstitute,
      lineNumber: exampleStartLineInMd,
      pass: false,
      error: err,
    };
  }
};

// --------------------------------------------------

const getContext = (fileName) => ({
  /*
    change the "require" behavior in files when they are run!!!
    when required, local files are always searched relative to CWD (current working dir), instead of the directory running file is in
   */
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

// --------------------------------------------------

/**
 * @type {CodeTestService}
 */
const codeTestService = {
  doCheck,
  // doAssert,
};

module.exports = codeTestService;
