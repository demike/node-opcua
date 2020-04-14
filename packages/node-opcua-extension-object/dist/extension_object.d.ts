/// <reference types="node" />
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
import { NodeId } from "node-opcua-nodeid";
export declare class ExtensionObject extends BaseUAObject {
    static schema: StructuredTypeSchema;
    constructor(options: any);
}
export declare function encodeExtensionObject(object: ExtensionObject | null, stream: OutputBinaryStream): void;
export declare class OpaqueStructure extends ExtensionObject {
    nodeId: NodeId;
    buffer: Buffer;
    constructor(nodeId: NodeId, buffer: Buffer);
    toString(): string;
}
export declare function decodeExtensionObject(stream: BinaryStream): ExtensionObject | null;
