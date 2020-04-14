/***
 * @module node-opcua-chunkmanager
 */
import { UInt32 } from "node-opcua-basic-types";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
export declare class SequenceHeader extends BaseUAObject {
    static possibleFields: string[];
    static schema: StructuredTypeSchema;
    sequenceNumber: UInt32;
    requestId: UInt32;
    constructor(options?: any);
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
}
