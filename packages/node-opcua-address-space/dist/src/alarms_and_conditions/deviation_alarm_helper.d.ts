import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { BaseNode, UAVariable, UAVariableT } from "../../source";
export interface DeviationStuff extends BaseNode {
    setpointNode: UAVariableT<NodeId>;
    setpointNodeNode: UAVariable;
    _onSetpointDataValueChange(dataValue: DataValue): void;
    _setStateBasedOnInputValue(value: any): void;
    getSetpointNodeNode(): UAVariable;
    getInputNodeValue(): any;
}
export declare function DeviationAlarmHelper_getSetpointNodeNode(this: DeviationStuff): UAVariable;
export declare function DeviationAlarmHelper_getSetpointValue(this: DeviationStuff): number | null;
export declare function DeviationAlarmHelper_onSetpointDataValueChange(this: DeviationStuff, dataValue: DataValue): void;
export declare function DeviationAlarmHelper_install_setpoint(this: DeviationStuff, options: any): void;
