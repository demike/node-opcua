"use strict";
/***
 * @module node-opcua-basic-types
 */
Object.defineProperty(exports, "__esModule", { value: true });
const utils_1 = require("./utils");
function isValidString(value) {
    return typeof value === "string";
}
exports.isValidString = isValidString;
function randomString() {
    const nbCar = utils_1.getRandomInt(1, 20);
    const cars = [];
    for (let i = 0; i < nbCar; i++) {
        cars.push(String.fromCharCode(65 + utils_1.getRandomInt(0, 26)));
    }
    return cars.join("");
}
exports.randomString = randomString;
function decodeString(stream) {
    return stream.readString();
}
exports.decodeString = decodeString;
function encodeString(value, stream) {
    stream.writeString(value);
}
exports.encodeString = encodeString;
exports.decodeUAString = decodeString;
exports.encodeUAString = encodeString;
//# sourceMappingURL=string.js.map