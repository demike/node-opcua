"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-debug
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
const path = require("path");
const _ = require("underscore");
const util_1 = require("util");
const debugFlags = {};
const maxLines = (process.env && process.env.NODEOPCUA_DEBUG_MAXLINE_PER_MESSAGE) ?
    parseInt(process.env.NODEOPCUA_DEBUG_MAXLINE_PER_MESSAGE, 10) : 25;
function extractBasename(name) {
    return path.basename(name).replace(/\.(js|ts)$/, "");
}
function w(str, l) {
    return (str + "                                                                ").substr(0, l);
}
function setDebugFlag(scriptFullPath, flag) {
    const filename = extractBasename(scriptFullPath);
    if (process.env.DEBUG) {
        const decoratedFilename = chalk_1.default.yellow(w(filename, 60));
        console.log(" Setting debug for ", decoratedFilename, " to ", (flag ? chalk_1.default.cyan : chalk_1.default.red)(flag.toString()));
    }
    debugFlags[filename] = flag;
}
exports.setDebugFlag = setDebugFlag;
function checkDebugFlag(scriptFullPath) {
    const filename = extractBasename(scriptFullPath);
    let doDebug = debugFlags[filename];
    if (process && process.env && process.env.DEBUG && !debugFlags.hasOwnProperty(filename)) {
        doDebug = (process.env.DEBUG.indexOf(filename) >= 0 || process.env.DEBUG.indexOf("ALL") >= 0);
        setDebugFlag(filename, doDebug);
    }
    return doDebug;
}
exports.checkDebugFlag = checkDebugFlag;
/**
 * file_line return a 51 caracter string
 * @param filename
 * @param callerLine
 */
function file_line(mode, filename, callerLine) {
    const d = (new Date()).toISOString().substr(11);
    if (mode === "D") {
        return chalk_1.default.bgWhite.cyan(w(d, 14) + ":" + w(filename, 30) + ":" + w(callerLine.toString(), 5));
    }
    else {
        return chalk_1.default.bgRed.white(w(d, 14) + ":" + w(filename, 30) + ":" + w(callerLine.toString(), 5));
    }
}
const continuation = w(" ...                                                            ", 51);
function buildPrefix(mode) {
    const stack = new Error("").stack || "";
    // caller line number
    const l = stack.split("\n")[4].split(":");
    const callerLine = parseInt(l[l.length - 2], 10);
    const filename = extractBasename(l[l.length - 3]);
    return file_line(mode, filename, callerLine);
}
function dump(mode, args1) {
    const a2 = _.values(args1);
    const output = util_1.format.apply(null, a2);
    let a1 = [buildPrefix(mode)];
    let i = 0;
    for (const line of output.split("\n")) {
        const lineArguments = [].concat(a1, [line]);
        console.log.apply(console, lineArguments);
        a1 = [continuation];
        i = i + 1;
        if (i > maxLines) {
            const a3 = a1.concat([" .... TRUNCATED ....."]);
            console.log.apply(console, a3);
            break;
        }
    }
}
/**
 * @method make_debugLog
 * @param scriptFullPath:string
 * @return returns a  debugLog function that will write message to the console
 * if the DEBUG environment variable indicates that the provided source file shall display debug trace
 *
 */
function make_debugLog(scriptFullPath) {
    const filename = extractBasename(scriptFullPath);
    function debugLogFunc(...args) {
        if (debugFlags[filename]) {
            dump("D", args);
        }
    }
    return debugLogFunc;
}
exports.make_debugLog = make_debugLog;
function make_errorLog(context) {
    function errorLogFunc(...args) {
        dump("E", args);
    }
    return errorLogFunc;
}
exports.make_errorLog = make_errorLog;
//# sourceMappingURL=make_loggers.js.map