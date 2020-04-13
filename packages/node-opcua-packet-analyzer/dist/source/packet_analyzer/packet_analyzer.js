"use strict";
// tslint:disable:no-bitwise
// tslint:disable:no-console
// tslint:disable:max-line-length
// tslint:disable:no-empty-interface
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const util = require("util");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_utils_1 = require("node-opcua-utils");
const spaces = "                                                                                                                                                                             ";
function f(n, width) {
    const s = n.toString();
    return (s + "      ").substr(0, Math.max(s.length, width));
}
function display_encoding_mask(padding, encodingMask, encodingInfo) {
    for (const v in encodingInfo) {
        if (!encodingInfo.hasOwnProperty(v)) {
            continue;
        }
        const enumKey = encodingInfo[v];
        if (typeof enumKey === "number") {
            continue;
        }
        const mask = encodingInfo[enumKey];
        const bit = Math.log(mask) / Math.log(2);
        const bits = [".", ".", ".", ".", ".", ".", ".", ".", "."];
        bits[bit] = ((encodingMask & mask) === mask) ? "Y" : "n";
        console.log(padding + " ", bits.join(""), " <- has " + enumKey + " 0x" + mask.toString(16));
    }
    // DataValueEncodingByte
}
function hex_block(start, end, buffer) {
    const n = end - start;
    const strBuf = node_opcua_utils_1.buffer_ellipsis(buffer);
    return chalk_1.default.cyan("s:") + f(start, 4) + chalk_1.default.cyan(" e:") + f(end, 4) + chalk_1.default.cyan(" n:") + f(n, 4) + " " + chalk_1.default.yellow(strBuf);
}
function make_tracer(buffer, padding, offset) {
    padding = !padding ? 0 : padding;
    offset = offset || 0;
    const pad = () => "                                                       ".substr(0, padding);
    function _display(str, hexInfo) {
        hexInfo = hexInfo || "";
        // account for ESC codes for colors
        const nbColorAttributes = _.filter(str, (c) => {
            return c === "\u001b";
        }).length;
        const extra = nbColorAttributes * 5;
        console.log((pad() + str + spaces).substr(0, 132 + extra) + "|" + hexInfo);
    }
    function display(str, hexInfo) {
        const lines = str.split("\n");
        for (const line of lines) {
            _display(line, hexInfo);
        }
    }
    function display_encodeable(value, buffer1, start, end) {
        const bufferExtract = buffer1.slice(start, end);
        const stream = new node_opcua_binary_stream_1.BinaryStream(bufferExtract);
        const nodeId = node_opcua_basic_types_1.decodeNodeId(stream);
        const encodingMask = node_opcua_basic_types_1.decodeByte(stream); // 1 bin 2: xml
        const length = node_opcua_basic_types_1.decodeUInt32(stream);
        display(chalk_1.default.green("     ExpandedNodId =") + " " + nodeId);
        display(chalk_1.default.green("     encoding mask =") + " " + encodingMask);
        display(chalk_1.default.green("            length =") + " " + length);
        analyzePacket(bufferExtract.slice(stream.length), value.encodingDefaultBinary, padding + 2, start + stream.length);
    }
    return {
        tracer: {
            dump: (title, value) => display(title + "  " + chalk_1.default.green(value.toString())),
            encoding_byte: (encodingMask, valueEnum, start, end) => {
                node_opcua_assert_1.assert(valueEnum);
                const b = buffer.slice(start, end);
                display("  012345678", hex_block(start, end, b));
                display_encoding_mask(pad(), encodingMask, valueEnum);
            },
            trace: (operation, name, value, start, end, fieldType) => {
                const b = buffer.slice(start, end);
                let _hexDump = "";
                switch (operation) {
                    case "start":
                        padding += 2;
                        display(name.toString());
                        break;
                    case "end":
                        padding -= 2;
                        break;
                    case "start_array":
                        display("." + name + " (length = " + value + ") " + "[", hex_block(start, end, b));
                        padding += 2;
                        break;
                    case "end_array":
                        padding -= 2;
                        display("] // " + name);
                        break;
                    case "start_element":
                        display(" #" + value + " {");
                        padding += 2;
                        break;
                    case "end_element":
                        padding -= 2;
                        display(" } // # " + value);
                        break;
                    case "member":
                        display("." + name + " : " + fieldType);
                        _hexDump = "";
                        if (value instanceof Buffer) {
                            _hexDump = node_opcua_debug_1.hexDump(value);
                            console.log(_hexDump);
                            value = "<BUFFER>";
                        }
                        if (value && value.encode) {
                            if (fieldType === "ExtensionObject") {
                                display_encodeable(value, buffer, start, end);
                            }
                            else {
                                const str = value.toString() || "<empty>";
                                display(str);
                            }
                        }
                        else {
                            display(" " + value, hex_block(start, end, b));
                        }
                        break;
                }
            },
        },
    };
}
function analyzePacket(buffer, objMessage, padding, offset, customOptions) {
    const stream = new node_opcua_binary_stream_1.BinaryStream(buffer);
    _internalAnalyzePacket(buffer, stream, objMessage, padding, customOptions, offset);
}
exports.analyzePacket = analyzePacket;
function analyseExtensionObject(buffer, padding, offset, customOptions) {
    const stream = new node_opcua_binary_stream_1.BinaryStream(buffer);
    let id;
    let objMessage;
    try {
        id = node_opcua_basic_types_1.decodeExpandedNodeId(stream);
        objMessage = node_opcua_factory_1.constructObject(id);
    }
    catch (err) {
        console.log(id);
        console.log(err);
        console.log("Cannot read decodeExpandedNodeId  on stream " + stream.buffer.toString("hex"));
    }
    _internalAnalyzePacket(buffer, stream, objMessage, padding, customOptions, offset);
}
exports.analyseExtensionObject = analyseExtensionObject;
function _internalAnalyzePacket(buffer, stream, objMessage, padding, customOptions, offset) {
    let options = make_tracer(buffer, padding, offset);
    options.name = "message";
    options = _.extend(options, customOptions);
    try {
        if (objMessage) {
            objMessage.decodeDebug(stream, options);
        }
        else {
            console.log(" Invalid object", objMessage);
        }
    }
    catch (err) {
        console.log(" Error in ", err);
        console.log(" Error in ", err.stack);
        console.log(" objMessage ", util.inspect(objMessage, { colors: true }));
    }
}
function analyze_object_binary_encoding(obj) {
    node_opcua_assert_1.assert(obj);
    const size = obj.binaryStoreSize();
    console.log("-------------------------------------------------");
    console.log(" size = ", size);
    const stream = new node_opcua_binary_stream_1.BinaryStream(size);
    obj.encode(stream);
    stream.rewind();
    console.log("-------------------------------------------------");
    if (stream.buffer.length < 256) {
        console.log(node_opcua_debug_1.hexDump(stream.buffer));
        console.log("-------------------------------------------------");
    }
    const reloadedObject = new obj.constructor();
    analyzePacket(stream.buffer, reloadedObject, 0);
}
exports.analyze_object_binary_encoding = analyze_object_binary_encoding;
//# sourceMappingURL=packet_analyzer.js.map