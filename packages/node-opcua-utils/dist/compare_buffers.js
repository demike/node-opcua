"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
const buffer_ellipsis_1 = require("./buffer_ellipsis");
function compare_buffers(buf1, buf2, max_length) {
    max_length = max_length || buf2.length;
    const block_length = 80;
    let cursor = 0;
    while (cursor < max_length) {
        const slice1 = buf1.slice(cursor, cursor + block_length);
        const slice2 = buf2.slice(cursor, cursor + block_length);
        if (slice2.toString("hex") !== slice1.toString("hex")) {
            console.log("pos = ", cursor);
            console.log("slice1 :", chalk_1.default.yellow(buffer_ellipsis_1.buffer_ellipsis(slice1)));
            console.log("slice2 :", chalk_1.default.blue(buffer_ellipsis_1.buffer_ellipsis(slice2)));
        }
        cursor += block_length;
    }
    // xx buf1.length.should.equal(max_length);
}
exports.compare_buffers = compare_buffers;
//# sourceMappingURL=compare_buffers.js.map