import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
import { StatusCode } from "node-opcua-status-code";
import { Variant, VariantOptions } from "node-opcua-variant";
import { TimestampsToReturn } from "./TimestampsToReturn_enum";
import { DateTime, UInt16 } from "node-opcua-basic-types";
import { AttributeIds } from "node-opcua-data-model";
declare type NumericalRange = any;
export declare function encodeDataValue(dataValue: DataValue, stream: OutputBinaryStream): void;
export declare function decodeDataValue(stream: BinaryStream): DataValue;
export interface DataValueOptions {
    value?: VariantOptions;
    statusCode?: StatusCode;
    sourceTimestamp?: DateTime;
    sourcePicoseconds?: UInt16;
    serverTimestamp?: DateTime;
    serverPicoseconds?: UInt16;
}
export declare class DataValue extends BaseUAObject {
    static possibleFields: string[];
    static schema: StructuredTypeSchema;
    value: Variant;
    statusCode: StatusCode;
    sourceTimestamp: DateTime;
    sourcePicoseconds: UInt16;
    serverTimestamp: DateTime;
    serverPicoseconds: UInt16;
    /**
     *
     * @class DataValue
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options?: DataValueOptions);
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
    decodeDebug(stream: BinaryStream, options: any): void;
    isValid(): boolean;
    toString(): string;
    clone(): DataValue;
}
export declare type DataValueLike = DataValueOptions | DataValue;
export declare function apply_timestamps(dataValue: DataValue, timestampsToReturn: TimestampsToReturn, attributeId: AttributeIds): DataValue;
/**
 * return a deep copy of the dataValue by applying indexRange if necessary on  Array/Matrix
 * @param dataValue {DataValue}
 * @param indexRange {NumericalRange}
 * @return {DataValue}
 */
export declare function extractRange(dataValue: DataValue, indexRange: NumericalRange): DataValue;
export declare function sourceTimestampHasChanged(dataValue1: DataValue, dataValue2: DataValue): boolean;
export declare function serverTimestampHasChanged(dataValue1: DataValue, dataValue2: DataValue): boolean;
export declare function timestampHasChanged(dataValue1: DataValue, dataValue2: DataValue, timestampsToReturn?: TimestampsToReturn): boolean;
export declare function sameStatusCode(statusCode1: StatusCode, statusCode2: StatusCode): boolean;
/**
 * @method sameDataValue
 * @param v1 {DataValue}
 * @param v2 {DataValue}
 * @param [timestampsToReturn {TimestampsToReturn}]
 * @return {boolean} true if data values are identical
 */
export declare function sameDataValue(v1: DataValue, v2: DataValue, timestampsToReturn?: TimestampsToReturn): boolean;
export {};
