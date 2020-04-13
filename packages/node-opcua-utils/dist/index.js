"use strict";
function __export(m) {
    for (var p in m) if (!exports.hasOwnProperty(p)) exports[p] = m[p];
}
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
// tslint:disable:no-bitwise
const node_opcua_assert_1 = require("node-opcua-assert");
const path = require("path");
/**
 * set a flag
 * @method set_flag
 */
function set_flag(value, mask) {
    if (mask.value) {
        mask = mask.value;
    }
    node_opcua_assert_1.assert(!mask.hasOwnProperty("value"));
    node_opcua_assert_1.assert(mask !== undefined);
    return value | mask;
}
exports.set_flag = set_flag;
/**
 * check if a set of bits are set in the values
 * @method check_flag
 */
function check_flag(value, mask) {
    if (mask.value) {
        mask = mask.value;
    }
    node_opcua_assert_1.assert(!mask.hasOwnProperty("value"));
    return ((value & mask) === mask);
}
exports.check_flag = check_flag;
// ---------------------------------------------------------------------------------------------------------------------
/**
 * @method normalize_require_file
 * @param baseFolder
 * @param fullPathToFile
 *
 *
 * @example:
 *    normalize_require_file("/home/bob/folder1/","/home/bob/folder1/folder2/toto.js").should.eql("./folder2/toto");
 */
function normalize_require_file(baseFolder, fullPathToFile) {
    let localFile = path.relative(baseFolder, fullPathToFile).replace(/\\/g, "/");
    // append ./ if necessary
    if (localFile.substr(0, 1) !== ".") {
        localFile = "./" + localFile;
    }
    // remove extension
    localFile = localFile.substr(0, localFile.length - path.extname(localFile).length);
    return localFile;
}
exports.normalize_require_file = normalize_require_file;
function isNullOrUndefined(value) {
    return value === undefined || value === null;
}
exports.isNullOrUndefined = isNullOrUndefined;
var buffer_ellipsis_1 = require("./buffer_ellipsis");
exports.buffer_ellipsis = buffer_ellipsis_1.buffer_ellipsis;
var string_utils_1 = require("./string_utils");
exports.capitalizeFirstLetter = string_utils_1.capitalizeFirstLetter;
exports.lowerFirstLetter = string_utils_1.lowerFirstLetter;
var object_classname_1 = require("./object_classname");
exports.getObjectClassName = object_classname_1.getObjectClassName;
var get_clock_tick_1 = require("./get_clock_tick");
exports.get_clock_tick = get_clock_tick_1.get_clock_tick;
var compare_buffers_1 = require("./compare_buffers");
exports.compare_buffers = compare_buffers_1.compare_buffers;
var construct_filename_1 = require("./construct_filename");
exports.constructFilename = construct_filename_1.constructFilename;
var get_function_parameters_name_1 = require("./get_function_parameters_name");
exports.getFunctionParameterNames = get_function_parameters_name_1.getFunctionParameterNames;
__export(require("./watchdog"));
var linefile_1 = require("./linefile");
exports.LineFile = linefile_1.LineFile;
var set_deprecated_1 = require("./set_deprecated");
exports.setDeprecated = set_deprecated_1.setDeprecated;
var replace_buffer_with_hex_dump_1 = require("./replace_buffer_with_hex_dump");
exports.replaceBufferWithHexDump = replace_buffer_with_hex_dump_1.replaceBufferWithHexDump;
//# sourceMappingURL=index.js.map