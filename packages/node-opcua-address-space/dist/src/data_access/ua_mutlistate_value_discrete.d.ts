import { DataType, Variant } from "node-opcua-variant";
import { Int64 } from "node-opcua-basic-types";
import { StatusCode } from "node-opcua-status-code";
import { Property, UAMultiStateValueDiscrete as UAMultiStateValueDiscretePublic, UAVariable as UAVariablePublic } from "../../source/address_space_ts";
import { UAVariable } from "../ua_variable";
export interface UAMultiStateValueDiscrete {
    enumValues: Property<"EnumValueType">;
    valueAsText: Property<DataType.String>;
}
export declare class UAMultiStateValueDiscrete extends UAVariable implements UAMultiStateValueDiscretePublic {
    setValue(value: string | number | Int64): void;
    getValueAsString(): string;
    getValueAsNumber(): number;
    isValueInRange(value: Variant): StatusCode;
    clone(options1: any, optionalFilter: any, extraInfo: any): UAMultiStateValueDiscrete;
    /**
     * @private
     */
    _isValueInRange(value: number): boolean;
    /**
     *
     * @private
     */
    _enumValueIndex(): any;
    /**
     *
     * @private
     */
    _setValue(value: Int64): void;
    /**
     *
     * @private
     */
    _findValueAsText(value?: number | Int64): Variant;
    _getDataType(): DataType;
    /**
     *
     * @private
     */
    _post_initialize(): void;
}
export declare function promoteToMultiStateValueDiscrete(node: UAVariablePublic): UAMultiStateValueDiscrete;
