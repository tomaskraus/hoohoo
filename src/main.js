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
  doExtractStep: true,
};

const extract = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  logAndPrint(
    `extracting [${options.languageExtension}] examples of [${mdFileName}] file to the [${extractedDirName}] directory ...`
  );

  await resetDir(extractedDirName);

  const headerFileName = getHeaderFileName(
    mdFileName,
    options.languageExtension
  );

  log(
    `looking for a [${headerFileName}] [${options.languageExtension}] header file`
  );
  const headerLines = await loadSafeInputFileLines(headerFileName);

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
    logAndPrint(
      `extracted [${codeBlocks.length}] [${options.languageExtension}] examples from the [${mdFileName}] file to the [${extractedDirName}] directory.`
    );
    return 0;
  });
};

const check = async (mdFileName, options = DEFAULT_OPTIONS) => {
  const extractedDirName = getExtractedDirName(mdFileName);
  logAndPrint(`temporary example extraction dir: [${extractedDirName}]`);
  logAndPrint(
    `checking [${options.languageExtension}] examples of [${mdFileName}]`
  );

  if (options.doExtractStep) {
    await extract(mdFileName, options);
  } else {
    log("- Skipping the extraction step.");
  }

  const exampleFiles = (await fs.readdir(extractedDirName))
    .filter((name) =>
      name.endsWith(
        "." + getFileExtensionFromLanguage(options.languageExtension)
      )
    )
    .map((f) => Path.join(extractedDirName, f));

  return Promise.all(
    exampleFiles.reduce((acc, name) => {
      // print(`check ${name}`);
      return [...acc, engine.checkOneFile(mdFileName, name)];
    }, [])
  ).then((examplesChecked) => {
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
  });
};

// -------------------------------------------

const getFileExtensionFromLanguage = (languageExtension) => languageExtension;

const getExtractedDirName = (fileName) => {
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
  APP_NAME,
  extract,
  check,
};
