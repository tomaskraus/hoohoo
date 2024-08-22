/**
 * A facade that provides business and presentation logic to the CLI.
 * Uses the engine and reports to the console stdout, stderr.
 */

const APP_NAME = "hoohoo";
const APP_NAME_SHORT = "hh";

const fs = require("fs/promises");
const Path = require("path");

const engine = require("./engine.js");

const { appLog } = require("./logger.js");
const log = appLog.extend("main");

// -------------------------------------------

const print = console.error;

const logAndPrint = (msg) => {
  log(msg);
  print(msg);
};

// -------------------------------------------

const DEFAULT_OPTIONS = {
  languageExtension: "js",
  keepExtracted: false,
  jsDir: null,
};

/**
 *
 * @param {string} mdFileName
 * @param {*} options
 * @returns
 */
const extract = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  logAndPrint(
    `extracting [${options.languageExtension}] examples of [${mdFileName}] file to the [${extractedDirName}] directory ...`
  );
  //
  await createDirIfNotExists(extractedDirName);
  await deleteExtractedExamples(mdFileName, options.languageExtension);
  //
  const headerFileName = getHeaderFileName(
    mdFileName,
    options.languageExtension
  );

  log(
    `looking for a [${headerFileName}] [${options.languageExtension}] header file`
  );
  const headerLines = await loadSafeInputFileLines(headerFileName);
  //
  const lines = await loadInputFileLines(mdFileName);
  let codeBlocks = engine
    .getCodeBlockList(lines, options.languageExtension)
    // remove blocks with an "empty" content
    .filter((b) => b.data.filter((line) => line.trim() !== "").length > 0)
    // remove block that are marked as skipped
    .filter((b) => !b.skip);
  if (headerLines) {
    log(`header file lines: `, headerLines);
    codeBlocks = codeBlocks.map(engine.addHeaderContent(headerLines));
  }
  log(`code blocks: `, codeBlocks);
  //
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
    logAndPrint(
      `extracted [${codeBlocks.length}] [${options.languageExtension}] examples from the [${mdFileName}] file to the [${extractedDirName}] directory.`
    );
    return 0;
  });
};

const hasJsDir = (options) =>
  options.jsDir !== null && options.jsDir !== undefined;

/**
 *
 * @param {string} mdFileName
 * @param {*} options
 * @returns
 */
const check = async (mdFileName, options = DEFAULT_OPTIONS) => {
  log(`check markDown file name: [${mdFileName}]: `);
  const customDirMode = hasJsDir(options);
  if (customDirMode) {
    log(
      `+++ Custom dir mode is active. \n    Check will not extract examples nor provide line numbers on examples' runtime errors.`
    );
  }
  //
  const extractedDirName = getExtractedDirName(mdFileName, options.jsDir);
  const langExt = customDirMode
    ? getFileExtensionFromLanguage("js")
    : getFileExtensionFromLanguage(options.languageExtension);
  logAndPrint(`extracted examples dir: [${extractedDirName}]`);
  logAndPrint(
    `checking [${options.languageExtension}] examples of [${mdFileName}]`
  );
  //
  if (!customDirMode) {
    await extract(mdFileName, options);
    log("- - - - - extracting step done");
  } else {
    log("- Skipping the extraction step.");
  }
  //
  let mdExampleLineOffset = 0;
  if (!customDirMode) {
    const headerFileName = getHeaderFileName(
      mdFileName,
      options.languageExtension
    );
    log(
      `looking for a [${headerFileName}] line count to compute a markdown example line offset`
    );
    mdExampleLineOffset = -(await loadSafeInputFileLines(headerFileName))
      .length;
    log(`mdExampleLineOffset: [${mdExampleLineOffset}]`);
  }
  //

  const exampleFiles = await getExtractedFileNames(
    extractedDirName,
    mdFileName,
    getFileExtensionFromLanguage(langExt)
  );
  return Promise.all(
    exampleFiles.map((fileName) =>
      engine.checkOneFile(mdFileName, fileName, "", mdExampleLineOffset)
    )
  )
    .then((examplesChecked) => {
      log("check: examples:", examplesChecked);
      print(
        `[${examplesChecked.length}] [${options.languageExtension}] example(s) of [${mdFileName}] were checked.`
      );
      const fails = examplesChecked.filter((res) => !res.pass);
      const failedCount = fails.length;
      log(`failedCount: ${failedCount}`);
      if (failedCount > 0) {
        for (f of fails) {
          print(f);
        }
        return 1;
      }
      return 0;
    })
    .finally(() => {
      if (!options.keepExtracted && !customDirMode) {
        deleteExtractedExamples(mdFileName, options.languageExtension);
      }
      log("-- check END ----------------");
    });
};

// ---------------------------------------------------------

const getExtractedFileNames = async (
  extractedDirName,
  mdFileName,
  languageExtension
) => {
  log(
    `get [${languageExtension}] example file names in the [${extractedDirName}] directory...`
  );
  const mdFileNameWithoutExt = Path.parse(mdFileName).name;
  const extractedFileNames = (await fs.readdir(extractedDirName))
    .filter(
      (name) =>
        name.startsWith("_" + mdFileNameWithoutExt) &&
        name.endsWith("." + getFileExtensionFromLanguage(languageExtension))
    )
    .map((f) => Path.join(extractedDirName, f));
  log(`example file(s) found: `, extractedFileNames);
  return extractedFileNames;
};

const getFileExtensionFromLanguage = (languageExtension) => languageExtension;

const getExtractedDirName = (mdFileName, customDir = null) => {
  if (customDir !== null) {
    return Path.join(customDir);
  }
  const p = Path.parse(mdFileName);
  return Path.join(p.dir, `${p.name}_${APP_NAME_SHORT}`);
};

const getHeaderFileName = (mdFileName, languageExtension) => {
  const p = Path.parse(mdFileName);
  return Path.join(
    getExtractedDirName(mdFileName),
    `header.${getFileExtensionFromLanguage(languageExtension)}`
  );
};

const getExtractedFileName = (
  fileName,
  index,
  startIndex,
  extensionWithoutLeadingDot
) =>
  `_${Path.parse(fileName).name}_${(index + 1 + "").padStart(4, "0")}_${startIndex === -1 ? "" : startIndex}.${extensionWithoutLeadingDot}`;

const createDirIfNotExists = async (dirName) => {
  log(`createDirIfNotExists:  [${dirName}] ...`);
  try {
    await fs.mkdir(dirName);
  } catch (err) {
    if (err.code !== "EEXIST") throw err;
  }
  log(`created a directory [${dirName}]`);
};

const deleteExtractedExamples = async (mdFileName, languageExtension) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  log(
    `delete extracted [${languageExtension}] examples from the [${extractedDirName}] directory ...`
  );
  const filesToDelete = await getExtractedFileNames(
    extractedDirName,
    mdFileName,
    getFileExtensionFromLanguage(languageExtension)
  );
  log(`  [${filesToDelete.length}] file(s) to delete`);

  return Promise.all(filesToDelete.map((fileName) => fs.rm(fileName))).finally(
    () => {
      log(`  ... deleted`);
    }
  );
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
  let lines = [];
  try {
    lines = await loadInputFileLines(fileName);
  } catch (err) {
    log(`loadSafe not successful: [${err.message}]`);
  }
  return lines;
};

module.exports = {
  APP_NAME,
  extract,
  check,
};
