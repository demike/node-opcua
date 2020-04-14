import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { ExpandedNodeId } from "node-opcua-nodeid";
import { UAString, UInt16 } from "node-opcua-basic-types";
export declare const schemaQualifiedName: StructuredTypeSchema;
export interface QualifiedNameOptions {
    namespaceIndex?: UInt16;
    name?: UAString;
}
export declare class QualifiedName extends BaseUAObject {
    static schema: StructuredTypeSchema;
    static possibleFields: string[];
    static encodingDefaultBinary: ExpandedNodeId;
    static encodingDefaultXml: ExpandedNodeId;
    namespaceIndex: UInt16;
    name: UAString;
    /**
     *
     * @class QualifiedName
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options?: QualifiedNameOptions);
    /**
     * encode the object into a binary stream
     * @method encode
     *
     * @param stream {BinaryStream}
     */
    encode(stream: OutputBinaryStream): void;
    /**
     * decode the object from a binary stream
     * @method decode
     *
     * @param stream {BinaryStream}
     */
    decode(stream: BinaryStream): void;
    toString(): string;
    isEmpty(): boolean;
}
export declare type QualifiedNameLike = QualifiedNameOptions | QualifiedName | string;
/**
 * @method stringToQualifiedName
 * @param value {String}
 * @return {{namespaceIndex: Number, name: String}}
 *
 * @example
 *
 *  stringToQualifiedName("Hello")   => {namespaceIndex: 0, name: "Hello"}
 *  stringToQualifiedName("3:Hello") => {namespaceIndex: 3, name: "Hello"}
 */
export declare function stringToQualifiedName(value: string): QualifiedName;
export declare function coerceQualifiedName(value: any): QualifiedName | null;
export declare function encodeQualifiedName(value: QualifiedName, stream: OutputBinaryStream): void;
export declare function decodeQualifiedName(stream: BinaryStream): QualifiedName;
