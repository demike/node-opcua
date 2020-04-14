import { UInt16 } from "node-opcua-basic-types";
import { LocalizedText } from "node-opcua-data-model";
import { StatusCode } from "node-opcua-status-code";
import { ConditionInfoOptions } from "../../source/interfaces/alarms_and_conditions/condition_info_i";
export interface ConditionInfo {
    message: LocalizedText | null;
    quality: StatusCode | null;
    severity: UInt16 | null;
    retain: boolean | null;
    isDifferentFrom(otherConditionInfo: ConditionInfo): boolean;
}
/**
 * @class ConditionInfo
 * @param options  {Object}
 * @param options.message   {String|LocalizedText} the event message
 * @param options.severity  {UInt16} severity
 * @param options.quality   {StatusCode} quality
 * @param options.retain   {Boolean} retain flag
 * @constructor
 */
export declare class ConditionInfo {
    message: LocalizedText | null;
    quality: StatusCode | null;
    severity: UInt16 | null;
    retain: boolean | null;
    constructor(options: ConditionInfoOptions);
}
