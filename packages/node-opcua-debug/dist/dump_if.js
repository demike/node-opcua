"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-debug
 */
// tslint:disable:no-console
const util = require("util");
function dump(obj) {
    console.log("\n", util.inspect(JSON.parse(JSON.stringify(obj)), { colors: true, depth: 10 }));
}
exports.dump = dump;
function dumpIf(condition, obj) {
    if (condition) {
        dump(obj);
    }
}
exports.dumpIf = dumpIf;
//# sourceMappingURL=dump_if.js.map