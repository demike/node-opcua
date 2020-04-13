"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-basic-types
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const utils_1 = require("./utils");
function isValidUInt16(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return value >= 0 && value <= 0xffff;
}
exports.isValidUInt16 = isValidUInt16;
// ---------------------------------------
function randomUInt16() {
    return utils_1.getRandomInt(0, 0xffff);
}
exports.randomUInt16 = randomUInt16;
function encodeUInt16(value, stream) {
    stream.writeUInt16(value);
}
exports.encodeUInt16 = encodeUInt16;
function decodeUInt16(stream) {
    return stream.readUInt16();
}
exports.decodeUInt16 = decodeUInt16;
function isValidInt16(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return value >= -0x8000 && value <= 0x7fff;
}
exports.isValidInt16 = isValidInt16;
function randomInt16() {
    return utils_1.getRandomInt(-0x8000, 0x7fff);
}
exports.randomInt16 = randomInt16;
function encodeInt16(value, stream) {
    node_opcua_assert_1.assert(_.isFinite(value));
    stream.writeInt16(value);
}
exports.encodeInt16 = encodeInt16;
function decodeInt16(stream) {
    return stream.readInt16();
}
exports.decodeInt16 = decodeInt16;
function isValidInt32(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return value >= -0x80000000 && value <= 0x7fffffff;
}
exports.isValidInt32 = isValidInt32;
function randomInt32() {
    return utils_1.getRandomInt(-0x80000000, 0x7fffffff);
}
exports.randomInt32 = randomInt32;
function encodeInt32(value, stream) {
    node_opcua_assert_1.assert(_.isFinite(value));
    stream.writeInteger(value);
}
exports.encodeInt32 = encodeInt32;
function decodeInt32(stream) {
    return stream.readInteger();
}
exports.decodeInt32 = decodeInt32;
function isValidUInt32(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return value >= 0 && value <= 0xffffffff;
}
exports.isValidUInt32 = isValidUInt32;
function randomUInt32() {
    return utils_1.getRandomInt(0, 0xffffffff);
}
exports.randomUInt32 = randomUInt32;
function encodeUInt32(value, stream) {
    stream.writeUInt32(value);
}
exports.encodeUInt32 = encodeUInt32;
function decodeUInt32(stream) {
    return stream.readUInt32();
}
exports.decodeUInt32 = decodeUInt32;
function isValidInt8(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return value >= -0x80 && value <= 0x7f;
}
exports.isValidInt8 = isValidInt8;
function randomInt8() {
    return utils_1.getRandomInt(-0x7f, 0x7e);
}
exports.randomInt8 = randomInt8;
function encodeInt8(value, stream) {
    node_opcua_assert_1.assert(isValidInt8(value));
    stream.writeInt8(value);
}
exports.encodeInt8 = encodeInt8;
function decodeInt8(stream) {
    return stream.readInt8();
}
exports.decodeInt8 = decodeInt8;
exports.isValidSByte = isValidInt8;
exports.randomSByte = randomInt8;
exports.encodeSByte = encodeInt8;
exports.decodeSByte = decodeInt8;
function isValidUInt8(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return value >= 0x00 && value <= 0xff;
}
exports.isValidUInt8 = isValidUInt8;
function randomUInt8() {
    return utils_1.getRandomInt(0x00, 0xff);
}
exports.randomUInt8 = randomUInt8;
function encodeUInt8(value, stream) {
    stream.writeUInt8(value);
}
exports.encodeUInt8 = encodeUInt8;
function decodeUInt8(stream) {
    return stream.readUInt8();
}
exports.decodeUInt8 = decodeUInt8;
exports.isValidByte = isValidUInt8;
exports.randomByte = randomUInt8;
exports.encodeByte = encodeUInt8;
exports.decodeByte = decodeUInt8;
function isValidUInt64(value) {
    return value instanceof Array && value.length === 2;
}
exports.isValidUInt64 = isValidUInt64;
function randomUInt64() {
    return [utils_1.getRandomInt(0, 0xffffffff), utils_1.getRandomInt(0, 0xffffffff)];
}
exports.randomUInt64 = randomUInt64;
function encodeUInt64(value, stream) {
    if (_.isNumber(value)) {
        const arr = coerceUInt64(value);
        stream.writeUInt32(arr[1]);
        stream.writeUInt32(arr[0]);
    }
    else {
        stream.writeUInt32(value[1]);
        stream.writeUInt32(value[0]);
    }
}
exports.encodeUInt64 = encodeUInt64;
function decodeUInt64(stream) {
    const low = stream.readUInt32();
    const high = stream.readUInt32();
    return constructInt64(high, low);
}
exports.decodeUInt64 = decodeUInt64;
function constructInt64(high, low) {
    node_opcua_assert_1.assert(low >= 0 && low <= 0xffffffff);
    node_opcua_assert_1.assert(high >= 0 && high <= 0xffffffff);
    return [high, low];
}
exports.constructInt64 = constructInt64;
function coerceUInt64(value) {
    let high;
    let low;
    let v;
    if (value === null || value === undefined) {
        return value;
    }
    if (value instanceof Array) {
        node_opcua_assert_1.assert(_.isNumber(value[0]));
        node_opcua_assert_1.assert(_.isNumber(value[1]));
        return value;
    }
    if (typeof (value) === "string") {
        v = value.split(",");
        high = parseInt(v[0], 10);
        low = parseInt(v[1], 10);
        return constructInt64(high, low);
    }
    if (value > 0xffffffff) {
        // beware : as per javascript, value is a double here !
        //          our conversion will suffer from some inacuracy
        high = Math.floor(value / 0x100000000);
        low = value - high * 0x100000000;
        return constructInt64(high, low);
    }
    return constructInt64(0, value);
}
exports.coerceUInt64 = coerceUInt64;
function randomInt64() {
    // High, low
    return [utils_1.getRandomInt(0, 0xffffffff), utils_1.getRandomInt(0, 0xffffffff)];
}
exports.randomInt64 = randomInt64;
exports.coerceInt64 = coerceUInt64;
exports.isValidInt64 = isValidUInt64;
exports.encodeInt64 = encodeUInt64;
exports.decodeInt64 = decodeUInt64;
function coerceInt8(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseInt(value, 10);
}
exports.coerceInt8 = coerceInt8;
function coerceUInt8(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseInt(value, 10);
}
exports.coerceUInt8 = coerceUInt8;
function coerceByte(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseInt(value, 10);
}
exports.coerceByte = coerceByte;
function coerceSByte(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseInt(value, 10);
}
exports.coerceSByte = coerceSByte;
function coerceUInt16(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseInt(value, 10);
}
exports.coerceUInt16 = coerceUInt16;
function coerceInt16(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseInt(value, 10);
}
exports.coerceInt16 = coerceInt16;
function coerceUInt32(value) {
    if (value === null || value === undefined) {
        return value;
    }
    if (value.hasOwnProperty("value")) {
        node_opcua_assert_1.assert(value.constructor.name === "EnumItem");
        return parseInt(value.value, 10);
    }
    return parseInt(value, 10);
}
exports.coerceUInt32 = coerceUInt32;
function coerceInt32(value) {
    if (value === null || value === undefined) {
        return value;
    }
    if (value.length === 2 && (typeof value[0] === "number") && (typeof value[1] === "number")) {
        // Int64 as a [high,low]
        return value[1] + value[0] * 0xFFFFFFFF;
    }
    return parseInt(value, 10);
}
exports.coerceInt32 = coerceInt32;
//# sourceMappingURL=integers.js.map