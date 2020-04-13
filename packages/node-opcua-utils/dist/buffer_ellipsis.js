"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
function buffer_ellipsis(buffer, start, end) {
    start = start || 0;
    end = end || buffer.length;
    if (end - start < 40) {
        return buffer.slice(start, end).toString("hex");
    }
    return buffer.slice(start, start + 10).toString("hex") + " ... " + buffer.slice(end - 10, end).toString("hex");
}
exports.buffer_ellipsis = buffer_ellipsis;
exports.buffer_ellipsis = buffer_ellipsis;
//# sourceMappingURL=buffer_ellipsis.js.map