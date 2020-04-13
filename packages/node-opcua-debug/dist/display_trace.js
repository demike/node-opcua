"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-debug
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
function trace_from_this_projet_only(err) {
    const str = [];
    str.push(chalk_1.default.cyan.bold(" display_trace_from_this_project_only = "));
    if (err) {
        str.push(err.message);
    }
    err = err || new Error("Error used to extract stack trace");
    let stack = err.stack;
    if (stack) {
        stack = stack.split("\n").filter((el) => el.match(/node-opcua/) && !el.match(/node_modules/));
        str.push(chalk_1.default.yellow(stack.join("\n")));
    }
    else {
        str.push(chalk_1.default.red(" NO STACK TO TRACE !!!!"));
    }
    return str.join("\n");
}
exports.trace_from_this_projet_only = trace_from_this_projet_only;
function display_trace_from_this_projet_only(err) {
    console.log(trace_from_this_projet_only(err));
}
exports.display_trace_from_this_projet_only = display_trace_from_this_projet_only;
//# sourceMappingURL=display_trace.js.map