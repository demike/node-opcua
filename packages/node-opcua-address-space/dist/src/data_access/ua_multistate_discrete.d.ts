import { StatusCode } from "node-opcua-status-code";
import { Variant } from "node-opcua-variant";
import { Property, UAMultiStateDiscrete as UAMultiStateDiscretePublic, UAVariable as UAVariablePublic } from "../../source";
import { UAVariable } from "../ua_variable";
export interface UAMultiStateDiscrete {
    enumStrings: Property<"StringArray">;
}
/**
 * @class UAMultiStateDiscrete
 */
export declare class UAMultiStateDiscrete extends UAVariable implements UAMultiStateDiscretePublic {
    getValue(): number;
    getValueAsString(): string;
    getIndex(value: string): number;
    setValue(value: string | number): void;
    isValueInRange(value: Variant): StatusCode;
    _post_initialize(): void;
    clone(options1: any, optionalFilter: any, extraInfo: any): UAMultiStateDiscrete;
}
export declare function promoteToMultiStateDiscrete(node: UAVariablePublic): UAMultiStateDiscrete;
