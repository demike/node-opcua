/**
 * @module node-opcua-variant
 */
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { DataType } from "./DataType_enum";
import { VariantArrayType } from "./VariantArrayType_enum";
declare function _coerceVariant(variantLike: any): Variant;
export interface VariantOptions {
    dataType?: DataType | string;
    arrayType?: VariantArrayType | string;
    value?: any;
    dimensions?: number[] | null;
}
export declare class Variant extends BaseUAObject {
    static schema: StructuredTypeSchema;
    static coerce: typeof _coerceVariant;
    dataType: DataType;
    arrayType: VariantArrayType;
    value: any;
    dimensions: number[] | null;
    constructor(options?: VariantOptions);
    setDataType(value: any): void;
    setArrayType(value: any): void;
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
    decodeDebug(stream: BinaryStream, options: any): void;
    toString(): string;
    isValid(): boolean;
    clone(): Variant;
}
export declare type VariantLike = VariantOptions | Variant;
/***
 * @private
 */
export declare const VARIANT_ARRAY_MASK = 128;
/***
 * @private
 */
export declare const VARIANT_ARRAY_DIMENSIONS_MASK = 64;
/***
 * @private
 */
export declare const VARIANT_TYPE_MASK = 63;
/***
 * @private
 */
export declare function encodeVariant(variant: Variant, stream: OutputBinaryStream): void;
/***
 * @private
 */
export declare function decodeVariant(stream: BinaryStream): Variant;
/***
 * @private
 */
export declare type BufferedArray2 = Float32Array | Float64Array | Int8Array | Int16Array | Int32Array | Uint8Array | Uint16Array | Uint32Array;
export declare function coerceVariantType(dataType: DataType, value: any): any;
export declare function isValidVariant(arrayType: VariantArrayType, dataType: DataType, value: any, dimensions?: number[] | null): boolean;
export declare function buildVariantArray(dataType: DataType, nbElements: number, defaultValue: any): any[] | Int8Array | Uint8Array | Int16Array | Uint16Array | Int32Array | Uint32Array | Float32Array | Float64Array;
/***
 *  returns true if the two variant represent the same value
 * @param v1 the first variant to compare
 * @param v2  the variant to compare with
 */
export declare function sameVariant(v1: Variant, v2: Variant): boolean;
export {};
