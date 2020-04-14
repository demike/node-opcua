import { NodeId } from "node-opcua-nodeid";
import { Namespace, UAEventType } from "../../source";
import { UAAlarmConditionBase } from "./ua_alarm_condition_base";
/**
 * The DiscreteAlarmType is used to classify Types into Alarm Conditions where the input for the
 * Alarm may take on only a certain number of possible values (e.g. true/false,
 * running/stopped/terminating).
 */
export declare class UADiscreteAlarm extends UAAlarmConditionBase {
    static instantiate(namespace: Namespace, discreteAlarmTypeId: UAEventType | NodeId | string, options: any, data: any): UADiscreteAlarm;
}
