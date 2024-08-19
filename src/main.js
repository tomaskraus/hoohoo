/**
 * A facade that provides business and presentation logic to the CLI.
 * Uses the engine and reports to the console stdout, stderr.
 */

// const fs = require("fs/promises");

const { extractMdToDir } = require("./engine.js");

const { appLog } = require("./logger.js");
const log = appLog.extend("main");

const getExtractDirName = (fileName) => fileName;

const extract = async (mdFileName, options) => {
  const extractDirName = getExtractDirName(mdFileName);
  log(`extract from md file: [${mdFileName}] to dir: [${extractDirName}]`);
  return await extractMdToDir(mdFileName, extractDirName, options)[0];
};

module.exports = {
  extract,
};
