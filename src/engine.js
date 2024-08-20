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
  const MD_BLOCK = "```";
  const S_NO_BLOCK = 0;
  const S_START_BLOCK = 1;
  const S_BLOCK = 2;

  const res = lines.reduce(
    ([blocks, state, blockAcc, startIndex], line, index) => {
      if (state === S_NO_BLOCK) {
        if (line.trim() === MD_BLOCK + languageExtension) {
          // start of a block
          return [blocks, S_START_BLOCK, [], index + 1];
        } else {
          // no-block continues
          return [blocks, state, [], 0];
        }
      } else if (state === S_START_BLOCK) {
        if (line.trim() === MD_BLOCK) {
          // empty code block detected
          return [blocks, S_NO_BLOCK, [], 0];
        }
        // push the first line of the code block to the accumulator
        return [blocks, S_BLOCK, [line], startIndex];
      } else if (state === S_BLOCK) {
        if (line.trim() === MD_BLOCK) {
          // flush the accumulator, add its content to blocks
          return [[...blocks, { startIndex, data: blockAcc }], S_NO_BLOCK, []];
        }
        // add line to the accumulator
        return [blocks, S_BLOCK, [...blockAcc, line], startIndex];
      } else {
        throw new Error(`unknown state: [${state}]`);
      }
    },
    [[], S_NO_BLOCK, [], 0]
  );
  const codeBlocks = res[0];
  log(`code blocks: `, codeBlocks);
  return codeBlocks;
};

const checkOneFile = async (mdFileName, fileName) => {
  log(`checkOneFile: checking file [${fileName}]:`);
  const startIndex = getStartIndexFromFileName(fileName);
  const fileNamePart = `${mdFileName}:${startIndex + 1}`;

  const context = {
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
  checkOneFile,
};
