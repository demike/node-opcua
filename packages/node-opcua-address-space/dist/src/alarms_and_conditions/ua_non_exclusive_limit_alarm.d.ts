import { NodeId } from "node-opcua-nodeid";
import { UAEventType } from "../../source";
import { NamespacePrivate } from "../namespace_private";
import { UATwoStateVariable } from "../ua_two_state_variable";
import { ConditionInfo } from "./condition_info";
import { UALimitAlarm } from "./ua_limit_alarm";
export interface UANonExclusiveLimitAlarm {
    /**
     * @property lowLowState
     * @type UATwoStateVariable
     */
    lowLowState: UATwoStateVariable;
    /**
     * @property lowState
     * @type UATwoStateVariable
     */
    lowState: UATwoStateVariable;
    /**
     * @property highState
     * @type UATwoStateVariable
     */
    highState: UATwoStateVariable;
    /**
     * @property highHighState
     * @type UATwoStateVariable
     */
    highHighState: UATwoStateVariable;
}
/***
 * @class  UANonExclusiveLimitAlarm
 * @extends UALimitAlarm
 * @constructor
 */
export declare class UANonExclusiveLimitAlarm extends UALimitAlarm {
    /**
     * @method (static)instantiate
     * @param namespace {Namespace}
     * @param type
     * @param options
     * @param data
     * @return {UANonExclusiveLimitAlarm}
     */
    static instantiate(namespace: NamespacePrivate, type: UAEventType | NodeId | string, options: any, data: any): UANonExclusiveLimitAlarm;
    _calculateConditionInfo(states: any, isActive: boolean, value: any, oldConditionInfo: any): ConditionInfo;
    _signalNewCondition(states: any, isActive: boolean, value: any): void;
    protected _setStateBasedOnInputValue(value: number): void;
}
