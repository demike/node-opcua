import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { Namespace, UAVariable } from "../../source";
import { UADiscreteAlarm } from "./ua_discrete_alarm";
export interface UAOffNormalAlarm extends UADiscreteAlarm {
    normalState: UAVariable;
}
/**
 * The OffNormalAlarmType is a specialization of the DiscreteAlarmType intended to represent a
 * discrete Condition that is considered to be not normal.
 * This sub type is usually used to indicate that a discrete value is in an Alarm state, it is active as
 * long as a non-normal value is present.
 *
 * @class UAOffNormalAlarm
 * @extends UADiscreteAlarm
 * @constructor
 *
 *
 */
export declare class UAOffNormalAlarm extends UADiscreteAlarm {
    /**
     * @method (static)UAOffNormalAlarm.instantiate
     * @param namespace {Namespace}
     * @param limitAlarmTypeId
     * @param options
     * @param options.inputNode   {NodeId|UAVariable} the input node
     * @param options.normalState {NodeId|UAVariable} the normalStateNode node
     * @param data
     *
     * When the value of inputNode doesn't match the normalState node value, then the alarm is raised.
     *
     */
    static instantiate(namespace: Namespace, limitAlarmTypeId: string | NodeId, options: any, data: any): UAOffNormalAlarm;
    getNormalStateNode(): UAVariable;
    /**
     * @method getNormalStateValue
     */
    getNormalStateValue(): any;
    /**
     * @method setNormalStateValue
     * @param value
     */
    setNormalStateValue(value: any): void;
    _updateAlarmState(normalStateValue?: any, inputValue?: any): void;
    _onInputDataValueChange(dataValue: DataValue): void;
    protected _onNormalStateDataValueChange(dataValue: DataValue): void;
}
