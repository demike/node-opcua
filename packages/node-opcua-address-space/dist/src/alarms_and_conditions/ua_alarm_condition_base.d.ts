import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { Namespace, UAEventType, UAVariableT } from "../../source";
import { BaseNode } from "../base_node";
import { UATwoStateVariable } from "../ua_two_state_variable";
import { UAVariable } from "../ua_variable";
import { ConditionInfo } from "./condition_info";
import { ShelvingStateMachine } from "./shelving_state_machine";
import { UAAcknowledgeableConditionBase } from "./ua_acknowledgeable_condition_base";
export interface UAAlarmConditionBase {
    activeState: UATwoStateVariable;
    shelvingState: ShelvingStateMachine;
    suppressedState: UATwoStateVariable;
    suppressedOrShelved: UAVariable;
    maxTimeShelved: UAVariable;
    inputNode: UAVariableT<NodeId>;
}
/**
 * @class UAAlarmConditionBase
 * @constructor
 * @extends UAAcknowledgeableConditionBase
 */
export declare class UAAlarmConditionBase extends UAAcknowledgeableConditionBase {
    /**
     * @class UAAlarmConditionBase
     * @static
     * @property MaxDuration
     * @type {Duration}
     */
    static MaxDuration: number;
    /**
     * @method (static)UAAlarmConditionBase.instantiate
     * @param namespace {Namespace}
     * @param alarmConditionTypeId
     * @param options
     * @param options.inputNode
     * @param options.optionals  could be "SuppressedState" , "ShelvingState"
     * @param options.maxTimeShelved  max TimeShelved duration (in ms)
     * @param data
     */
    static instantiate(namespace: Namespace, alarmConditionTypeId: UAEventType | string | NodeId, options: any, data: any): UAAlarmConditionBase;
    dispose(): void;
    /**
     * @method activateAlarm
     */
    activateAlarm(): void;
    /**
     * @method desactivateAlarm
     */
    desactivateAlarm(): void;
    /**
     * @method isSuppressedOrShelved
     * @return {boolean}
     */
    isSuppressedOrShelved(): boolean;
    /**
     * @method getSuppressedOrShelved
     * @return {Boolean}
     */
    getSuppressedOrShelved(): boolean;
    /**
     * @method setMaxTimeShelved
     * @param duration  ( Duration in Milliseconds)
     *
     * note: duration must be greater than 10ms and lesser than 2**31 ms
     */
    setMaxTimeShelved(duration: number): void;
    /**
     * @method getMaxTimeShelved
     * @return {Duration}
     */
    getMaxTimeShelved(): number;
    /**
     * @method getInputNodeNode
     * @return {BaseNode} return the node in the address space pointed by the inputNode value
     *
     * Note: please note the difference between alarm.inputNode
     *    *  alarm.inputNode is a UAVariable property of the alarm object holding the nodeid of the input
     *       node in its value.
     *    *  getInputNodeNode() is the UAVariable that contains the value that affects the state of the alarm and
     *       whose node id is stored in alarm.inputNode
     */
    getInputNodeNode(): UAVariable | null;
    /**
     * @method getInputNodeValue
     * @return {*}
     */
    getInputNodeValue(): any | null;
    updateState(): void;
    _onInputDataValueChange(newValue: DataValue): void;
    /**
     * @method _installInputNodeMonitoring
     * install mechanism that listen to input node datavalue changes so that alarm status
     * can be automatically updated appropriatly.
     * @param inputNode {BaseNode}
     * @return {void}
     * @protected
     */
    _installInputNodeMonitoring(inputNode: BaseNode | NodeId): void;
    getCurrentConditionInfo(): ConditionInfo;
    /***
     * @method  _calculateConditionInfo
     * @param stateData {Object}   the new calculated state of the alarm
     * @param isActive  {Boolean}
     * @param value     {Number}   the new value of the limit alarm
     * @param oldCondition  {ConditionInfo} given for information purpose
     * @param oldCondition.severity
     * @param oldCondition.quality
     * @param oldCondition.message
     * @param oldCondition.retain
     * @return {ConditionInfo} the new condition info
     *
     * this method need to be overridden by the instantiate to allow custom message and severity
     * to be set based on specific context of the alarm.
     *
     * @example
     *
     *
     *    var myAlarm = addressSpace.instantiateExclusiveLimitAlarm({...});
     *    myAlarm._calculateConditionInfo = function(stateName,value,oldCondition) {
     *       var percent = Math.ceil(value * 100);
     *       return new ConditionInfo({
     *            message: "Tank is almost " + percent + "% full",
     *            severity: 100,
     *            quality: StatusCodes.Good
     *      });
     *    };
     *
     */
    _calculateConditionInfo(stateData: any, isActive: boolean, value: any, oldCondition: ConditionInfo): ConditionInfo;
    _signalInitialCondition(): void;
    _signalNewCondition(stateName: string | null, isActive?: boolean, value?: any): void;
}
