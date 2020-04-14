/// <reference types="node" />
import { LocalizedText, LocalizedTextLike } from "node-opcua-data-model";
import { NodeId } from "node-opcua-nodeid";
import { Namespace, UAEventType } from "../../source";
import { AddressSpacePrivate } from "../address_space_private";
import { UAMethod } from "../ua_method";
import { UATwoStateVariable } from "../ua_two_state_variable";
import { ConditionSnapshot } from "./condition_snapshot";
import { UAConditionBase } from "./ua_condition_base";
export interface UAAcknowledgeableConditionBase extends UAConditionBase {
    ackedState: UATwoStateVariable;
    acknowledge: UAMethod;
    confirmedState?: UATwoStateVariable;
    confirm?: UAMethod;
}
export interface UAAcknowledgeableConditionBase extends UAConditionBase {
    on(eventName: string, eventHandler: (...args: any[]) => void): this;
    on(eventName: "acknowledged" | "confirmed", eventHandler: (eventId: Buffer | null, comment: LocalizedText, branch: ConditionSnapshot) => void): this;
}
/**
 * @class UAAcknowledgeableConditionBase
 * @constructor
 * @extends UAConditionBase
 */
export declare class UAAcknowledgeableConditionBase extends UAConditionBase {
    /**
     */
    static instantiate(namespace: Namespace, conditionTypeId: UAEventType | NodeId | string, options: any, data: any): UAAcknowledgeableConditionBase;
    static install_method_handle_on_type(addressSpace: AddressSpacePrivate): void;
    _raiseAuditConditionAcknowledgeEvent(branch: ConditionSnapshot): void;
    _raiseAuditConditionConfirmEvent(branch: ConditionSnapshot): void;
    _acknowledge_branch(eventId: Buffer, comment: string | LocalizedTextLike | LocalizedText, branch: ConditionSnapshot, message: string): import("node-opcua-status-code").ConstantStatusCode;
    /**
     * @method _confirm_branch
     * @param eventId
     * @param comment
     * @param branch
     * @param message
     * @private
     */
    _confirm_branch(eventId: Buffer, comment: string | LocalizedTextLike, branch: ConditionSnapshot, message: string): any;
    /**
     * @method autoConfirmBranch
     * @param branch
     * @param comment
     */
    autoConfirmBranch(branch: ConditionSnapshot, comment: LocalizedTextLike): void;
    /**
     * @method acknowledgeAndAutoConfirmBranch
     * @param branch {ConditionSnapshot}
     * @param comment {String|LocalizedText}
     */
    acknowledgeAndAutoConfirmBranch(branch: ConditionSnapshot, comment: string | LocalizedTextLike | LocalizedText): void;
}
