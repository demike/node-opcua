/**
 * @module node-opcua-data-value
 */
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
export declare enum TimestampsToReturn {
    Source = 0,
    Server = 1,
    Both = 2,
    Neither = 3,
    Invalid = 4
}
export declare const schemaTimestampsToReturn: {
    name: string;
    enumValues: typeof TimestampsToReturn;
};
export declare function encodeTimestampsToReturn(value: TimestampsToReturn, stream: OutputBinaryStream): void;
export declare function decodeTimestampsToReturn(stream: BinaryStream): TimestampsToReturn;
export declare const _enumerationTimestampsToReturn: import("node-opcua-enum").Enum;
