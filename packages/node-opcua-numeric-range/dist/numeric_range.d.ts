import { UAString } from "node-opcua-basic-types";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { StatusCode } from "node-opcua-status-code";
export declare const schemaNumericRange: {
    name: string;
    subType: string;
    defaultValue: () => NumericRange;
    encode: (value: NumericRange | null, stream: OutputBinaryStream) => void;
    decode: (stream: BinaryStream) => NumericRange;
    random: () => NumericRange;
    coerce: typeof coerceNumericRange;
};
export declare enum NumericRangeType {
    Empty = 0,
    SingleValue = 1,
    ArrayRange = 2,
    MatrixRange = 3,
    InvalidRange = 4
}
declare type NumericalRangeValueType = null | number | string | number[] | number[][];
export interface NumericalRangeSingleValue {
    type: NumericRangeType.SingleValue;
    value: number;
}
export interface NumericalRangeArrayRange {
    type: NumericRangeType.ArrayRange;
    value: number[];
}
export interface NumericalRangeMatrixRange {
    type: NumericRangeType.MatrixRange;
    value: number[][];
}
export interface NumericalRangeEmpty {
    type: NumericRangeType.Empty;
    value: null;
}
export interface NumericalRangeInvalid {
    type: NumericRangeType.InvalidRange;
    value: string;
}
export declare type NumericalRange0 = NumericalRangeSingleValue | NumericalRangeArrayRange | NumericalRangeMatrixRange | NumericalRangeEmpty | NumericalRangeInvalid;
export interface NumericalRange1 {
    type: NumericRangeType;
    value: NumericalRangeValueType;
}
export declare class NumericRange implements NumericalRange1 {
    static coerce: typeof coerceNumericRange;
    static NumericRangeType: typeof NumericRangeType;
    static readonly empty: NumericalRange0;
    static overlap(nr1?: NumericalRange0, nr2?: NumericalRange0): boolean;
    type: NumericRangeType;
    value: NumericalRangeValueType;
    constructor(value?: any, secondValue?: any);
    isValid(): boolean;
    isEmpty(): boolean;
    isDefined(): boolean;
    toString(): string;
    toJSON(): string;
    toEncodeableString(): UAString;
    /**
     * @method extract_values
     * @param array   flat array containing values or string
     * @param dimensions: of the matrix if data is a matrix
     * @return {*}
     */
    extract_values<U, T extends ArrayLike<U>>(array: T, dimensions?: number[]): ExtractResult<T>;
    set_values(arrayToAlter: any, newValues: any): {
        array: [];
        statusCode: StatusCode;
    };
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
}
export interface ExtractResult<T> {
    array?: T;
    statusCode: StatusCode;
    dimensions?: number[];
}
export declare function encodeNumericRange(numericRange: NumericRange, stream: OutputBinaryStream): void;
export declare function decodeNumericRange(stream: BinaryStream): NumericRange;
declare function coerceNumericRange(value: any | string | NumericRange | null | number[]): NumericRange;
export {};
