/// <reference types="node" />
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
import { EventEmitter } from "events";
import { UInt16 } from "node-opcua-basic-types";
import { LocalizedText, LocalizedTextLike } from "node-opcua-data-model";
import { NodeId } from "node-opcua-nodeid";
import { StatusCode } from "node-opcua-status-code";
import { SimpleAttributeOperand, TimeZoneDataType } from "node-opcua-types";
import { DataType, Variant } from "node-opcua-variant";
import { UtcTime } from "../../source";
import { EventData } from "../event_data";
import { UAVariable } from "../ua_variable";
import { UAConditionBase } from "./ua_condition_base";
export interface ConditionSnapshot {
    on(eventName: "value_changed", eventHandler: (node: UAVariable, variant: Variant) => void): this;
}
declare function normalizeName(str: string): string;
export declare class ConditionSnapshot extends EventEmitter {
    static normalizeName: typeof normalizeName;
    condition: UAConditionBase;
    eventData: any;
    branchId: NodeId | null;
    private _map;
    private _node_index;
    private _need_event_raise;
    /**
     * @class ConditionSnapshot
     * @extends EventEmitter
     * @param condition
     * @param branchId
     * @constructor
     */
    constructor(condition: UAConditionBase, branchId: NodeId);
    _constructEventData(): EventData;
    /**
     * @method resolveSelectClause
     * @param selectClause {SelectClause}
     */
    resolveSelectClause(selectClause: any): any;
    /**
     *
     */
    readValue(nodeId: NodeId, selectClause: SimpleAttributeOperand): any;
    _get_var(varName: string, dataType: DataType): any;
    _set_var(varName: string, dataType: DataType, value: any): void;
    /**
     * @method getBrandId
     * @return {NodeId}
     */
    getBranchId(): NodeId;
    /**
     * @method getEventId
     * @return {ByteString}
     */
    getEventId(): Buffer;
    /**
     * @method getRetain
     * @return {Boolean}
     */
    getRetain(): boolean;
    /**
     *
     * @method setRetain
     * @param retainFlag {Boolean}
     */
    setRetain(retainFlag: boolean): void;
    /**
     * @method renewEventId
     *
     */
    renewEventId(): void;
    /**
     * @method getEnabledState
     * @return {Boolean}
     */
    getEnabledState(): boolean;
    /**
     * @method setEnabledState
     * @param value {Boolean}
     * @return void
     */
    setEnabledState(value: boolean): void;
    /**
     * @method getEnabledStateAsString
     * @return {String}
     */
    getEnabledStateAsString(): string;
    /**
     * @method getComment
     * @return {LocalizedText}
     */
    getComment(): LocalizedText;
    /**
     * Set condition comment
     *
     * Comment contains the last comment provided for a certain state (ConditionBranch). It may
     * have been provided by an AddComment Method, some other Method or in some other
     * manner. The initial value of this Variable is null, unless it is provided in some other manner. If
     * a Method provides as an option the ability to set a Comment, then the value of this Variable is
     * reset to null if an optional comment is not provided.
     *
     * @method setComment
     * @param txtMessage {LocalizedText}
     */
    setComment(txtMessage: LocalizedTextLike): void;
    /**
     *
     * @method setMessage
     * @param txtMessage {LocalizedText}
     */
    setMessage(txtMessage: LocalizedTextLike | LocalizedText): void;
    /**
     * @method setClientUserId
     * @param userIdentity {String}
     */
    setClientUserId(userIdentity: string): void;
    /**
     * set the condition quality
     * @method setQuality
     * @param quality {StatusCode}
     */
    setQuality(quality: StatusCode): void;
    /**
     * @method getQuality
     * @return {StatusCode}
     */
    getQuality(): StatusCode;
    /**
     * @method setSeverity
     * @param severity {UInt16}
     */
    setSeverity(severity: UInt16): void;
    /**
     * @method getSeverity
     * @return {UInt16}
     */
    getSeverity(): UInt16;
    /**
     * @method setLastSeverity
     * @param severity {UInt16}
     */
    setLastSeverity(severity: UInt16): void;
    /**
     * @method getLastSeverity
     * @return {UInt16}
     */
    getLastSeverity(): UInt16;
    /**
     * setReceiveTime
     *
     * (as per OPCUA 1.0.3 part 5)
     *
     * ReceiveTime provides the time the OPC UA Server received the Event from the underlying
     * device of another Server.
     *
     * ReceiveTime is analogous to ServerTimestamp defined in Part 4, i.e.
     * in the case where the OPC UA Server gets an Event from another OPC UA Server, each Server
     * applies its own ReceiveTime. That implies that a Client may get the same Event, having the
     * same EventId, from different Servers having different values of the ReceiveTime.
     *
     * The ReceiveTime shall always be returned as value and the Server is not allowed to return a
     * StatusCode for the ReceiveTime indicating an error.
     *
     * @method setReceiveTime
     * @param time {Date} : UTCTime
     */
    setReceiveTime(time: UtcTime): void;
    /**
     * (as per OPCUA 1.0.3 part 5)
     * Time provides the time the Event occurred. This value is set as close to the event generator as
     * possible. It often comes from the underlying system or device. Once set, intermediate OPC UA
     * Servers shall not alter the value.
     *
     * @method setTime
     * @param time {Date}
     */
    setTime(time: Date): void;
    /**
     * LocalTime is a structure containing the Offset and the DaylightSavingInOffset flag. The Offset
     * specifies the time difference (in minutes) between the Time Property and the time at the location
     * in which the event was issued. If DaylightSavingInOffset is TRUE, then Standard/Daylight
     * savings time (DST) at the originating location is in effect and Offset includes the DST c orrection.
     * If FALSE then the Offset does not include DST correction and DST may or may not have been
     * in effect.
     * @method setLocalTime
     * @param localTime {TimeZone}
     */
    setLocalTime(localTime: TimeZoneDataType): void;
    getSourceName(): LocalizedText;
    /**
     * @method getSourceNode
     * return {NodeId}
     */
    getSourceNode(): NodeId;
    /**
     * @method getEventType
     * return {NodeId}
     */
    getEventType(): NodeId;
    getMessage(): LocalizedText;
    isCurrentBranch(): boolean;
    getAckedState(): boolean;
    setAckedState(ackedState: boolean): import("node-opcua-status-code").ConstantStatusCode;
    getConfirmedState(): boolean;
    setConfirmedStateIfExists(confirmedState: boolean): void;
    setConfirmedState(confirmedState: boolean): void;
    /**
     * @class ConditionSnapshot
     */
    /**
     * @method getSuppressedState
     * @return {Boolean}
     */
    getSuppressedState(): boolean;
    /**
     * @method setSuppressedState
     * @param suppressed {Boolean}
     */
    setSuppressedState(suppressed: boolean): void;
    getActiveState(): boolean;
    setActiveState(newActiveState: boolean): StatusCode;
    setShelvingState(state: any): void;
    toString(): string;
    /**
     * @class ConditionSnapshot
     * @param varName
     * @param value
     * @private
     */
    _set_twoStateVariable(varName: string, value: any): void;
    protected _get_twoStateVariable(varName: string): any;
}
export {};
