/**
 * A facade that provides business and presentation logic to the CLI.
 * Uses the engine and reports to the console stdout, stderr.
 */

const APP_NAME = "hoohoo";
const APP_NAME_SHORT = "hh";

const fs = require("fs/promises");
const Path = require("path");

const engine = require("./engine.js");
require("./code-service-types.js");
const { doCheck } = require("./code-test-service.js");

const { doTests } = require("clogtest/src/engine.js")();
const { print, printFails, printResume } = require("clogtest/src/report.js");

const { appLog } = require("./logger.js");
const log = appLog.extend("main");

// -------------------------------------------

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
 * @param {DoCheckOptions} options
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
          block.startIndex + 1,
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
 * @param {string} languageExtension
 * @returns {number}
 */
const getHeaderFileLineCount = async (mdFileName, languageExtension) => {
  const headerFileName = getHeaderFileName(mdFileName, languageExtension);
  log(
    `looking for a [${headerFileName}] [${languageExtension}] line count to compute a markdown example line offset`
  );
  const lineCount = (await loadSafeInputFileLines(headerFileName)).length;

  log(
    `header file [${headerFileName}] [${languageExtension}] line count: [${lineCount}]`
  );
  return lineCount;
};

/**
 *
 * @param {string} mdFileName
 * @param {string} srcFileName
 * @param {number} headerLineCount
 * @returns {(CodeCheckResult) => CodeCheckResult} computed line number
 */
const createResultFileLineCorrectionFn = (
  mdFileName,
  srcFileName,
  headerLineCount
) => {
  const lineOffset = engine.getStartIndexFromExtractedFileName(srcFileName);
  return ({ fileName, lineNumber, ...res }) => {
    return {
      fileName: mdFileName,
      lineNumber: Math.max(lineNumber - headerLineCount, 1) + lineOffset,
      ...res,
    };
  };
};

/**
 *
 * @param {string} mdFileName
 * @param {*} options
 * @returns {Promise<[string[], number]>} file names to be processed by the command, start line number
 */
const prepareExampleFilesForCommand = async (
  mdFileName,
  options = DEFAULT_OPTIONS
) => {
  const customDirMode = hasJsDir(options);
  if (customDirMode) {
    log(
      `+++ Custom dir mode is active. \n    prepareFilesForCommand will not extract examples nor provide line numbers on examples' runtime errors.`
    );
  }
  // extracted files
  const extractedDirName = getExtractedDirName(mdFileName, options.jsDir);
  const langExt = customDirMode
    ? getFileExtensionFromLanguage("js")
    : getFileExtensionFromLanguage(options.languageExtension);
  logAndPrint(
    `looking for [${options.languageExtension}] examples of [${mdFileName}]`
  );
  logAndPrint(`extracted examples dir: [${extractedDirName}]`);
  //
  if (!customDirMode) {
    await extract(mdFileName, options);
    log("- - - - - extracting step done");
  } else {
    log("- Skipping the extraction step.");
  }
  // calculate line numbers
  let exampleHeaderLineCount = 0;
  if (!customDirMode) {
    exampleHeaderLineCount = await getHeaderFileLineCount(
      mdFileName,
      options.languageExtension
    );
  }

  //
  const exampleFiles = await getExtractedFileNames(
    extractedDirName,
    mdFileName,
    getFileExtensionFromLanguage(langExt)
  );

  return [exampleFiles, exampleHeaderLineCount];
};

/**
 *
 * @param {*} results
 * @param {string} mdFileName
 * @param {*} options
 * @returns {Promise<number>}
 */
const processExampleResults = async (results, mdFileName, options) => {
  print(
    `[${results.length}] [${options.languageExtension}] example(s) of [${mdFileName}] were processed.`
  );
  const fails = results.filter((res) => !res.pass);
  const failedCount = fails.length;
  log(`failedCount: ${failedCount}`);
  if (failedCount > 0) {
    return loadInputFileLines(mdFileName).then((srcLines) => {
      printFails(fails, srcLines);
      printResume(getStats(results));
      return 1;
    });
  }
  printResume(getStats(results));
  return 0;
};

const tearDownExamples = async (mdFileName, options) => {
  log(`tearDown examples of [${mdFileName}] ...`);
  if (!options.keepExtracted && !hasJsDir(options)) {
    deleteExtractedExamples(mdFileName, options.languageExtension).then(() =>
      log(`... tearDown Examples complete`)
    );
  } else {
    log(`... tearDown: skip examples deletion`);
  }
};

/**
 *
 * @param {string} mdFileName
 * @param {DoCheckOptions} options
 * @returns
 */
const check = async (mdFileName, options = DEFAULT_OPTIONS) => {
  log(`check Markdown file name: [${mdFileName}]: `);

  const [exampleFiles, exampleHeaderLineCount] =
    await prepareExampleFilesForCommand(mdFileName, options);

  return Promise.all(
    exampleFiles.map((fileName) => {
      const resultFileLineCorrectionFn = createResultFileLineCorrectionFn(
        mdFileName,
        fileName,
        exampleHeaderLineCount
      );
      return doCheck(fileName).then(resultFileLineCorrectionFn);
    })
  )
    .then((resultsOfCheck) => {
      log("check: results:", resultsOfCheck);
      return processExampleResults(resultsOfCheck, mdFileName, options);
    })
    .finally(() => {
      tearDownExamples(mdFileName, options);
      log("-- check END ----------------");
    });
};

// ---------------------------------------------------------

const test = async (mdFileName, options = DEFAULT_OPTIONS) => {
  log(`test Markdown file name: [${mdFileName}]: `);

  const [exampleFiles, exampleHeaderLineCount] =
    await prepareExampleFilesForCommand(mdFileName, options);

  return Promise.all(
    exampleFiles.map((fileName) => {
      const resultFileLineCorrectionFn = createResultFileLineCorrectionFn(
        mdFileName,
        fileName,
        exampleHeaderLineCount
      );
      return doTests(fileName).then((results) =>
        results.map(resultFileLineCorrectionFn)
      );
    })
  )
    .then((testResultArrs) => {
      const results = testResultArrs
        // .map((res) => res[0])
        // .filter((r) => r !== undefined)
        .reduce((acc, rArr) => [...acc, ...rArr], []);
      log("test: results:", testResultArrs);
      return processExampleResults(results, mdFileName, options);
    })
    .finally(() => {
      tearDownExamples(mdFileName, options);
      log("-- test END ----------------");
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

/**
 *
 * @param {Object[]} results
 * @returns Stats object: {totalCount, passedCount, failedCount, SkippedCount}
 */
const getStats = (results) => {
  const notSkipped = results.filter((r) => !r.skip);
  return {
    totalCount: results.length,
    passedCount: notSkipped.filter((r) => r.pass).length,
    failedCount: notSkipped.filter((r) => !r.pass).length,
    skippedCount: results.length - notSkipped.length,
  };
};

module.exports = {
  APP_NAME,
  extract,
  check,
  test,
};
