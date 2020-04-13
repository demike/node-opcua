"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
const STRIP_COMMENTS = /((\/\/.*$)|(\/\*[\s\S]*?\*\/))/gm;
const ARGUMENT_NAMES = /([^\s,]+)/g;
// tslint:disable-next-line:ban-types
function getFunctionParameterNames(func) {
    const fnStr = func.toString().replace(STRIP_COMMENTS, "");
    let result = fnStr.slice(fnStr.indexOf("(") + 1, fnStr.indexOf(")")).match(ARGUMENT_NAMES);
    if (result === null) {
        result = [];
    }
    return result;
}
exports.getFunctionParameterNames = getFunctionParameterNames;
//# sourceMappingURL=get_function_parameters_name.js.map