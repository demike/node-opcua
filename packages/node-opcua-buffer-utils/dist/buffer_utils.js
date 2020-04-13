"use strict";
/***
 * @module node-opcua-buffer-utils
 */
Object.defineProperty(exports, "__esModule", { value: true });
//
// note: new Buffer(size)#  is deprecated since: v6.0. and is replaced with Buffer.allocUnsafe
//       to ensure backward compatibility we have to replace
//       new Buffer(size) with createFastUninitializedBuffer(size)
//
//       Buffer.alloc and Buffer.allocUnsafe have been introduced in nodejs 5.1.0
//  in node 0.11 new Buffer
//
// tslint:disable-next-line:ban-types
exports.createFastUninitializedBuffer = Buffer.allocUnsafe ? Buffer.allocUnsafe : (size) => {
    return new Buffer(size);
};
/**
 * @method makeBuffer
 * turn a string make of hexadecimal bytes into a buffer
 *
 * @example
 *     const buffer = makeBuffer("BE EF");
 *
 * @param listOfBytes
 * @return {Buffer}
 */
function makeBuffer(listOfBytes) {
    const l = listOfBytes.split(" ");
    const b = exports.createFastUninitializedBuffer(l.length);
    let i = 0;
    l.forEach((value) => {
        b.writeUInt8(parseInt(value, 16), i);
        i += 1;
    });
    return b;
}
exports.makeBuffer = makeBuffer;
function clone_buffer(buffer) {
    const clone = exports.createFastUninitializedBuffer(buffer.length);
    buffer.copy(clone, 0, 0);
    return clone;
}
exports.clone_buffer = clone_buffer;
//# sourceMappingURL=buffer_utils.js.map