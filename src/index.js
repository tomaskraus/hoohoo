/**
 * hoohoo CLI.
 */

// const Path = require("path");
const { Command, createOption } = require("commander");

const { APP_NAME, extract, check, test } = require("./main");

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

const keepTempFilesOption = createOption(
  "-k, --keepExtracted",
  "does not delete the directory with extracted examples after command run"
);

const codeBlocLanguageExtensionOption = createOption(
  "-l, --languageExtension <languageExtension>",
  "sets a language extension to recognize in a markdown code block"
).default("js");

const getBusinessLogicOptions = (options) => ({
  languageExtension: options.languageExtension,
  keepExtracted: options.keepExtracted,
  jsDir: options.jsDir,
});

// ----------------------

program.addHelpText(
  "before",
  "Extracts, checks and tests code blocks of the Markdown file, based on the language syntax selected."
);

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
    "runs js examples in the markdown file and checks them for errors"
  )
  .addOption(codeBlocLanguageExtensionOption)
  .addOption(jsDirOption)
  .addOption(keepTempFilesOption)
  .addHelpText(
    "after",
    `example: 
    ${APP_NAME} c
    ${APP_NAME} check views/detail.md
    ${APP_NAME} check --jsDir views/detail_hh
    `
  )
  .action(async (mdFile, options) => {
    process.exitCode = await safeRunner(() =>
      check(mdFile, getBusinessLogicOptions(options))
    );
  });

// ----------------------

program
  .command("test")
  .alias("t")
  .argument("[<mdFile>]", "a markdown file with code examples", "README.md")
  .description("test assertions in examples of the markdown file")
  .addOption(codeBlocLanguageExtensionOption)
  .addOption(jsDirOption)
  .addOption(keepTempFilesOption)
  .addHelpText(
    "after",
    `example: 
  ${APP_NAME} t
  ${APP_NAME} test views/detail.md
  ${APP_NAME} test --jsDir views/detail_hh
  `
  )
  .action(async (mdFile, options) => {
    process.exitCode = await safeRunner(() =>
      test(mdFile, getBusinessLogicOptions(options))
    );
  });
// ----------------------

program.parse();
