/**
 * API
 */

const { appLog } = require("./logger.js");
const log = appLog.extend("engine");

const DEFAULT_OPTIONS = {
  languageExtension: "js",
};

// -------------------------------------------------------

const getCodeBlockList = (lines, languageExtension) => {
  const MD_BLOCK = "```";
  const S_NO_BLOCK = 0;
  const S_START_BLOCK = 1;
  const S_BLOCK = 2;

  const res = lines.reduce(
    ([blocks, state, blockAcc], line, index) => {
      if (state === S_NO_BLOCK) {
        if (line.trim() === MD_BLOCK + languageExtension) {
          // start of a block
          return [blocks, S_START_BLOCK, []];
        } else {
          // no-block continues
          return [blocks, state, []];
        }
      } else if (state === S_START_BLOCK) {
        if (line.trim() === MD_BLOCK) {
          // empty code block detected
          return [blocks, S_NO_BLOCK, []];
        }
        // push the first line of the code block to the accumulator
        return [blocks, S_BLOCK, [line]];
      } else if (state === S_BLOCK) {
        if (line.trim() === MD_BLOCK) {
          // flush the accumulator, add its content to blocks
          return [[...blocks, blockAcc], S_NO_BLOCK, []];
        }
        return [blocks, S_BLOCK, [...blockAcc, line]];
      } else {
        throw new Error(`unknown state: [${state}]`);
      }
    },
    [[], S_NO_BLOCK, []]
  );
  const codeBlocks = res[0];
  log(`code blocks: `, codeBlocks);
  return codeBlocks;
};

module.exports = {
  getCodeBlockList,
};
