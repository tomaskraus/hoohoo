/**
 * A facade that provides business and presentation logic to the CLI.
 * Uses the engine and reports to the console stdout, stderr.
 */

const APP_NAME = "hoohoo";

const fs = require("fs/promises");
const Path = require("path");

const engine = require("./engine.js");

const { appLog } = require("./logger.js");
const log = appLog.extend("main");

// -------------------------------------------

const print = console.error;

// -------------------------------------------

const DEFAULT_OPTIONS = {
  languageExtension: "js",
  doExtractStep: true,
};

const extract = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  const message = `extracting [${options.languageExtension}] code blocks of [${mdFileName}] file to [${extractedDirName}] directory ...`;
  log(message);
  print(message);

  await resetDir(extractedDirName);

  log(`looking for a [${options.languageExtension}] header file`);
  const headerLines = await loadSafeInputFileLines(
    getHeaderFileName(mdFileName, options)
  );

  const lines = await loadInputFileLines(mdFileName);
  let codeBlocks = engine.getCodeBlockList(lines, options.languageExtension);
  if (headerLines) {
    log(`header file lines: `, headerLines);
    codeBlocks = codeBlocks.map(engine.addHeaderContent(headerLines));
  }
  log(`code blocks: `, codeBlocks);

  return Promise.all(
    codeBlocks.map((block, index) => {
      const fname = Path.join(
        extractedDirName,
        getExtractedFileName(
          mdFileName,
          index,
          block.startIndex,
          getFileExtensionFromLanguage(options.languageExtension)
        )
      );
      log(`  creating file [${fname}]`);
      fs.writeFile(fname, block.data.join("\n"));
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
  const message = `checking [${options.languageExtension}] files of [${mdFileName}] file in the [${extractedDirName}] directory:`;
  log(message);
  print(message);

  if (options.doExtractStep) {
    await extract(mdFileName, options);
  } else {
    log("- Skipping the extraction step.");
  }

  const files = (await fs.readdir(extractedDirName))
    .filter((name) =>
      name.endsWith(
        "." + getFileExtensionFromLanguage(options.languageExtension)
      )
    )
    .map((f) => Path.join(extractedDirName, f));

  return Promise.all(
    files.reduce((acc, name) => {
      // print(`check ${name}`);
      return [...acc, engine.checkOneFile(mdFileName, name)];
    }, [])
  ).then((results) => {
    log("check: results:", results);
    const fails = results.filter((res) => !res.pass);
    const failedCount = fails.length;
    log(`failedCount: ${failedCount}`);
    if (failedCount > 0) {
      for (f of fails) {
        print(f);
      }
      return 1;
    }
    return 0;
  });
};

// -------------------------------------------

const getFileExtensionFromLanguage = (languageExtension) => languageExtension;

const getExtractedDirName = (fileName) => {
  const fdir = Path.parse(fileName).dir;
  const fname = Path.parse(fileName).base;
  return Path.join(fdir, `.${APP_NAME}.${fname}.extracted`);
};

const getHeaderFileName = (fileName, { languageExtension }) => {
  const p = Path.parse(fileName);
  return Path.join(
    p.dir,
    `${APP_NAME}.${p.base}.header.${getFileExtensionFromLanguage(languageExtension)}`
  );
};

const getExtractedFileName = (
  fileName,
  index,
  startIndex,
  extensionWithoutLeadingDot
) =>
  `${Path.parse(fileName).name}-${(index + 1 + "").padStart(4, "0")}_${startIndex === -1 ? "" : startIndex}.${extensionWithoutLeadingDot}`;

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

const loadSafeInputFileLines = async (fileName) => {
  let lines = null;
  try {
    lines = await loadInputFileLines(fileName);
  } catch (err) {
    log(`loadSafe not successful: [${err.message}]`);
  }
  return lines;
};

module.exports = {
  extract,
  check,
};
