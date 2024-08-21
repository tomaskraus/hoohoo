/**
 * hoohoo CLI.
 */

// const Path = require("path");
const { Command, createOption } = require("commander");

const { APP_NAME, extract, check } = require("./main");

// ------------------------------------------

const safeRunner = async (asyncFn) => {
  const DEFAULT_RET_CODE = 1;
  try {
    const code = await asyncFn();
    return code;
  } catch (err) {
    const err2 = new Error(err.message, { cause: err });
    console.log(err2);
    return err2.cause.errno || DEFAULT_RET_CODE;
  }
};

// ---------------------------------------------------------------

const program = new Command();
program.name(APP_NAME).showHelpAfterError();

const jsDirOption = createOption(
  "-j, --jsDir <dirName>",
  "directory of javascript files to be checked"
);

const customAssertionMarkOption = createOption(
  "-m, --mark <assertionMark>",
  "sets a custom assertion mark"
).default("//=>");

const keepTempFileOption = createOption(
  "-k, --keepTempFile",
  "does not delete temporary files after use"
);

const codeBlocLanguageExtensionOption = createOption(
  "-l, --languageExtension <languageExtension>",
  "sets a language extension to recognize in a markdown code block"
).default("js");

const getBusinessLogicOptions = (options) => ({
  languageExtension: options.languageExtension,
  jsDir: options.jsDir,
});

// ----------------------

program
  .command("extract")
  .alias("e")
  .argument("[<mdFile>]", "a markdown file with code examples", "README.md")
  .description("extracts js examples from the markdown file")
  .addOption(codeBlocLanguageExtensionOption)
  .addHelpText(
    "after",
    `example: 
    ${APP_NAME} e
    ${APP_NAME} extract views/detail.md

    `
  )
  .action(async (mdFile, options) => {
    process.exitCode = await safeRunner(() =>
      extract(mdFile, getBusinessLogicOptions(options))
    );
  });

// ----------------------

program
  .command("check")
  .alias("c")
  .argument("[<mdFile>]", "a markdown file with code examples", "README.md")
  .description(
    "Check js examples from the markdown file: tests examples for runnability, tests each example output against examples' assertions."
  )
  .addOption(codeBlocLanguageExtensionOption)
  .addOption(jsDirOption)
  .addHelpText(
    "after",
    `example: 
    ${APP_NAME} c
    ${APP_NAME} check views/detail.md
    ${APP_NAME} check --jsDir views/hh-extracted.detail
    `
  )
  .action(async (mdFile, options) => {
    process.exitCode = await safeRunner(() =>
      check(mdFile, getBusinessLogicOptions(options))
    );
  });

// ----------------------

program.parse();
