/**
 * @module node-opcua-data-model
 */
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { Enum } from "node-opcua-enum";
export declare enum BrowseDirection {
    Forward = 0,
    Inverse = 1,
    Both = 2,
    Invalid = 3
}
export declare const schemaBrowseDirection: {
    name: string;
    enumValues: typeof BrowseDirection;
};
export declare function encodeBrowseDirection(value: BrowseDirection, stream: OutputBinaryStream): void;
export declare function decodeBrowseDirection(stream: BinaryStream): BrowseDirection;
export declare const _enumerationBrowseDirection: Enum;
