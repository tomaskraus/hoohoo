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

const extract = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  logAndPrint(
    `extracting [${options.languageExtension}] examples of [${mdFileName}] file to the [${extractedDirName}] directory ...`
  );
  //
  await deleteWholeDir(extractedDirName);
  await fs.mkdir(extractedDirName);
  log(`created a directory [${extractedDirName}]`);
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
  let codeBlocks = engine.getCodeBlockList(lines, options.languageExtension);
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

const check = async (mdFileName, options = DEFAULT_OPTIONS) => {
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
  logAndPrint(`temporary example extraction dir: [${extractedDirName}]`);
  logAndPrint(
    `checking [${options.languageExtension}] examples of [${mdFileName}]`
  );
  //
  if (!customDirMode) {
    await extract(mdFileName, options);
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
  const mdFileNameWithoutExt = Path.parse(mdFileName).name;
  log(`mdFileNameWithoutExt: [${mdFileNameWithoutExt}]`);
  const exampleFiles = (await fs.readdir(extractedDirName))
    .filter(
      (name) =>
        name.startsWith(mdFileNameWithoutExt) &&
        name.endsWith("." + getFileExtensionFromLanguage(langExt))
    )
    .map((f) => Path.join(extractedDirName, f));
  log(`example file(s) found: `, exampleFiles);
  return Promise.all(
    exampleFiles.reduce((acc, fileName) => {
      // print(`check ${name}`);
      return [
        ...acc,
        engine.checkOneFile(mdFileName, fileName, mdExampleLineOffset),
      ];
    }, [])
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
        deleteWholeDir(extractedDirName);
      }
      log("-- check END ----------------");
    });
};

// -------------------------------------------

const getFileExtensionFromLanguage = (languageExtension) => languageExtension;

const getExtractedDirName = (fileName, customDir = null) => {
  if (customDir !== null) {
    return Path.join(customDir);
  }
  const p = Path.parse(fileName);
  return Path.join(p.dir, `${APP_NAME_SHORT}-extracted.${p.name}`);
};

const getHeaderFileName = (fileName, languageExtension) => {
  const p = Path.parse(fileName);
  return Path.join(
    p.dir,
    `${APP_NAME_SHORT}-header.${p.name}.${getFileExtensionFromLanguage(languageExtension)}`
  );
};

const getExtractedFileName = (
  fileName,
  index,
  startIndex,
  extensionWithoutLeadingDot
) =>
  `${Path.parse(fileName).name}-${(index + 1 + "").padStart(4, "0")}_${startIndex === -1 ? "" : startIndex}.${extensionWithoutLeadingDot}`;

const deleteWholeDir = async (dirName) => {
  log(`deleteWholeDir:  [${dirName}] ...`);
  await fs.rm(dirName, { recursive: true, force: true });
  log(`  ...deleted`);
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
