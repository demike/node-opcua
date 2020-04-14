/**
 * @module node-opcua-transport
 */
import { UInt32 } from "node-opcua-basic-types";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
interface AcknowledgeMessageOptions {
    protocolVersion?: UInt32;
    receiveBufferSize?: UInt32;
    sendBufferSize?: UInt32;
    maxMessageSize?: UInt32;
    maxChunkCount?: UInt32;
}
export declare class AcknowledgeMessage extends BaseUAObject {
    static possibleFields: string[];
    static schema: StructuredTypeSchema;
    protocolVersion: UInt32;
    receiveBufferSize: UInt32;
    sendBufferSize: UInt32;
    maxMessageSize: UInt32;
    maxChunkCount: UInt32;
    constructor(options?: AcknowledgeMessageOptions);
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
}
export {};
