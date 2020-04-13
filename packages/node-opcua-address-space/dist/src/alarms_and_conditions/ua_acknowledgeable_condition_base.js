"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const ua_two_state_variable_1 = require("../ua_two_state_variable");
const condition_1 = require("./condition");
const condition_snapshot_1 = require("./condition_snapshot");
const ua_condition_base_1 = require("./ua_condition_base");
/**
 * @class UAAcknowledgeableConditionBase
 * @constructor
 * @extends UAConditionBase
 */
class UAAcknowledgeableConditionBase extends ua_condition_base_1.UAConditionBase {
    /**
     */
    static instantiate(namespace, conditionTypeId, options, data) {
        const conditionNode = ua_condition_base_1.UAConditionBase.instantiate(namespace, conditionTypeId, options, data);
        Object.setPrototypeOf(conditionNode, UAAcknowledgeableConditionBase.prototype);
        // ----------------------- Install Acknowledge-able Condition stuff
        // install ackedState - Mandatory
        /**
         * @property ackedState
         * @type TwoStateVariable
         */
        ua_two_state_variable_1._install_TwoStateVariable_machinery(conditionNode.ackedState, {
            falseState: "Unacknowledged",
            trueState: "Acknowledged"
        });
        /**
         * @property acknowledge
         * @type UAMethod
         */
        conditionNode.acknowledge.bindMethod(_acknowledge_method);
        // install confirmedState - Optional
        /**
         * @property confirmedState
         * @type TwoStateVariable
         */
        if (conditionNode.confirmedState) {
            ua_two_state_variable_1._install_TwoStateVariable_machinery(conditionNode.confirmedState, {
                falseState: "Unconfirmed",
                trueState: "Confirmed"
            });
        }
        // install confirm Method - Optional
        /**
         * @property confirm
         * @type UAMethod
         */
        if (conditionNode.confirm) {
            conditionNode.confirm.bindMethod(_confirm_method);
        }
        node_opcua_assert_1.assert(conditionNode instanceof UAAcknowledgeableConditionBase);
        return conditionNode;
    }
    static install_method_handle_on_type(addressSpace) {
        const acknowledgeableConditionType = addressSpace.findEventType("AcknowledgeableConditionType");
        node_opcua_assert_1.assert(acknowledgeableConditionType !== null);
        acknowledgeableConditionType.acknowledge.bindMethod(_acknowledge_method);
        acknowledgeableConditionType.confirm.bindMethod(_confirm_method);
    }
    // public _populate_EventData(eventData: any) {
    //     super._populate_EventData(eventData);
    //     this._populate_EventData_with_AcknowledgeableConditionTypeElements(eventData);
    // }
    //
    // public _populate_EventData_with_AcknowledgeableConditionTypeElements(eventData: any) {
    //     const self = this;
    //     const data = {
    //         // -----------------------------------------------------------
    //         // AcknowledgeableConditionType
    //         // -----------------------------------------------------------
    //         ackedState: self.ackedState.readValue().value,
    //         confirmedState: self.confirmedState ? self.confirmedState.readValue().value : null
    //     };
    //     eventData = _.extend(eventData, data);
    // }
    _raiseAuditConditionAcknowledgeEvent(branch) {
        // raise the AuditConditionAcknowledgeEventType
        const eventData = {
            actionTimeStamp: { dataType: node_opcua_variant_1.DataType.DateTime, value: new Date() },
            // xx branchId: branch.branchId.readValue().value,
            // AuditEventType
            clientAuditEntryId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            clientUserId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            comment: { dataType: node_opcua_variant_1.DataType.LocalizedText, value: branch.getComment() },
            // EventType
            eventId: { dataType: node_opcua_variant_1.DataType.ByteString, value: branch.getEventId() },
            inputArguments: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            methodId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            serverId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            status: {
                dataType: node_opcua_variant_1.DataType.StatusCode,
                value: node_opcua_status_code_1.StatusCodes.Good
            }
        };
        this.raiseEvent("AuditConditionAcknowledgeEventType", eventData);
    }
    _raiseAuditConditionConfirmEvent(branch) {
        // raise the AuditConditionConfirmEventType
        const eventData = {
            actionTimeStamp: { dataType: node_opcua_variant_1.DataType.DateTime, value: new Date() },
            // EventType
            eventId: { dataType: node_opcua_variant_1.DataType.ByteString, value: branch.getEventId() },
            // xx branchId: branch.branchId.readValue().value,
            // AuditEventType
            clientAuditEntryId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            clientUserId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            comment: { dataType: node_opcua_variant_1.DataType.LocalizedText, value: branch.getComment() },
            inputArguments: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            methodId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            serverId: {
                dataType: node_opcua_variant_1.DataType.Null
            },
            status: {
                dataType: node_opcua_variant_1.DataType.StatusCode,
                value: node_opcua_status_code_1.StatusCodes.Good
            }
        };
        this.raiseEvent("AuditConditionConfirmEventType", eventData);
    }
    _acknowledge_branch(eventId, comment, branch, message) {
        node_opcua_assert_1.assert(typeof (message) === "string");
        const conditionNode = this;
        const statusCode = condition_1._setAckedState(branch, true, eventId, comment);
        if (statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            return statusCode;
        }
        if (conditionNode.confirmedState) {
            // alarm has a confirmed state !
            // we should be waiting for confirmation now
            branch.setConfirmedState(false);
            branch.setRetain(true);
        }
        else {
            branch.setRetain(false);
        }
        branch.setComment(comment);
        conditionNode.raiseNewBranchState(branch);
        // xx conditionNode._raiseAuditConditionCommentEvent("Method/Acknowledge",eventId,comment);
        conditionNode._raiseAuditConditionAcknowledgeEvent(branch);
        /**
         * @event acknowledged
         * @param  eventId   {Buffer|null}
         * @param  comment   {LocalizedText}
         * @param  branch    {ConditionSnapshot}
         * raised when the alarm branch has been acknowledged
         */
        conditionNode.emit("acknowledged", eventId, comment, branch);
        return node_opcua_status_code_1.StatusCodes.Good;
    }
    /**
     * @method _confirm_branch
     * @param eventId
     * @param comment
     * @param branch
     * @param message
     * @private
     */
    _confirm_branch(eventId, comment, branch, message) {
        node_opcua_assert_1.assert(typeof (message) === "string");
        node_opcua_assert_1.assert(comment instanceof node_opcua_data_model_1.LocalizedText);
        const conditionNode = this;
        // xx var eventId = branch.getEventId();
        node_opcua_assert_1.assert(branch.getEventId().toString("hex") === eventId.toString("hex"));
        branch.setConfirmedState(true);
        // once confirmed a branch do not need to be retained
        branch.setRetain(false);
        branch.setComment(comment);
        conditionNode._raiseAuditConditionCommentEvent(message, eventId, comment);
        conditionNode._raiseAuditConditionConfirmEvent(branch);
        conditionNode.raiseNewBranchState(branch);
        /**
         * @event confirmed
         * @param  eventId
         * @param  comment
         * @param  eventId
         * raised when the alarm branch has been confirmed
         */
        conditionNode.emit("confirmed", eventId, comment, branch);
    }
    /**
     * @method autoConfirmBranch
     * @param branch
     * @param comment
     */
    autoConfirmBranch(branch, comment) {
        node_opcua_assert_1.assert(branch instanceof condition_snapshot_1.ConditionSnapshot);
        if (!this.confirmedState) {
            // no confirmedState => ignoring
            return;
        }
        node_opcua_assert_1.assert(!branch.getConfirmedState(), "already confirmed ?");
        const conditionNode = this;
        const eventId = branch.getEventId();
        // tslint:disable-next-line:no-console
        console.log("autoConfirmBranch getAckedState ", branch.getAckedState());
        conditionNode._confirm_branch(eventId, comment, branch, "Server/Confirm");
    }
    /**
     * @method acknowledgeAndAutoConfirmBranch
     * @param branch {ConditionSnapshot}
     * @param comment {String|LocalizedText}
     */
    acknowledgeAndAutoConfirmBranch(branch, comment) {
        comment = node_opcua_data_model_1.LocalizedText.coerce(comment);
        const eventId = branch.getEventId();
        branch.setRetain(false);
        this._acknowledge_branch(eventId, comment, branch, "Server/Acknowledge");
        this.autoConfirmBranch(branch, comment);
    }
}
exports.UAAcknowledgeableConditionBase = UAAcknowledgeableConditionBase;
function _acknowledge_method(inputArguments, context, callback) {
    ua_condition_base_1.UAConditionBase.with_condition_method(inputArguments, context, callback, (eventId, comment, branch, conditionNode) => {
        const ackConditionNode = conditionNode;
        // precondition checking
        node_opcua_assert_1.assert(!eventId || eventId instanceof Buffer, "must have a valid eventId or  null");
        node_opcua_assert_1.assert(comment instanceof node_opcua_data_model_1.LocalizedText, "expecting a comment as LocalizedText");
        node_opcua_assert_1.assert(conditionNode instanceof UAAcknowledgeableConditionBase);
        ackConditionNode._acknowledge_branch(eventId, comment, branch, "Method/Acknowledged");
        return node_opcua_status_code_1.StatusCodes.Good;
    });
}
/*
 *
 * param inputArguments {Variant[]}
 * param context        {Object}
 * param callback       {Function}
 *
 * @private
 */
function _confirm_method(inputArguments, context, callback) {
    ua_condition_base_1.UAConditionBase.with_condition_method(inputArguments, context, callback, (eventId, comment, branch, conditionNode) => {
        node_opcua_assert_1.assert(eventId instanceof Buffer);
        node_opcua_assert_1.assert(branch.getEventId() instanceof Buffer);
        node_opcua_assert_1.assert(branch.getEventId().toString("hex") === eventId.toString("hex"));
        const ackConditionNode = conditionNode;
        if (branch.getConfirmedState()) {
            return node_opcua_status_code_1.StatusCodes.BadConditionBranchAlreadyConfirmed;
        }
        ackConditionNode._confirm_branch(eventId, comment, branch, "Method/Confirm");
        return node_opcua_status_code_1.StatusCodes.Good;
    });
}
//# sourceMappingURL=ua_acknowledgeable_condition_base.js.map