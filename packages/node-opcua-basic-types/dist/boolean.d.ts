import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
export declare function isValidBoolean(value: any): boolean;
export declare function randomBoolean(): boolean;
export declare function encodeBoolean(value: boolean, stream: OutputBinaryStream): void;
export declare function decodeBoolean(stream: BinaryStream): boolean;
export declare function coerceBoolean(value: any): boolean;
export declare type UABoolean = boolean;
export declare const encodeUABoolean: typeof encodeBoolean;
export declare const decodeUABoolean: typeof decodeBoolean;
