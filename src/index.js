/**
 * md-js-test CLI.
 */

// const Path = require("path");
const { Command, createOption } = require("commander");

const { extract } = require("./main");

// ------------------------------------------

const safeRunner = async (asyncFn) => {
  const DEFAULT_RET_CODE = 1;
  try {
    const result = await asyncFn();
    return result;
  } catch (err) {
    const err2 = new Error(err.message, { cause: err });
    console.log(err2);
    return err2.cause.errno || DEFAULT_RET_CODE;
  }
};

// ---------------------------------------------------------------

const program = new Command();
program.name("md-js-test").showHelpAfterError();

const jsDirOption = createOption(
  "-j, --jsDir <dirName>",
  "directory of source's generated javascript file"
).default("dist");

const customAssertionMarkOption = createOption(
  "-m, --mark <assertionMark>",
  "sets a custom assertion mark"
).default("//=>");

const keepTempFileOption = createOption(
  "-k, --keepTempFile",
  "does not delete temporary files after use"
);

// const getBusinessLogicOptions = (options) => ({
//   assertionMark: options.mark,
//   keepTempFile: options.keepTempFile,
// });

program
  .command("extract")
  .alias("e")
  .argument("[<mdFile>]", "a markdown file with code examples", "README.md")
  .description("extracts js examples from the markdown file")
  .addHelpText(
    "after",
    `example: 
    md-js-test e
    md-js-test extract views/detail.md

    `
  )
  .action(async (mdFile, options) => {
    // const businessLogic = businessLogicProvider(
    //   getBusinessLogicOptions(options)
    // );
    process.exitCode = await safeRunner(async () => await extract(mdFile));
  });

program.parse();
