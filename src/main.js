/**
 * A facade that provides business and presentation logic to the CLI.
 * Uses the engine and reports to the console stdout, stderr.
 */

const APP_NAME = "md-js-test";

const fs = require("fs/promises");
const Path = require("path");

const engine = require("./engine.js");

const { appLog } = require("./logger.js");
const log = appLog.extend("main");

// -------------------------------------------

const extract = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  log(
    `extracting [${options.languageExtension}] code block of [${mdFileName}] file to [${extractedDirName}] directory ...`
  );

  await resetDir(extractedDirName);

  const lines = await loadInputFileLines(mdFileName);
  const codeBlocks = engine.getCodeBlockList(lines, options.languageExtension);

  Promise.all(
    codeBlocks.map((block, index) => {
      const fname = Path.join(
        extractedDirName,
        getExtractedFileName(
          mdFileName,
          index,
          getFileExtensionFromLanguage(options.languageExtension)
        )
      );
      log(`  creating file [${fname}]`);
      fs.writeFile(fname, block.join("\n"));
    })
  ).then(() => {
    log(
      `extracted [${codeBlocks.length}] blocks to files under the [${extractedDirName}] directory`
    );
    return codeBlocks.length;
  });
};

// -------------------------------------------

const getFileExtensionFromLanguage = (languageExtension) => languageExtension;

const getExtractedDirName = (fileName) => {
  const fname = Path.parse(fileName).base;
  return Path.resolve(Path.dirname("."), `.${APP_NAME}.${fname}.extracted.dir`);
};

const getExtractedFileName = (fileName, index, extensionWithoutLeadingDot) =>
  `${Path.parse(fileName).name}-${(index + 1 + "").padStart(4, "0")}.${extensionWithoutLeadingDot}`;

const resetDir = async (extractDirName) => {
  log(`resetDir:  [${extractDirName}]`);
  await fs.rm(extractDirName, { recursive: true, force: true });
  await fs.mkdir(extractDirName);
};

/**
 *
 * @param {string} fileName
 * @returns {Promise<string[]>}
 */
const loadInputFileLines = async (fileName) => {
  log(`opening input file [${fileName}]`);
  const data = await fs.readFile(fileName, { encoding: "utf-8" });
  return data.split("\n");
};

module.exports = {
  extract,
};
