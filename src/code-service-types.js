/**
 * Options for doCheck function
 *
 * @typedef {Object} DoCheckOptions
 * @property {string} filenameSubstitute - file name that is displayed in the results
 * @property {number} exampleStartLineInMd - start line of example in the markDown file
 * @property {number} exampleHeaderLineCount - line count of the header added to the beginning of example in the markDown file
 *
 * @see {DoCheckFn}
 */

/**
 * Check result object
 *
 * @typedef {Object} CodeCheckResult
 * @property {string} fileName - name of the checked file
 * @property {number} lineNumber - line number. Either the start line of the code being checked or the line where an Error occured
 * @property {boolean} pass - true if test has succeeded
 * @property {Error} error - Error object. Defined if an Error occured
 */

/**
 * checks if javascript code in the file can be run without error
 * That ensures the code is at least syntactically correct.
 *
 * @callback DoCheckFn
 * @param {string} fileName - name of the file to check
 * @param {DoCheckOptions} options - doCheck options
 * @returns {Promise<CodeCheckResult>} - result
 */

/**
 * provides an API to:
 * - check a file
 * - test a file content
 *
 * @typedef {Object} CodeTestService
 * @property {DoCheckFn} doCheck
 */
