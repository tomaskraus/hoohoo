/**
 * API
 */

const { appLog } = require("./logger.js");
const log = appLog.extend("engine");

const DEFAULT_OPTIONS = {
  languageExtension: "js",
};

const extractMdToDir = async (
  mdFileName,
  destinationDirName,
  options = DEFAULT_OPTIONS
) => {
  log(
    `extracting [${options.languageExtension}] sections of [${mdFileName}] file to [${destinationDirName}] directory`
  );

  beforeExtract(destinationDirName);

  let extractedFileCount = 0;
  let totalSectionCount = 0;

  return await [extractedFileCount, totalSectionCount];
};

// -------------------------------------------------------

const beforeExtract = (extractDirName) => {
  log(`beforeExtract: dirName: [${extractDirName}]`);
  // throw new Error("Not implemented!");
};

module.exports = {
  extractMdToDir,
};
