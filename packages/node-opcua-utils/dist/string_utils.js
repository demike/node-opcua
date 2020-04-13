"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
// tslint:disable:variable-name
function capitalizeFirstLetter(str) {
    if (str == null) {
        return str;
    }
    return str.substr(0, 1).toUpperCase() + str.substr(1);
}
exports.capitalizeFirstLetter = capitalizeFirstLetter;
const ACode = "A".charCodeAt(0);
const ZCode = "Z".charCodeAt(0);
function isUpperCaseChar(c) {
    const code = c.charCodeAt(0);
    return code >= ACode && code <= ZCode;
}
// HelloWorld => helloWorld
// XAxis      => xAxis
// EURange    => euRange
function lowerFirstLetter(str) {
    if (str == null) {
        return str;
    }
    let result = str.substr(0, 1).toLowerCase() + str.substr(1);
    if (result.length > 3 && isUpperCaseChar(str[1]) && isUpperCaseChar(str[2])) {
        result = str.substr(0, 2).toLowerCase() + str.substr(2);
    }
    return result;
}
exports.lowerFirstLetter = lowerFirstLetter;
//# sourceMappingURL=string_utils.js.map