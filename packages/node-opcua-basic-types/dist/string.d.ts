/***
 * @module node-opcua-basic-types
 */
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
export declare function isValidString(value: any): boolean;
export declare function randomString(): string;
export declare function decodeString(stream: BinaryStream): string | null;
export declare function encodeString(value: null | string, stream: OutputBinaryStream): void;
export declare type CharArray = string;
export declare type UAString = string | null;
export declare const decodeUAString: typeof decodeString;
export declare const encodeUAString: typeof encodeString;
