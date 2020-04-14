/// <reference types="node" />
import { ByteString } from "node-opcua-basic-types";
import { LocalizedText, LocalizedTextLike } from "node-opcua-data-model";
import { NodeId } from "node-opcua-nodeid";
import { StatusCode } from "node-opcua-status-code";
import { TimeZoneDataType } from "node-opcua-types";
import { DataType, VariantLike } from "node-opcua-variant";
import { Namespace, SessionContext, UAEventType, UAMethod, UAVariableT } from "../../source";
import { ConditionInfoOptions } from "../../source/interfaces/alarms_and_conditions/condition_info_i";
import { AddressSpacePrivate } from "../address_space_private";
import { UAObject } from "../ua_object";
import { UATwoStateVariable } from "../ua_two_state_variable";
import { UAVariable } from "../ua_variable";
import { BaseEventType } from "./base_event_type";
import { ConditionSnapshot } from "./condition_snapshot";
export interface UAConditionBase extends BaseEventType {
    on(eventName: string, eventHandler: (...args: any[]) => void): this;
    on(eventName: "addComment", eventHandler: (eventId: Buffer | null, comment: LocalizedText, branch: ConditionSnapshot) => void): this;
    on(eventName: "branch_deleted", eventHandler: (branchId: string) => void): this;
}
export interface UAConditionBase {
    enabledState: UATwoStateVariable;
    receiveTime: UAVariableT<Date>;
    localTime: UAVariableT<DataType.ExtensionObject>;
    message: UAVariableT<DataType.LocalizedText>;
    severity: UAVariableT<DataType.UInt16>;
    time: UAVariableT<DataType.DateTime>;
    branchId: UAVariableT<DataType.NodeId>;
    eventType: UAVariableT<NodeId>;
    conditionClassId: UAVariableT<DataType.NodeId>;
    conditionClassName: UAVariableT<DataType.LocalizedText>;
    conditionName: UAVariableT<DataType.String>;
    quality: UAConditionVariable<DataType.StatusCode>;
    comment: UAConditionVariable<DataType.LocalizedText>;
    lastSeverity: UAConditionVariable<DataType.StatusCode>;
    retain: UAVariableT<DataType.Boolean>;
    enable: UAMethod;
    disable: UAMethod;
    addComment: UAMethod;
}
/**
 * @class UAConditionBase
 * @constructor
 * @extends BaseEventType
 *
 *
 *   └─ ConditionType
 *    ├─ DialogConditionType
 *    └─ AcknowledgeableConditionType
 *       └─ AlarmConditionType
 *          ├─ LimitAlarmType
 *          │  ├─ ExclusiveLimitAlarmType
 *          │  │  ├─ ExclusiveLevelAlarmType
 *          │  │  ├─ ExclusiveDeviationAlarmType
 *          │  │  └─ ExclusiveRateOfChangeAlarmType
 *          │  └─ NonExclusiveLimitAlarmType
 *          │     ├─ NonExclusiveLevelAlarmType
 *          │     ├─ NonExclusiveDeviationAlarmType
 *          │     └─ NonExclusiveRateOfChangeAlarmType
 *          └─ DiscreteAlarmType
 *             ├─ OffNormalAlarmType
 *             │  ├─ SystemOffNormalAlarmType
 *             │  │  └─ CertificateExpirationAlarmType
 *             │  └─ TripAlarmType
 *
 */
export declare class UAConditionBase extends BaseEventType {
    static defaultSeverity: number;
    static typeDefinition: NodeId;
    static instantiate(namespace: Namespace, conditionTypeId: NodeId | string | UAEventType, options: any, data: any): UAConditionBase;
    static install_condition_refresh_handle(addressSpace: AddressSpacePrivate): void;
    /**
     *
     * Helper method to handle condition methods that takes a branchId and a comment
     *
     */
    static with_condition_method(inputArguments: VariantLike[], context: SessionContext, callback: (err: Error | null, result?: {
        statusCode: StatusCode;
    }) => void, inner_func: (eventId: ByteString, comment: LocalizedText, branch: ConditionSnapshot, conditionNode: UAConditionBase) => StatusCode): void;
    eventId: any;
    private _branch0;
    private _previousRetainFlag;
    private _branches;
    /**
     * @method initialize
     * @private
     */
    initialize(): void;
    /**
     * @method post_initialize
     * @private
     */
    post_initialize(): void;
    getBranchCount(): number;
    getBranches(): ConditionSnapshot[];
    getBranchIds(): NodeId[];
    /**
     * @method createBranch
     * @return {ConditionSnapshot}
     */
    createBranch(): ConditionSnapshot;
    /**
     *  @method deleteBranch
     *  @param branch {ConditionSnapshot}
     */
    deleteBranch(branch: ConditionSnapshot): void;
    /**
     * @method getEnabledState
     * @return {Boolean}
     */
    getEnabledState(): boolean;
    /**
     * @method getEnabledStateAsString
     * @return {String}
     */
    getEnabledStateAsString(): string;
    /**
     * @method _setEnabledState
     * @param requestedEnabledState {Boolean}
     * @return {StatusCode} StatusCodes.Good if successful or BadConditionAlreadyEnabled/BadConditionAlreadyDisabled
     * @private
     */
    _setEnabledState(requestedEnabledState: boolean): StatusCode;
    /**
     *
     * @method setEnabledState
     * @param requestedEnabledState {Boolean}
     * @private
     */
    setEnabledState(requestedEnabledState: boolean): StatusCode;
    /**
     * @method setReceiveTime
     * @param time {Date}
     */
    setReceiveTime(time: Date): void;
    /**
     * @method setLocalTime (optional)
     * @param time
     */
    setLocalTime(time: TimeZoneDataType): void;
    /**
     * @method setTime
     * @param time {Date}
     */
    setTime(time: Date): void;
    _assert_valid(): void;
    /**
     * @method conditionOfNode
     * @return {UAObject}
     */
    conditionOfNode(): UAObject | UAVariable | null;
    /**
     * @method raiseConditionEvent
     * Raise a Instance Event
     * (see also UAObject#raiseEvent to raise a transient event)
     * @param branch the condition branch to raise
     * @param renewEventId true if event Id of the condition branch should be renewed
     */
    raiseConditionEvent(branch: ConditionSnapshot, renewEventId: boolean): void;
    /**
     *
     * @method raiseNewCondition
     * @param conditionInfo {ConditionInfo}
     *
     */
    raiseNewCondition(conditionInfo: ConditionInfoOptions): void;
    raiseNewBranchState(branch: ConditionSnapshot): void;
    /**
     * @method currentBranch
     * @return {ConditionSnapshot}
     */
    currentBranch(): ConditionSnapshot;
    _resend_conditionEvents(): 1 | 0;
    /**
     * @method _raiseAuditConditionCommentEvent
     * @param sourceName {string}
     * @param eventId    {Buffer}
     * @param comment    {LocalizedText}
     * @private
     */
    _raiseAuditConditionCommentEvent(sourceName: string, eventId: Buffer, comment: LocalizedTextLike): void;
    protected _findBranchForEventId(eventId: Buffer): ConditionSnapshot | null;
    protected evaluateConditionsAfterEnabled(): void;
}
interface UAConditionVariable<T> extends UAVariableT<T> {
    sourceTimestamp: UAVariableT<DataType.DateTime>;
}
export {};
