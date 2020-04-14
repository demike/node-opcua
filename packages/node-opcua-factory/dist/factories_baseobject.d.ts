import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { StructuredTypeSchema } from "./factories_structuredTypeSchema";
export interface DecodeDebugOptions {
    tracer: any;
    name: string;
}
export interface BaseUAObject {
    schema: StructuredTypeSchema;
}
/**
 * @class BaseUAObject
 * @constructor
 */
export declare class BaseUAObject {
    constructor();
    /**
     * Encode the object to the binary stream.
     * @class BaseUAObject
     * @method encode
     * @param stream {BinaryStream}
     */
    encode(stream: OutputBinaryStream): void;
    /**
     * Decode the object from the binary stream.
     * @class BaseUAObject
     * @method decode
     * @param stream {BinaryStream}
     */
    decode(stream: BinaryStream): void;
    /**
     * Calculate the required size to store this object in a binary stream.
     * @method binaryStoreSize
     * @return number
     */
    binaryStoreSize(): number;
    /**
     * @method toString
     * @return {String}
     */
    toString(...args: any[]): string;
    /**
     *
     * verify that all object attributes values are valid according to schema
     * @method isValid
     * @return boolean
     */
    isValid(): boolean;
    /**
     * @method decodeDebug
     *
     */
    decodeDebug(stream: BinaryStream, options: DecodeDebugOptions): void;
    explore(): string;
    toJSON(): any;
    clone(): any;
}
