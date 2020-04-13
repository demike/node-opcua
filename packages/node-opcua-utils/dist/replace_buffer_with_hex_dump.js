"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
function replaceBufferWithHexDump(obj) {
    for (const p in obj) {
        if (obj.hasOwnProperty(p)) {
            if (obj[p] instanceof Buffer) {
                obj[p] = "<BUFFER>" + obj[p].toString("hex") + "</BUFFER>";
            }
            else if (typeof obj[p] === "object") {
                replaceBufferWithHexDump(obj[p]);
            }
        }
    }
    return obj;
}
exports.replaceBufferWithHexDump = replaceBufferWithHexDump;
//# sourceMappingURL=replace_buffer_with_hex_dump.js.map