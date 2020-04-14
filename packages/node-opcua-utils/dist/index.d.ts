/**
 * set a flag
 * @method set_flag
 */
export declare function set_flag(value: number, mask: number | {
    value: number;
}): number;
/**
 * check if a set of bits are set in the values
 * @method check_flag
 */
export declare function check_flag(value: number, mask: number | {
    value: number;
}): boolean;
/**
 * @method normalize_require_file
 * @param baseFolder
 * @param fullPathToFile
 *
 *
 * @example:
 *    normalize_require_file("/home/bob/folder1/","/home/bob/folder1/folder2/toto.js").should.eql("./folder2/toto");
 */
export declare function normalize_require_file(baseFolder: string, fullPathToFile: string): string;
export declare function isNullOrUndefined(value: any): boolean;
export { buffer_ellipsis } from "./buffer_ellipsis";
export { capitalizeFirstLetter, lowerFirstLetter } from "./string_utils";
export { getObjectClassName } from "./object_classname";
export { get_clock_tick } from "./get_clock_tick";
export { compare_buffers } from "./compare_buffers";
export { constructFilename } from "./construct_filename";
export { getFunctionParameterNames } from "./get_function_parameters_name";
export * from "./watchdog";
export { LineFile } from "./linefile";
export { setDeprecated } from "./set_deprecated";
export { replaceBufferWithHexDump } from "./replace_buffer_with_hex_dump";
