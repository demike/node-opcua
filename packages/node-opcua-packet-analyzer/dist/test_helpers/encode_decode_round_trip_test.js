"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// @ts-check
const chalk_1 = require("chalk");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_test_helpers_1 = require("node-opcua-test-helpers");
const should = require("should");
const _ = require("underscore");
const source_1 = require("../source");
// tslint:disable:no-console
function dump_block_in_debug_mode(buffer, id, options) {
    if (process.env.DEBUG) {
        console.log(node_opcua_debug_1.hexDump(buffer));
        source_1.analyzePacket(buffer, id, 0, 0, options);
    }
}
function isTypedArray(v) {
    if (v && v.buffer && v.buffer instanceof ArrayBuffer) {
        return true;
    }
    return false;
}
function isArrayOrTypedArray(v) {
    return isTypedArray(v) || v instanceof Array;
}
function compare(objReloaded, obj) {
    function displayError(p, expected, actual) {
        console.log(chalk_1.default.yellow(" ---------------------------------- error in encode_decode_round_trip_test"));
        console.log(chalk_1.default.red(" key "), p);
        console.log(chalk_1.default.red(" expected "), JSON.stringify(expected));
        console.log(chalk_1.default.cyan(" actual   "), JSON.stringify(actual));
    }
    Object.keys(objReloaded).forEach((p) => {
        try {
            if (isArrayOrTypedArray(obj[p])) {
                node_opcua_test_helpers_1.assert_arrays_are_equal(objReloaded[p], obj[p]);
            }
            else {
                if (objReloaded[p] === undefined || obj[p] === undefined) {
                    return;
                }
                JSON.stringify(objReloaded[p]).should.eql(JSON.stringify(obj[p]));
            }
        }
        catch (err) {
            displayError(p, obj[p], objReloaded[p]);
            console.log(obj.toString());
            console.log(objReloaded.toString());
            // re throw exception
            throw err;
        }
    });
}
function redirectToNull(functor) {
    const old = console.log;
    if (!process.env.DEBUG) {
        // tslint:disable:no-empty
        console.log = (...args) => { };
    }
    try {
        functor();
    }
    catch (err) {
        throw err;
    }
    finally {
        console.log = old;
    }
}
/**
 * @method encode_decode_round_trip_test
 * @param obj  : object to test ( the object must provide a binaryStoreSize,encode,decode method
 * @param [options]
 * @param callback_buffer
 * @return {*}
 */
function encode_decode_round_trip_test(obj, options, callback_buffer) {
    if (!callback_buffer && _.isFunction(options)) {
        callback_buffer = options;
        options = {};
    }
    callback_buffer = callback_buffer || dump_block_in_debug_mode;
    should.exist(obj);
    const size = obj.binaryStoreSize(options);
    const stream = new node_opcua_binary_stream_1.BinaryStream(Buffer.alloc(size));
    obj.encode(stream, options);
    callback_buffer(stream.buffer, obj.encodingDefaultBinary, options);
    stream.rewind();
    // reconstruct a object ( some object may not have a default Binary and should be recreated
    const expandedNodeId = obj.encodingDefaultBinary;
    const objReloaded = expandedNodeId ? node_opcua_factory_1.constructObject(expandedNodeId) : new obj.constructor();
    objReloaded.decode(stream, options);
    redirectToNull(() => source_1.analyze_object_binary_encoding(obj));
    compare(objReloaded, obj);
    return objReloaded;
}
exports.encode_decode_round_trip_test = encode_decode_round_trip_test;
function json_encode_decode_round_trip_test(obj, options, callbackBuffer) {
    if (!callbackBuffer && _.isFunction(options)) {
        callbackBuffer = options;
        options = {};
    }
    callbackBuffer = callbackBuffer || dump_block_in_debug_mode;
    should.exist(obj);
    const json = JSON.stringify(obj);
    const objReloaded = JSON.parse(json);
    compare(objReloaded, obj);
    return objReloaded;
}
exports.json_encode_decode_round_trip_test = json_encode_decode_round_trip_test;
//# sourceMappingURL=encode_decode_round_trip_test.js.map