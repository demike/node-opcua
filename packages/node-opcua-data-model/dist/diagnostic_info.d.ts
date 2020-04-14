import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
import { StatusCode } from "node-opcua-status-code";
import { Int32, UAString } from "node-opcua-basic-types";
export declare const schemaDiagnosticInfo: StructuredTypeSchema;
export declare class DiagnosticInfo extends BaseUAObject {
    static schema: StructuredTypeSchema;
    static possibleFields: string[];
    symbolicId: Int32;
    namespaceURI: Int32;
    locale: Int32;
    localizedText: Int32;
    additionalInfo: UAString;
    innerStatusCode: StatusCode;
    innerDiagnosticInfo: DiagnosticInfo;
    /**
     *
     * @class DiagnosticInfo
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options?: any);
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
    decodeDebug(stream: BinaryStream, options: any): void;
}
export declare type DiagnosticInfoOptions = any;
export declare enum DiagnosticInfo_EncodingByte {
    SymbolicId = 1,
    NamespaceURI = 2,
    LocalizedText = 4,
    Locale = 8,
    AdditionalInfo = 16,
    InnerStatusCode = 32,
    InnerDiagnosticInfo = 64
}
export declare function encodeDiagnosticInfo(value: DiagnosticInfo, stream: OutputBinaryStream): void;
export declare function decodeDiagnosticInfo(stream: BinaryStream): DiagnosticInfo;
