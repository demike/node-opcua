import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { UAEventType } from "../../source";
import { NamespacePrivate } from "../namespace_private";
import { UATwoStateVariable } from "../ua_two_state_variable";
import { UAVariable } from "../ua_variable";
import { UAAlarmConditionBase } from "./ua_alarm_condition_base";
export interface UALimitAlarm extends UAAlarmConditionBase {
    highHighLimit?: UAVariable;
    highLimit?: UAVariable;
    lowLimit?: UAVariable;
    lowLowLimit?: UAVariable;
    activeState: UATwoStateVariable;
}
export declare class UALimitAlarm extends UAAlarmConditionBase {
    /**
     * @method (static)UALimitAlarm.instantiate
     * @param namespace {Namespace}
     * @param limitAlarmTypeId
     * @param options
     * @param options.inputNode
     * @param options.optionals
     * @param options.highHighLimit {Double}
     * @param options.highLimit     {Double}
     * @param options.lowLimit      {Double}
     * @param options.lowLowLimit   {Double}
     * @param data
     * @return {UALimitAlarm}
     */
    static instantiate(namespace: NamespacePrivate, limitAlarmTypeId: UAEventType | NodeId | string, options: any, data: any): UALimitAlarm;
    _dataType: any;
    /**
     * @method getHighHighLimit
     * @return {Number}
     */
    getHighHighLimit(): number;
    /**
     * @method getHighLimit
     * @return {Number}
     */
    getHighLimit(): number;
    /**
     * @method getLowLimit
     * @return {Float}
     */
    getLowLimit(): number;
    /**
     * @method getLowLowLimit
     * @return {Float}
     */
    getLowLowLimit(): number;
    /**
     * @method setHighHighLimit
     * @param value {Float}
     */
    setHighHighLimit(value: number): void;
    /**
     * @method setHighLimit
     * @param value {Float}
     */
    setHighLimit(value: number): void;
    /**
     * @method setLowLimit
     * @param value {Float}
     */
    setLowLimit(value: number): void;
    /**
     * @method setLowLowLimit
     * @param value {Float}
     */
    setLowLowLimit(value: number): void;
    _onInputDataValueChange(dataValue: DataValue): void;
    protected _setStateBasedOnInputValue(value: number): void;
    protected _watchLimits(): void;
    protected evaluateConditionsAfterEnabled(): void;
}
