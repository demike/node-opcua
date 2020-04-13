"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-assert
 */
const chalk_1 = require("chalk");
const displayAssert = process.env.DISPLAY_ASSERT ? true : false;
function assert(cond, message) {
    if (!cond) {
        const err = new Error(message);
        // istanbul ignore next
        if (displayAssert) {
            // tslint:disable:no-console
            console.log(chalk_1.default.whiteBright.bgRed("-----------------------------------------------------------"));
            console.log(chalk_1.default.whiteBright.bgRed(message));
            console.log(err);
            console.log(chalk_1.default.whiteBright.bgRed("-----------------------------------------------------------"));
        }
        throw err;
    }
}
exports.assert = assert;
exports.default = assert;
//# sourceMappingURL=index.js.map