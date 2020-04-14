import { Variant } from "node-opcua-variant";
export declare enum DeadbandType {
    None = 0,
    Absolute = 1,
    Percent = 2,
    Invalid = 4096
}
export declare type NumberType = number | number[];
/**
 * @method checkDeadBand
 * @param variant1 {Variant}
 * @param variant2 {Variant}
 * @param deadbandType  {DeadbandType}
 * @param deadbandValue {Float}
 * @param valueRange    {Float}
 * @return {boolean}
 */
export declare function checkDeadBand(variant1: Variant, variant2: Variant, deadbandType: DeadbandType, deadbandValue?: number, valueRange?: number): boolean;
