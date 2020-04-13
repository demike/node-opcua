"use strict";
/***
 * @module node-opcua-basic-types
 */
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_guid_1 = require("node-opcua-guid");
const utils_1 = require("./utils");
var node_opcua_guid_2 = require("node-opcua-guid");
exports.isValidGuid = node_opcua_guid_2.isValidGuid;
exports.emptyGuid = node_opcua_guid_2.emptyGuid;
function toHex(i, nb) {
    return ("000000000000000" + i.toString(16)).substr(-nb);
}
function randomGuid() {
    const b = new node_opcua_binary_stream_1.BinaryStream(20);
    for (let i = 0; i < 20; i++) {
        b.writeUInt8(utils_1.getRandomInt(0, 255));
    }
    b.rewind();
    const value = decodeGuid(b);
    return value;
}
exports.randomGuid = randomGuid;
function encodeGuid(guid, stream) {
    if (!node_opcua_guid_1.isValidGuid(guid)) {
        throw new Error(" Invalid GUID : '" + JSON.stringify(guid) + "'");
    }
    //           1         2         3
    // 012345678901234567890123456789012345
    // |        |    |    | |  | | | | | |
    // 12345678-1234-1234-ABCD-0123456789AB
    // 00000000-0000-0000-0000-000000000000";
    function write_UInt32(starts) {
        const n = starts.length;
        for (let i = 0; i < n; i++) {
            const start = starts[i];
            stream.writeUInt32(parseInt(guid.substr(start, 8), 16));
        }
    }
    function write_UInt16(starts) {
        const n = starts.length;
        for (let i = 0; i < n; i++) {
            const start = starts[i];
            stream.writeUInt16(parseInt(guid.substr(start, 4), 16));
        }
    }
    function write_UInt8(starts) {
        const n = starts.length;
        for (let i = 0; i < n; i++) {
            const start = starts[i];
            stream.writeUInt8(parseInt(guid.substr(start, 2), 16));
        }
    }
    write_UInt32([0]);
    write_UInt16([9, 14]);
    write_UInt8([19, 21, 24, 26, 28, 30, 32, 34]);
}
exports.encodeGuid = encodeGuid;
function decodeGuid(stream) {
    function read_UInt32() {
        return toHex(stream.readUInt32(), 8);
    }
    function read_UInt16() {
        return toHex(stream.readUInt16(), 4);
    }
    function read_UInt8() {
        return toHex(stream.readUInt8(), 2);
    }
    function read_many(func, nb) {
        let result = "";
        for (let i = 0; i < nb; i++) {
            result += func();
        }
        return result;
    }
    const data1 = read_UInt32();
    const data2 = read_UInt16();
    const data3 = read_UInt16();
    const data45 = read_many(read_UInt8, 2);
    const data6B = read_many(read_UInt8, 6);
    const guid = data1 + "-" + data2 + "-" + data3 + "-" + data45 + "-" + data6B;
    return guid.toUpperCase();
}
exports.decodeGuid = decodeGuid;
//# sourceMappingURL=guid.js.map