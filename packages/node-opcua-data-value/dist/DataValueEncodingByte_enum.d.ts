/**
 * @module node-opcua-data-value
 */
import { Enum } from "node-opcua-enum";
export declare enum DataValueEncodingByte {
    Value = 1,
    StatusCode = 2,
    SourceTimestamp = 4,
    ServerTimestamp = 8,
    SourcePicoseconds = 16,
    ServerPicoseconds = 32
}
export declare const schemaDataValueEncodingByte: {
    name: string;
    enumValues: typeof DataValueEncodingByte;
};
export declare const _enumerationDataValueEncodingByte: Enum;
