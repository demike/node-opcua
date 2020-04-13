"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-basic-types
 */
const node_opcua_assert_1 = require("node-opcua-assert");
function isValidBoolean(value) {
    return typeof value === "boolean";
}
exports.isValidBoolean = isValidBoolean;
function randomBoolean() {
    return Math.random() > 0.5;
}
exports.randomBoolean = randomBoolean;
function encodeBoolean(value, stream) {
    node_opcua_assert_1.assert(isValidBoolean(value));
    stream.writeUInt8(value ? 1 : 0);
}
exports.encodeBoolean = encodeBoolean;
function decodeBoolean(stream) {
    return !!stream.readUInt8();
}
exports.decodeBoolean = decodeBoolean;
const falseDetectionRegex = /^(?:f(?:alse)?|no?|0+)$/i;
function coerceBoolean(value) {
    if (value === null || value === undefined) {
        return value;
    }
    // http://stackoverflow.com/a/24744599/406458
    return !falseDetectionRegex.test(value) && !!value;
    // return !!(+value||String(value).toLowerCase().replace(!!0,''));
}
exports.coerceBoolean = coerceBoolean;
exports.encodeUABoolean = encodeBoolean;
exports.decodeUABoolean = decodeBoolean;
//# sourceMappingURL=boolean.js.map