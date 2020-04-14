/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { UAVariable, UAVariableT } from "../../source";
import { NamespacePrivate } from "../namespace_private";
import { DeviationStuff } from "./deviation_alarm_helper";
import { UANonExclusiveLimitAlarm } from "./ua_non_exclusive_limit_alarm";
export interface UANonExclusiveDeviationAlarm extends UANonExclusiveLimitAlarm {
    setpointNode: UAVariableT<NodeId>;
    setpointNodeNode: UAVariable;
}
/**
 * @class UANonExclusiveDeviationAlarm
 * @extends UANonExclusiveLimitAlarm
 * @constructor
 */
export declare class UANonExclusiveDeviationAlarm extends UANonExclusiveLimitAlarm implements DeviationStuff {
    static instantiate(namespace: NamespacePrivate, type: string | NodeId, options: any, data: any): UANonExclusiveDeviationAlarm;
    _setStateBasedOnInputValue(value: number): void;
    getSetpointNodeNode(): UAVariable;
    getSetpointValue(): number | null;
    _onSetpointDataValueChange(dataValue: DataValue): void;
    _install_setpoint(options: any): any;
}
