"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-debug
 */
// tslint:disable:no-console
// tslint:disable:ban-types
const fs = require("fs");
const _ = require("underscore");
const util = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const get_temp_filename_1 = require("./get_temp_filename");
/**
 * @method redirectToFile
 * @param tmpFile {String} log file name to redirect console output.
 * @param actionFct  the inner function to execute
 * @param callback
 */
function redirectToFile(tmpFile, actionFct, callback) {
    let oldConsoleLog;
    node_opcua_assert_1.assert(_.isFunction(actionFct));
    node_opcua_assert_1.assert(!callback || _.isFunction(callback));
    const isAsync = actionFct && actionFct.length;
    const logFile = get_temp_filename_1.getTempFilename(tmpFile);
    // xx    console.log(" log_file ",log_file);
    const f = fs.createWriteStream(logFile, { flags: "w", encoding: "ascii" });
    function _write_to_file(...args) {
        const msg = util.format.apply(null, args);
        f.write(msg + "\n");
        if (process.env.DEBUG) {
            oldConsoleLog.call(console, msg);
        }
    }
    if (!isAsync) {
        oldConsoleLog = console.log;
        console.log = _write_to_file;
        // async version
        try {
            actionFct();
        }
        catch (err) {
            console.log = oldConsoleLog;
            console.log(" log file = ", logFile);
            console.log("redirectToFile  has intercepted an error :", err);
            // we don't want the callback anymore since we got an error
            // display file on screen  for investigation
            console.log(fs.readFileSync(logFile).toString("ascii"));
            f.end(() => {
                if (callback) {
                    callback(err);
                }
            });
        }
        console.log = oldConsoleLog;
        f.end(callback);
    }
    else {
        oldConsoleLog = console.log;
        console.log = _write_to_file;
        // async version
        actionFct((err) => {
            node_opcua_assert_1.assert(_.isFunction(callback));
            console.log = oldConsoleLog;
            if (err) {
                console.log("redirectToFile  has intercepted an error");
                throw err;
            }
            f.end(callback);
        });
    }
}
exports.redirectToFile = redirectToFile;
//# sourceMappingURL=redirect_to_file.js.map