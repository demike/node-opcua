"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-basic-types
 */
const _ = require("underscore");
const node_opcua_buffer_utils_1 = require("node-opcua-buffer-utils");
const utils_1 = require("./utils");
function isValidByteString(value) {
    return value === null || value instanceof Buffer;
}
exports.isValidByteString = isValidByteString;
function randomByteString(value, len) {
    len = len || utils_1.getRandomInt(1, 200);
    const b = node_opcua_buffer_utils_1.createFastUninitializedBuffer(len);
    for (let i = 0; i < len; i++) {
        b.writeUInt8(utils_1.getRandomInt(0, 255), i);
    }
    return b;
}
exports.randomByteString = randomByteString;
function encodeByteString(byteString, stream) {
    stream.writeByteStream(byteString);
}
exports.encodeByteString = encodeByteString;
function decodeByteString(stream) {
    return stream.readByteStream();
}
exports.decodeByteString = decodeByteString;
function coerceByteString(value) {
    if (_.isArray(value)) {
        return Buffer.from(value);
    }
    if (typeof value === "string") {
        return Buffer.from(value, "base64");
    }
    return value;
}
exports.coerceByteString = coerceByteString;
//# sourceMappingURL=byte_string.js.map