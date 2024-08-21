/**
 * API
 */

const vm = require("node:vm");
const fs = require("fs/promises");
const Path = require("path");
const { appLog } = require("./logger.js");
const log = appLog.extend("engine");

// -------------------------------------------------------

const getCodeBlockList = (lines, languageExtension) => {
  const MARKDOWN_BLOCK = "```";
  const S_NO_BLOCK = 0;
  const S_START_BLOCK = 1;
  const S_BLOCK = 2;

  const COMMENT_REGEX = /^\s*<!--\s+([a-z-]+)\s+-->\s*$/;
  const SKIP_MARK_1 = "skip";
  // markdown-doctest skip comment mark
  // see https://github.com/Widdershin/markdown-doctest
  const SKIP_MARK_2 = "skip-example"; //

  const res = lines.reduce(
    ([blocks, state, blockAcc, startIndex, isSkip], line, index) => {
      if (state === S_NO_BLOCK) {
        const commentContentCandidate = line.match(COMMENT_REGEX);
        const commentContent = commentContentCandidate
          ? commentContentCandidate[1]
          : null;
        if (line.trim() === MARKDOWN_BLOCK + languageExtension) {
          // start of a block
          return [blocks, S_START_BLOCK, [], index + 1, isSkip];
        } else if (
          commentContent === SKIP_MARK_1 ||
          commentContent === SKIP_MARK_2
        ) {
          // skip mark detected
          return [blocks, state, [], 0, true];
        } else if (line.trim() === MARKDOWN_BLOCK) {
          // cancel the skip mark
          // as skip-mark is only valid for the very next code-block, no matter of its language extension
          return [blocks, state, [], 0, false];
        } else {
          // no-block continues
          return [blocks, state, [], 0, isSkip];
        }
      } else if (state === S_START_BLOCK) {
        if (line.trim() === MARKDOWN_BLOCK) {
          // empty code block detected
          return [blocks, S_NO_BLOCK, [], 0, isSkip];
        }
        // push the first line of the code block to the accumulator
        return [blocks, S_BLOCK, [line], startIndex, isSkip];
      } else if (state === S_BLOCK) {
        if (line.trim() === MARKDOWN_BLOCK) {
          if (isSkip) {
            //skip the accumlator and continue
            log(
              `- this code block starting at index [${startIndex}] will be skipped:\n`,
              blockAcc
            );
            return [blocks, S_NO_BLOCK, [], 0, false];
          }
          // flush the accumulator, add its content to blocks, reset skip-mark
          return [
            [...blocks, { startIndex, data: blockAcc }],
            S_NO_BLOCK,
            [],
            0,
            false,
          ];
        }
        // add line to the accumulator
        return [blocks, S_BLOCK, [...blockAcc, line], startIndex, isSkip];
      } else {
        throw new Error(`unknown state: [${state}]`);
      }
    },
    [[], S_NO_BLOCK, [], 0]
  );
  const codeBlocks = res[0];
  log(`code blocks count: [${codeBlocks.length}]`);
  return codeBlocks;
};

const addHeaderContent = (headerLines) => (codeBlock) => ({
  startIndex: codeBlock.startIndex - headerLines.length,
  data: [...headerLines, ...codeBlock.data],
});

const checkOneFile = async (mdFileName, fileName) => {
  log(`checkOneFile: checking file [${fileName}]:`);
  const startIndex = getStartIndexFromFileName(fileName);
  const fileNamePart = `${mdFileName}:${startIndex + 1}`;

  const context = {
    /*
      change the "require" behavior in files when they are run!!!
      when required, local files are always searched relative to CWD (current working dir), instead of the directory running file is in
     */
    require: (fileName) =>
      require(
        fileName.endsWith(".js") ? Path.join(process.cwd(), fileName) : fileName
      ),
    console,
  };
  vm.createContext(context);
  const codeToRun = await fs.readFile(fileName, { encoding: "utf-8" });
  try {
    vm.runInContext(codeToRun, context, {
      filename: mdFileName,
      lineOffset: startIndex,
    });
    return { file: fileNamePart, pass: true };
  } catch (err) {
    return {
      file: err.stack.split("\n")[0],
      pass: false,
      errorMessage: err.message,
    };
  }
};

// ----------------------------

/**
 *
 * @param {string} fileName
 * @returns {number} startIndex part of fileName, or -1 if startIndex part is not found
 */
const getStartIndexFromFileName = (fileName) => {
  const indexRegex = /_(\d+)\.[^.]+/;
  const res = fileName.match(indexRegex);
  return res ? parseInt(res[1]) : -1;
};

// ----------------------------

module.exports = {
  getStartIndexFromFileName,
  getCodeBlockList,
  addHeaderContent,
  checkOneFile,
};
