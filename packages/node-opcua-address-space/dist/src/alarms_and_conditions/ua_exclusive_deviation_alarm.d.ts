import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { UAVariable, UAVariableT } from "../../source";
import { NamespacePrivate } from "../namespace_private";
import { DeviationStuff } from "./deviation_alarm_helper";
import { UAExclusiveLimitAlarm } from "./ua_exclusive_limit_alarm";
/**
 * @class UAExclusiveDeviationAlarm
 * @extends UAExclusiveLimitAlarm
 * @constructor
 */
export declare class UAExclusiveDeviationAlarm extends UAExclusiveLimitAlarm implements DeviationStuff {
    static instantiate(namespace: NamespacePrivate, type: string | NodeId, options: any, data: any): UAExclusiveDeviationAlarm;
    getSetpointNodeNode(): UAVariable;
    getSetpointValue(): any;
    _onSetpointDataValueChange(dataValue: DataValue): void;
    _install_setpoint(options: any): any;
    _setStateBasedOnInputValue(value: number): void;
}
export interface UAExclusiveDeviationAlarm {
    setpointNode: UAVariableT<NodeId>;
    setpointNodeNode: UAVariable;
}
