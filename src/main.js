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

const print = console.error;

// -------------------------------------------

const extract = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  const message = `extracting [${options.languageExtension}] code blocks of [${mdFileName}] file to [${extractedDirName}] directory ...`;
  log(message);
  print(message);

  await resetDir(extractedDirName);

  const lines = await loadInputFileLines(mdFileName);
  const codeBlocks = engine.getCodeBlockList(lines, options.languageExtension);

  return Promise.all(
    codeBlocks
      .map((block) => [`//index:${block.startIndex}`, ...block.data]) // adds index header info
      .map((blockData, index) => {
        const fname = Path.join(
          extractedDirName,
          getExtractedFileName(
            mdFileName,
            index,
            getFileExtensionFromLanguage(options.languageExtension)
          )
        );
        log(`  creating file [${fname}]`);
        fs.writeFile(fname, blockData.join("\n"));
      })
  ).then(() => {
    const message = `extracted [${codeBlocks.length}] blocks to files under the [${extractedDirName}] directory`;
    log(message);
    print(message);
    return 0;
  });
};

const check = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  const message = `checking [${options.languageExtension}] files of [${mdFileName}] file in [${extractedDirName}] directory:`;
  log(message);
  print(message);

  const files = (await fs.readdir(extractedDirName))
    .filter((name) =>
      name.endsWith(
        "." + getFileExtensionFromLanguage(options.languageExtension)
      )
    )
    .map((f) => Path.join("..", extractedDirName, f));

  return Promise.all(
    files.reduce((acc, name) => {
      print(`check ${name}`);
      return [...acc, engine.checkOneFile(name)];
    }, [])
  ).then((results) => {
    log("check: results:", results);
    const failedCount = results.filter((res) => !res.pass).length;
    log(`failedCount: ${failedCount}`);
    return failedCount > 0 ? 1 : 0;
  });
};

// -------------------------------------------

const getFileExtensionFromLanguage = (languageExtension) => languageExtension;

const getExtractedDirName = (fileName) => {
  const fname = Path.parse(fileName).base;
  return Path.join(".", `.${APP_NAME}.${fname}.extracted.dir`);
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
  check,
};
