"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-debug
 */
const node_opcua_buffer_utils_1 = require("node-opcua-buffer-utils");
function inlineText(f) {
    let k = f.toString().replace(/^[^\/]+\/\*!?/, "").replace(/\*\/[^\/]+$/, "");
    k = k.split("\n").map((t) => t.trim()).join("\n");
    return k;
}
exports.inlineText = inlineText;
function hexString(str) {
    let hexline = "";
    let lines = str.split("\n");
    if (lines.length === 0) {
        return hexline;
    }
    while (lines.length && lines[0].length === 0) {
        lines = lines.splice(1);
    }
    // find prefix
    const prefixLength = lines[0].match(/[0-9a-fA-F:]*\ +/)[0].length;
    for (let line of lines) {
        line = line.trim();
        if (line.length > 80) {
            line = line.substr(10, 98).trim();
            hexline = hexline ? hexline + " " + line : line;
        }
        else if (line.length > 60) {
            line = line.substr(7, 48).trim();
            hexline = hexline ? hexline + " " + line : line;
        }
        else if (line.length > prefixLength) {
            line = line.substr(prefixLength, prefixLength + 48).trim();
            hexline = hexline ? hexline + " " + line : line;
        }
    }
    return hexline;
}
// tslint:disable:ban-types
function makebuffer_from_trace(func) {
    if (typeof func === "string") {
        return node_opcua_buffer_utils_1.makeBuffer(hexString(func));
    }
    return node_opcua_buffer_utils_1.makeBuffer(hexString(inlineText(func)));
}
exports.makebuffer_from_trace = makebuffer_from_trace;
//# sourceMappingURL=makebuffer_from_trace.js.map