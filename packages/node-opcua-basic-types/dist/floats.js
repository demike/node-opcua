"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-basic-types
 */
const _ = require("underscore");
const minFloat = -3.4 * Math.pow(10, 38);
const maxFloat = 3.4 * Math.pow(10, 38);
/**
 * return a random float value in the range of  min inclusive and  max exclusive
 * @method getRandomInt
 * @param min
 * @param max
 * @return {*}
 * @private
 */
function getRandomDouble(min, max) {
    return Math.random() * (max - min) + min;
}
function isValidFloat(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return value > minFloat && value < maxFloat;
}
exports.isValidFloat = isValidFloat;
const r = new Float32Array(1);
function roundToFloat(float) {
    r[0] = float;
    const floatR = r[0];
    return floatR;
}
function randomFloat() {
    return roundToFloat(getRandomDouble(-1000, 1000));
}
exports.randomFloat = randomFloat;
function encodeFloat(value, stream) {
    stream.writeFloat(value);
}
exports.encodeFloat = encodeFloat;
function decodeFloat(stream) {
    return stream.readFloat();
}
exports.decodeFloat = decodeFloat;
function isValidDouble(value) {
    if (!_.isFinite(value)) {
        return false;
    }
    return true;
}
exports.isValidDouble = isValidDouble;
function randomDouble() {
    return getRandomDouble(-1000000, 1000000);
}
exports.randomDouble = randomDouble;
function encodeDouble(value, stream) {
    stream.writeDouble(value);
}
exports.encodeDouble = encodeDouble;
function decodeDouble(stream) {
    return stream.readDouble();
}
exports.decodeDouble = decodeDouble;
function coerceFloat(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseFloat(value);
}
exports.coerceFloat = coerceFloat;
function coerceDouble(value) {
    if (value === null || value === undefined) {
        return value;
    }
    return parseFloat(value);
}
exports.coerceDouble = coerceDouble;
//# sourceMappingURL=floats.js.map