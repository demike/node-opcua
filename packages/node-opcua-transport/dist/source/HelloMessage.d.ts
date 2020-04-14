/**
 * @module node-opcua-transport
 */
import { UAString, UInt32 } from "node-opcua-basic-types";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject } from "node-opcua-factory";
export interface HelloMessageOptions {
    protocolVersion?: UInt32;
    receiveBufferSize?: UInt32;
    sendBufferSize?: UInt32;
    maxMessageSize?: UInt32;
    maxChunkCount?: UInt32;
    endpointUrl?: UAString;
}
export declare class HelloMessage extends BaseUAObject {
    static possibleFields: string[];
    protocolVersion: UInt32;
    receiveBufferSize: UInt32;
    sendBufferSize: UInt32;
    maxMessageSize: UInt32;
    maxChunkCount: UInt32;
    endpointUrl: UAString;
    constructor(options?: HelloMessageOptions);
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
}
