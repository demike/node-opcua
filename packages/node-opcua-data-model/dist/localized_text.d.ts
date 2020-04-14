import { LocaleId, UAString } from "node-opcua-basic-types";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
export declare function coerceLocalizedText(value: any): LocalizedText | null;
export interface LocalizedTextOptions {
    locale?: LocaleId;
    text?: UAString;
}
export declare class LocalizedText extends BaseUAObject {
    static readonly schema: StructuredTypeSchema;
    readonly schema: StructuredTypeSchema;
    static possibleFields: string[];
    static coerce(value: any): LocalizedText | null;
    locale: LocaleId;
    text: UAString;
    /**
     *
     * @class LocalizedText
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options?: LocalizedTextOptions);
    toString(): string;
    encode(stream: OutputBinaryStream): void;
    decodeDebug(stream: BinaryStream, options: any): void;
    decode(stream: BinaryStream): void;
}
export declare type LocalizedTextLike = LocalizedTextOptions | LocalizedText | string;
export declare function encodeLocalizedText(value: LocalizedText, stream: OutputBinaryStream): void;
export declare function decodeLocalizedText(stream: BinaryStream): LocalizedText;
