/***
 * @module node-opcua-buffer-utils
 */
/// <reference types="node" />
export declare const createFastUninitializedBuffer: Function;
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
export declare function makeBuffer(listOfBytes: string): Buffer;
export declare function clone_buffer(buffer: Buffer): Buffer;
