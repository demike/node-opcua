"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_variant_1 = require("node-opcua-variant");
const source_1 = require("../../source");
const base_node_1 = require("../base_node");
const ua_object_1 = require("../ua_object");
const ua_object_type_1 = require("../ua_object_type");
const ua_two_state_variable_1 = require("../ua_two_state_variable");
const base_event_type_1 = require("./base_event_type");
const condition_snapshot_1 = require("./condition_snapshot");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const errorLog = node_opcua_debug_1.make_errorLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
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
class UAConditionBase extends base_event_type_1.BaseEventType {
    constructor() {
        super(...arguments);
        this._branch0 = null;
        this._previousRetainFlag = false;
        this._branches = {};
    }
    static instantiate(namespace, conditionTypeId, options, data) {
        return UAConditionBase_instantiate(namespace, conditionTypeId, options, data);
    }
    static install_condition_refresh_handle(addressSpace) {
        //
        // install CondititionRefresh
        //
        // NOTE:
        // OPCUA doesn't implement the condition refresh method ! yet
        // .5.7 ConditionRefresh Method
        // ConditionRefresh allows a Client to request a Refresh of all Condition instances that currently
        // are in an interesting state (they have the Retain flag set). This includes previous states of a
        // Condition instance for which the Server maintains Branches. A Client would typically invoke
        // this Method when it initially connects to a Server and following any situations, such as
        // communication disruptions, in which it would require resynchronization with the Server. This
        // Method is only available on the ConditionType or its subtypes. To invoke this Method, the call
        // shall pass the well known MethodId of the Method on the ConditionType and the ObjectId
        // shall be the well known ObjectId of the ConditionType Object.
        const conditionType = addressSpace.findEventType("ConditionType");
        node_opcua_assert_1.assert(conditionType !== null);
        conditionType.disable.bindMethod(_disable_method);
        conditionType.enable.bindMethod(_enable_method);
        conditionType.conditionRefresh.bindMethod(_condition_refresh_method);
        conditionType.conditionRefresh2.bindMethod(_condition_refresh2_method);
        // those methods can be call on the ConditionType or on the ConditionInstance itself...
        conditionType.addComment.bindMethod(_add_comment_method);
    }
    /**
     *
     * Helper method to handle condition methods that takes a branchId and a comment
     *
     */
    static with_condition_method(inputArguments, context, callback, inner_func) {
        const conditionNode = context.object;
        // xx console.log(inputArguments.map(function(a){return a.toString()}));
        if (!(conditionNode instanceof UAConditionBase)) {
            callback(null, {
                statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdInvalid
            });
            return;
        }
        if (!conditionNode.getEnabledState()) {
            callback(null, {
                statusCode: node_opcua_status_code_1.StatusCodes.BadConditionDisabled
            });
            return;
        }
        // inputArguments has 2 arguments
        // EventId  => ByteString    The Identifier of the event to comment
        // Comment  => LocalizedText The Comment to add to the condition
        node_opcua_assert_1.assert(inputArguments.length === 2);
        node_opcua_assert_1.assert(inputArguments[0].dataType === node_opcua_variant_1.DataType.ByteString);
        node_opcua_assert_1.assert(inputArguments[1].dataType === node_opcua_variant_1.DataType.LocalizedText);
        const eventId = inputArguments[0].value;
        node_opcua_assert_1.assert(!eventId || eventId instanceof Buffer);
        const comment = inputArguments[1].value;
        node_opcua_assert_1.assert(comment instanceof node_opcua_data_model_1.LocalizedText);
        const branch = conditionNode._findBranchForEventId(eventId);
        if (!branch) {
            callback(null, {
                statusCode: node_opcua_status_code_1.StatusCodes.BadEventIdUnknown
            });
            return;
        }
        node_opcua_assert_1.assert(branch instanceof condition_snapshot_1.ConditionSnapshot);
        const statusCode = inner_func(eventId, comment, branch, conditionNode);
        // record also who did the call
        branch.setClientUserId(context.userIdentity || "<unknown client user id>");
        callback(null, {
            statusCode
        });
    }
    /**
     * @method initialize
     * @private
     */
    initialize() {
        this._branches = {};
    }
    /**
     * @method post_initialize
     * @private
     */
    post_initialize() {
        node_opcua_assert_1.assert(!this._branch0);
        this._branch0 = new condition_snapshot_1.ConditionSnapshot(this, node_opcua_nodeid_1.NodeId.nullNodeId);
        // the condition OPCUA object alway reflects the default branch states
        // so we set a mechanism that automatically keeps self in sync
        // with the default branch.
        // the implication of this convention is that interacting with the condition variable
        // shall be made by using branch0, any value change made
        // using the standard setValueFromSource mechanism will not be work properly.
        this._branch0.on("value_changed", (node, variant) => {
            node_opcua_assert_1.assert(node.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
            node.setValueFromSource(variant);
        });
    }
    getBranchCount() {
        return Object.keys(this._branches).length;
    }
    getBranches() {
        return Object.keys(this._branches).map((x) => {
            return this._branches[x];
        });
    }
    getBranchIds() {
        return this.getBranches().map((b) => b.getBranchId());
    }
    /**
     * @method createBranch
     * @return {ConditionSnapshot}
     */
    createBranch() {
        const branchId = _create_new_branch_id();
        const snapshot = new condition_snapshot_1.ConditionSnapshot(this, branchId);
        this._branches[branchId.toString()] = snapshot;
        return snapshot;
    }
    /**
     *  @method deleteBranch
     *  @param branch {ConditionSnapshot}
     */
    deleteBranch(branch) {
        const key = branch.getBranchId().toString();
        node_opcua_assert_1.assert(branch.getBranchId() !== node_opcua_nodeid_1.NodeId.nullNodeId, "cannot delete branch zero");
        node_opcua_assert_1.assert(this._branches.hasOwnProperty(key));
        delete this._branches[key];
        this.emit("branch_deleted", key);
    }
    /**
     * @method getEnabledState
     * @return {Boolean}
     */
    getEnabledState() {
        return this.enabledState.getValue();
    }
    /**
     * @method getEnabledStateAsString
     * @return {String}
     */
    getEnabledStateAsString() {
        return this.enabledState.getValueAsString();
    }
    /**
     * @method _setEnabledState
     * @param requestedEnabledState {Boolean}
     * @return {StatusCode} StatusCodes.Good if successful or BadConditionAlreadyEnabled/BadConditionAlreadyDisabled
     * @private
     */
    _setEnabledState(requestedEnabledState) {
        node_opcua_assert_1.assert(_.isBoolean(requestedEnabledState));
        const enabledState = this.getEnabledState();
        if (enabledState && requestedEnabledState) {
            return node_opcua_status_code_1.StatusCodes.BadConditionAlreadyEnabled;
        }
        if (!enabledState && !requestedEnabledState) {
            return node_opcua_status_code_1.StatusCodes.BadConditionAlreadyDisabled;
        }
        this._branch0.setEnabledState(requestedEnabledState);
        // conditionNode.enabledState.setValue(requestedEnabledState);
        // xx assert(conditionNode.enabledState.id.readValue().value.value === requestedEnabledState,"sanity check 1");
        // xx assert(conditionNode.currentBranch().getEnabledState() === requestedEnabledState,"sanity check 2");
        if (!requestedEnabledState) {
            // as per Spec 1.0.3 part 9:
            // * When the Condition instance enters the Disabled state, the Retain Property of this
            // Condition shall be set to FALSE by the Server to indicate to the Client that the
            // Condition instance is currently not of interest to Clients.
            // TODO : shall we really set retain to false or artificially expose the retain false as false
            //        whist enabled state is false ?
            this._previousRetainFlag = this.currentBranch().getRetain();
            this.currentBranch().setRetain(false);
            // todo: install the mechanism by which all condition values will be return
            // as Null | BadConditionDisabled;
            const statusCode = node_opcua_status_code_1.StatusCodes.BadConditionDisabled;
            // a notification must be send
            this.raiseConditionEvent(this.currentBranch(), true);
        }
        else {
            // * When the Condition instance enters the enabled state, the Condition shall be
            //  evaluated and all of its Properties updated to reflect the current values. If this
            //  evaluation causes the Retain Property to transition to TRUE for any ConditionBranch,
            //  then an Event Notification shall be generated for that ConditionBranch.
            this.evaluateConditionsAfterEnabled();
            // todo evaluate branches
            // conditionNode.evaluateBranches();
            // restore retain flag
            if (this.hasOwnProperty("_previousRetainFlag")) {
                this.currentBranch().setRetain(this._previousRetainFlag);
            }
            // todo send notification for branches with retain = true
            let nb_condition_resent = 0;
            if (this.currentBranch().getRetain()) {
                nb_condition_resent += this._resend_conditionEvents();
            }
            if (nb_condition_resent === 0) {
                // a notification must be send
                this.raiseConditionEvent(this.currentBranch(), true);
            }
        }
        return node_opcua_status_code_1.StatusCodes.Good;
    }
    /**
     *
     * @method setEnabledState
     * @param requestedEnabledState {Boolean}
     * @private
     */
    setEnabledState(requestedEnabledState) {
        return this._setEnabledState(requestedEnabledState);
    }
    /**
     * @method setReceiveTime
     * @param time {Date}
     */
    setReceiveTime(time) {
        return this._branch0.setReceiveTime(time);
    }
    /**
     * @method setLocalTime (optional)
     * @param time
     */
    setLocalTime(time) {
        return this._branch0.setLocalTime(time);
    }
    /**
     * @method setTime
     * @param time {Date}
     */
    setTime(time) {
        return this._branch0.setTime(time);
    }
    _assert_valid() {
        node_opcua_assert_1.assert(this.receiveTime.readValue().value.dataType === node_opcua_variant_1.DataType.DateTime);
        node_opcua_assert_1.assert(this.receiveTime.readValue().value.value instanceof Date);
        node_opcua_assert_1.assert(this.message.readValue().value.dataType === node_opcua_variant_1.DataType.LocalizedText);
        node_opcua_assert_1.assert(this.severity.readValue().value.dataType === node_opcua_variant_1.DataType.UInt16);
        node_opcua_assert_1.assert(this.time.readValue().value.dataType === node_opcua_variant_1.DataType.DateTime);
        node_opcua_assert_1.assert(this.time.readValue().value.value instanceof Date);
        node_opcua_assert_1.assert(this.quality.readValue().value.dataType === node_opcua_variant_1.DataType.StatusCode);
        node_opcua_assert_1.assert(this.enabledState.readValue().value.dataType === node_opcua_variant_1.DataType.LocalizedText);
        node_opcua_assert_1.assert(this.branchId.readValue().value.dataType === node_opcua_variant_1.DataType.NodeId);
        // note localTime has been made optional in 1.04
        node_opcua_assert_1.assert(!this.localTime || this.localTime.readValue().value.dataType === node_opcua_variant_1.DataType.ExtensionObject);
    }
    /**
     * @method conditionOfNode
     * @return {UAObject}
     */
    conditionOfNode() {
        const refs = this.findReferencesExAsObject("HasCondition", node_opcua_data_model_1.BrowseDirection.Inverse);
        if (refs.length === 0) {
            return null;
        }
        node_opcua_assert_1.assert(refs.length !== 0, "UAConditionBase must be the condition of some node");
        node_opcua_assert_1.assert(refs.length === 1, "expecting only one ConditionOf");
        const node = refs[0];
        node_opcua_assert_1.assert(node.nodeClass === node_opcua_data_model_1.NodeClass.Object || node.nodeClass === node_opcua_data_model_1.NodeClass.Variable, "node for which we are the condition shall be an UAObject or UAVariable");
        return node;
    }
    /**
     * @method raiseConditionEvent
     * Raise a Instance Event
     * (see also UAObject#raiseEvent to raise a transient event)
     * @param branch the condition branch to raise
     * @param renewEventId true if event Id of the condition branch should be renewed
     */
    raiseConditionEvent(branch, renewEventId) {
        node_opcua_assert_1.assert(arguments.length === 2, "expecting 2 arguments");
        if (renewEventId) {
            branch.renewEventId();
        }
        // xx console.log("MMMMMMMM%%%%%%%%%%%%%%%%%%%%% branch  " +
        // branch.getBranchId().toString() + " eventId = " + branch.getEventId().toString("hex"));
        node_opcua_assert_1.assert(branch instanceof condition_snapshot_1.ConditionSnapshot);
        this._assert_valid();
        // In fact the event is raised by the object of which we are the condition
        const conditionOfNode = this.conditionOfNode();
        if (conditionOfNode) {
            const eventData = branch._constructEventData();
            this.emit("event", eventData);
            if (conditionOfNode instanceof ua_object_1.UAObject) {
                // xx assert(conditionOfNode.eventNotifier === 0x01);
                conditionOfNode._bubble_up_event(eventData);
            }
            else {
                node_opcua_assert_1.assert(conditionOfNode.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
                // in this case
                const eventOfs = conditionOfNode.getEventSourceOfs();
                node_opcua_assert_1.assert(eventOfs.length === 1);
                const node = eventOfs[0];
                node_opcua_assert_1.assert(node instanceof ua_object_1.UAObject);
                node._bubble_up_event(eventData);
            }
        }
        // xx console.log("MMMMMMMM%%%%%%%%%%%%%%%%%%%%% branch  " +
        // branch.getBranchId().toString() + " eventId = " + branch.getEventId().toString("hex"));
    }
    /**
     *
     * @method raiseNewCondition
     * @param conditionInfo {ConditionInfo}
     *
     */
    raiseNewCondition(conditionInfo) {
        if (!this.getEnabledState()) {
            throw new Error("UAConditionBase#raiseNewCondition Condition is not enabled");
        }
        conditionInfo = conditionInfo || {};
        conditionInfo.severity = conditionInfo.hasOwnProperty("severity")
            ? conditionInfo.severity
            : UAConditionBase.defaultSeverity;
        // only valid for ConditionObjects
        // todo check that object is of type ConditionType
        const addressSpace = this.addressSpace;
        const selfConditionType = this.typeDefinitionObj;
        const conditionType = addressSpace.findObjectType("ConditionType");
        node_opcua_assert_1.assert(selfConditionType.isSupertypeOf(conditionType));
        const branch = this.currentBranch();
        const now = new Date();
        // install the eventTimestamp
        // set the received Time
        branch.setTime(now);
        branch.setReceiveTime(now);
        // note : in 1.04 LocalTime property is optional
        if (this.hasOwnProperty("localTime")) {
            branch.setLocalTime(new node_opcua_types_1.TimeZoneDataType({
                daylightSavingInOffset: false,
                offset: 0
            }));
        }
        if (conditionInfo.hasOwnProperty("message") && conditionInfo.message) {
            branch.setMessage(conditionInfo.message);
        }
        // todo receive time : when the server received the event from the underlying system.
        // self.receiveTime.setValueFromSource();
        if (conditionInfo.hasOwnProperty("severity") && conditionInfo.severity !== null) {
            node_opcua_assert_1.assert(_.isFinite(conditionInfo.severity));
            branch.setSeverity(conditionInfo.severity);
        }
        if (conditionInfo.hasOwnProperty("quality") && conditionInfo.quality !== null) {
            node_opcua_assert_1.assert(conditionInfo.quality instanceof node_opcua_status_code_1.StatusCode);
            branch.setQuality(conditionInfo.quality);
        }
        if (conditionInfo.hasOwnProperty("retain") && conditionInfo.retain !== null) {
            node_opcua_assert_1.assert(_.isBoolean(conditionInfo.retain));
            branch.setRetain(!!conditionInfo.retain);
        }
        this.raiseConditionEvent(branch, true);
    }
    raiseNewBranchState(branch) {
        this.raiseConditionEvent(branch, true);
        if (branch.getBranchId() !== node_opcua_nodeid_1.NodeId.nullNodeId && !branch.getRetain()) {
            // xx console.log(" Deleting not longer needed branch ", branch.getBranchId().toString());
            // branch can be deleted
            this.deleteBranch(branch);
        }
    }
    /**
     * @method currentBranch
     * @return {ConditionSnapshot}
     */
    currentBranch() {
        return this._branch0;
    }
    _resend_conditionEvents() {
        // for the time being , only current branch
        const currentBranch = this.currentBranch();
        if (currentBranch.getRetain()) {
            debugLog(" resending condition event for " + this.browseName.toString());
            this.raiseConditionEvent(currentBranch, false);
            return 1;
        }
        return 0;
    }
    // ------------------------------------------------------------------------------------
    // Acknowledgeable
    // ------------------------------------------------------------------------------------
    /**
     * @method _raiseAuditConditionCommentEvent
     * @param sourceName {string}
     * @param eventId    {Buffer}
     * @param comment    {LocalizedText}
     * @private
     */
    _raiseAuditConditionCommentEvent(sourceName, eventId, comment) {
        node_opcua_assert_1.assert(eventId === null || eventId instanceof Buffer);
        node_opcua_assert_1.assert(comment instanceof node_opcua_data_model_1.LocalizedText);
        const server = this.addressSpace.rootFolder.objects.server;
        const now = new Date();
        // xx if (true || server.isAuditing) {
        // ----------------------------------------------------------------------------------------------------
        server.raiseEvent("AuditConditionCommentEventType", {
            // AuditEventType
            /* part 5 -  6.4.3 AuditEventType */
            actionTimeStamp: {
                dataType: "DateTime",
                value: now
            },
            status: {
                dataType: "Boolean",
                value: true
            },
            serverId: {
                dataType: "String",
                value: ""
            },
            // ClientAuditEntryId contains the human-readable AuditEntryId defined in Part 3.
            clientAuditEntryId: {
                dataType: "String",
                value: ""
            },
            // The ClientUserId identifies the user of the client requesting an action. The ClientUserId can be
            // obtained from the UserIdentityToken passed in the ActivateSession call.
            clientUserId: {
                dataType: "String",
                value: ""
            },
            sourceName: {
                dataType: "String",
                value: sourceName
            },
            // AuditUpdateMethodEventType
            methodId: {
                dataType: "Null"
            },
            inputArguments: {
                dataType: "Null"
            },
            // AuditConditionCommentEventType
            eventId: {
                dataType: "ByteString",
                value: eventId
            },
            comment: {
                dataType: "LocalizedText",
                value: comment
            }
        });
        // xx }
    }
    _findBranchForEventId(eventId) {
        const conditionNode = this;
        if (sameBuffer(conditionNode.eventId.readValue().value.value, eventId)) {
            return conditionNode.currentBranch();
        }
        const e = _.filter(conditionNode._branches, (branch, key) => {
            return sameBuffer(branch.getEventId(), eventId);
        });
        if (e.length === 1) {
            return e[0];
        }
        node_opcua_assert_1.assert(e.length === 0, "cannot have 2 branches with same eventId");
        return null; // not found
    }
    evaluateConditionsAfterEnabled() {
        node_opcua_assert_1.assert(this.getEnabledState() === true);
        throw new Error("Unimplemented , please override");
    }
}
exports.UAConditionBase = UAConditionBase;
UAConditionBase.defaultSeverity = 250;
UAConditionBase.typeDefinition = node_opcua_nodeid_1.resolveNodeId("ConditionType");
/**
 * instantiate a Condition.
 * this will create the unique EventId and will set eventType
 * @method instantiate
 * @param namespace {Namespace}
 * @param conditionTypeId          {String|NodeId}  the EventType to instantiate
 * @param options                  {object}
 * @param options.browseName       {String|QualifiedName}
 * @param options.componentOf      {NodeId|UAObject}
 * @param options.conditionOf      {NodeId|UAObject} Mandatory
 * @param options.organizedBy      {NodeId|UAObject} ( only provide componentOf or organizedBy but not both)
 * @param [options.conditionClass =BaseConditionClassType]  {NodeId|UAObject}
 *                                 The condition Class nodeId or object used to set the ConditionClassId and
 *                                 ConditionClassName properties of the condition.
 *
 * @param options.conditionSource  {NodeId|UAObject} the condition source node.
 *                                                   this node must be marked a EventSource.
 *                                                   the conditionSource is used to populate the sourceNode and
 *                                                   sourceName variables defined by BaseEventType
 * @param options.conditionName    {String} the condition Name
 * @param [options.optionals]      [Array<String>]   an Array of optionals fields
 *
 * @param data                 a object containing the value to set
 * @param data.eventId {String|NodeId}  the EventType Identifier to instantiate (type cannot be abstract)
 * @return  a instantiated UAConditionBase
 */
function UAConditionBase_instantiate(namespace, conditionTypeId, options, data) {
    /* eslint max-statements: ["error", 100] */
    const addressSpace = namespace.addressSpace;
    const conditionType = addressSpace.findEventType(conditionTypeId);
    /* istanbul ignore next */
    if (!conditionType) {
        throw new Error(" cannot find Condition Type for " + conditionTypeId);
    }
    // reminder : abstract event type cannot be instantiated directly !
    node_opcua_assert_1.assert(!conditionType.isAbstract);
    const baseConditionEventType = addressSpace.findEventType("ConditionType");
    /* istanbul ignore next */
    if (!baseConditionEventType) {
        throw new Error("cannot find  ConditionType");
    }
    node_opcua_assert_1.assert(conditionType.isSupertypeOf(baseConditionEventType));
    // assert(_.isString(options.browseName));
    options.browseName = options.browseName || "??? instantiateCondition - missing browseName";
    options.optionals = options.optionals || [];
    // now optionals in 1.04
    options.optionals.push("EventType");
    options.optionals.push("BranchId");
    //
    options.optionals.push("Comment");
    options.optionals.push("Comment.SourceTimestamp");
    options.optionals.push("EnabledState.TrueState");
    options.optionals.push("EnabledState.TrueState");
    options.optionals.push("EnabledState.FalseState");
    options.optionals.push("EnabledState.TransitionTime");
    options.optionals.push("EnabledState.EffectiveTransitionTime");
    options.optionals.push("EnabledState.EffectiveDisplayName");
    const conditionNode = conditionType.instantiate(options);
    Object.setPrototypeOf(conditionNode, UAConditionBase.prototype);
    conditionNode.initialize();
    node_opcua_assert_1.assert(options.hasOwnProperty("conditionSource"), "must specify a condition source either as null or as a UAObject");
    if (!options.conditionOf) {
        options.conditionOf = options.conditionSource;
    }
    if (options.conditionOf) {
        node_opcua_assert_1.assert(options.hasOwnProperty("conditionOf")); // must provide a conditionOf
        options.conditionOf = addressSpace._coerceNode(options.conditionOf);
        // HasCondition References can be used in the Type definition of an Object or a Variable.
        node_opcua_assert_1.assert(options.conditionOf.nodeClass === node_opcua_data_model_1.NodeClass.Object ||
            options.conditionOf.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
        conditionNode.addReference({
            isForward: false,
            nodeId: options.conditionOf,
            referenceType: "HasCondition"
        });
        node_opcua_assert_1.assert(conditionNode.conditionOfNode().nodeId === options.conditionOf.nodeId);
    }
    // the constant property of this condition
    conditionNode.eventType.setValueFromSource({
        dataType: node_opcua_variant_1.DataType.NodeId,
        value: conditionType.nodeId
    });
    data = data || {};
    // install initial branch ID (null NodeId);
    conditionNode.branchId.setValueFromSource({
        dataType: node_opcua_variant_1.DataType.NodeId,
        value: node_opcua_nodeid_1.NodeId.nullNodeId
    });
    // install 'Comment' condition variable
    _install_condition_variable_type(conditionNode.comment);
    // install 'Quality' condition variable
    _install_condition_variable_type(conditionNode.quality);
    // xx conditionNode.quality.setValueFromSource({dataType: DataType.StatusCode,value: StatusCodes.Good });
    // install 'LastSeverity' condition variable
    _install_condition_variable_type(conditionNode.lastSeverity);
    // xx conditionNode.severity.setValueFromSource({dataType: DataType.UInt16,value: 0 });
    // xx conditionNode.lastSeverity.setValueFromSource({dataType: DataType.UInt16,value: 0 });
    // install  'EnabledState' TwoStateVariable
    /**
     *  @property enabledState
     *  @type {UATwoStateVariable}
     */
    // -------------- fixing missing EnabledState.EffectiveDisplayName
    if (!conditionNode.enabledState.effectiveDisplayName) {
        namespace.addVariable({
            browseName: new node_opcua_data_model_1.QualifiedName({ namespaceIndex: 0, name: "EffectiveDisplayName" }),
            dataType: "LocalizedText",
            propertyOf: conditionNode.enabledState
        });
    }
    ua_two_state_variable_1._install_TwoStateVariable_machinery(conditionNode.enabledState, {
        falseState: "Disabled",
        trueState: "Enabled"
    });
    node_opcua_assert_1.assert(conditionNode.enabledState._trueState === "Enabled");
    node_opcua_assert_1.assert(conditionNode.enabledState._falseState === "Disabled");
    // installing sourceName and sourceNode
    conditionNode.enabledState.setValue(true);
    // set properties to in initial values
    Object.keys(data).forEach((key) => {
        const varNode = _getCompositeKey(conditionNode, key);
        node_opcua_assert_1.assert(varNode.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
        const variant = new node_opcua_variant_1.Variant(data[key]);
        // check that Variant DataType is compatible with the UAVariable dataType
        // xx var nodeDataType = addressSpace.findNode(varNode.dataType).browseName;
        /* istanbul ignore next */
        if (!varNode._validate_DataType(variant.dataType)) {
            throw new Error(" Invalid variant dataType " + variant + " " + varNode.browseName.toString());
        }
        const value = new node_opcua_variant_1.Variant(data[key]);
        varNode.setValueFromSource(value);
    });
    // bind condition methods -
    /**
     *  @property enable
     *  @type {UAMethod}
     */
    conditionNode.enable.bindMethod(_enable_method);
    /**
     *  @property disable
     *  @type {UAMethod}
     */
    conditionNode.disable.bindMethod(_disable_method);
    // bind condition methods - AddComment
    /**
     *  @property addComment
     *  @type {UAMethod}
     */
    conditionNode.addComment.bindMethod(_add_comment_method);
    node_opcua_assert_1.assert(conditionNode instanceof UAConditionBase);
    // ConditionSource => cf SourceNode
    //  As per spec OPCUA 1.03 part 9 page 54:
    //    The ConditionType inherits all Properties of the BaseEventType. Their semantic is defined in
    //    Part 5. SourceNode identifies the ConditionSource.
    //    The SourceNode is the Node which the condition is associated with, it may be the same as the
    //    InputNode for an alarm, but it may be a separate node. For example a motor, which is a
    //    variable with a value that is an RPM, may be the ConditionSource for Conditions that are
    //    related to the motor as well as a temperature sensor associated with the motor. In the former
    //    the InputNode for the High RPM alarm is the value of the Motor RPM, while in the later the
    //    InputNode of the High Alarm would be the value of the temperature sensor that is associated
    //    with the motor.
    if (options.conditionSource) {
        options.conditionSource = addressSpace._coerceNode(options.conditionSource);
        if (options.conditionSource.nodeClass !== node_opcua_data_model_1.NodeClass.Object &&
            options.conditionSource.nodeClass !== node_opcua_data_model_1.NodeClass.Variable) {
            // tslint:disable:no-console
            console.log(options.conditionSource);
            throw new Error("Expecting condition source to be NodeClass.Object or Variable");
        }
        const conditionSourceNode = addressSpace.findNode(options.conditionSource.nodeId);
        if (conditionSourceNode) {
            conditionNode.sourceNode.setValueFromSource({
                dataType: node_opcua_variant_1.DataType.NodeId,
                value: conditionSourceNode.nodeId
            });
            // conditionSourceNode node must be registered as a EventSource of an other node.
            // As per spec OPCUA 1.03 part 9 page 54:
            //   HasNotifier and HasEventSource References are used to expose the hierarchical organization
            //   of Event notifying Objects and ConditionSources. An Event notifying Object represents
            //   typically an area of Operator responsibility.  The definition of such an area configuration is
            //   outside the scope of this standard. If areas are available they shall be linked together and
            //   with the included ConditionSources using the HasNotifier and the HasEventSource Reference
            //   Types. The Server Object shall be the root of this hierarchy.
            if (!node_opcua_nodeid_1.sameNodeId(conditionSourceNode.nodeId, node_opcua_nodeid_1.coerceNodeId("ns=0;i=2253"))) { // server object
                /* istanbul ignore next */
                if (conditionSourceNode.getEventSourceOfs().length === 0) {
                    errorLog("conditionSourceNode = ", conditionSourceNode.browseName.toString());
                    errorLog("conditionSourceNode = ", conditionSourceNode.nodeId.toString());
                    throw new Error("conditionSourceNode must be an event source " + conditionSourceNode.browseName.toString() + conditionSourceNode.nodeId.toString());
                }
            }
            const context = source_1.SessionContext.defaultContext;
            // set source Node (defined in UABaseEventType)
            conditionNode.sourceNode.setValueFromSource(conditionSourceNode.readAttribute(context, node_opcua_data_model_1.AttributeIds.NodeId).value);
            // set source Name (defined in UABaseEventType)
            conditionNode.sourceName.setValueFromSource(conditionSourceNode.readAttribute(context, node_opcua_data_model_1.AttributeIds.DisplayName).value);
        }
    }
    conditionNode.eventType.setValueFromSource({
        dataType: node_opcua_variant_1.DataType.NodeId,
        value: conditionType.nodeId
    });
    // as per spec:
    /**
     *
     *  dataType: DataType.NodeId
     *
     *  As per spec OPCUA 1.03 part 9:
     *    ConditionClassId specifies in which domain this Condition is used. It is the NodeId of the
     *    corresponding ConditionClassType. See 5.9 for the definition of ConditionClass and a set of
     *    ConditionClasses defined in this standard. When using this Property for filtering, Clients have
     *    to specify all individual ConditionClassType NodeIds. The OfType operator cannot be applied.
     *    BaseConditionClassType is used as class whenever a Condition cannot be assigned to a
     *    more concrete class.
     *
     *                         BaseConditionClassType
     *                                   |
     *                      +---------------------------+----------------------------+
     *                     |                           |                             |
     *            ProcessConditionClassType  MaintenanceConditionClassType  SystemConditionClassType
     *
     *  @property conditionName
     *  @type {UAVariable}
     */
    const baseConditionClassType = addressSpace.findObjectType("ProcessConditionClassType");
    // assert(baseConditionClassType,"Expecting BaseConditionClassType to be in addressSpace");
    let conditionClassId = baseConditionClassType ? baseConditionClassType.nodeId : node_opcua_nodeid_1.NodeId.nullNodeId;
    let conditionClassName = baseConditionClassType ? baseConditionClassType.displayName[0] : "";
    if (options.conditionClass) {
        if (_.isString(options.conditionClass)) {
            options.conditionClass = addressSpace.findObjectType(options.conditionClass);
        }
        const conditionClassNode = addressSpace._coerceNode(options.conditionClass);
        if (!conditionClassNode) {
            throw new Error("cannot find condition class " + options.conditionClass.toString());
        }
        conditionClassId = conditionClassNode.nodeId;
        conditionClassName = conditionClassNode.displayName[0];
    }
    conditionNode.conditionClassId.setValueFromSource({
        dataType: node_opcua_variant_1.DataType.NodeId,
        value: conditionClassId
    });
    // as per spec:
    //  ConditionClassName provides the display name of the ConditionClassType.
    conditionNode.conditionClassName.setValueFromSource({
        dataType: node_opcua_variant_1.DataType.LocalizedText,
        value: node_opcua_data_model_1.coerceLocalizedText(conditionClassName)
    });
    // as per spec:
    /**
     *
     * dataType: DataType.String
     *
     * As per spec OPCUA 1.03 part 9:
     *   ConditionName identifies the Condition instance that the Event originated from. It can be used
     *   together with the SourceName in a user display to distinguish between different Condition
     *   instances. If a ConditionSource has only one instance of a ConditionType, and the Server has
     *   no instance name, the Server shall supply the ConditionType browse name.
     * @property conditionName
     * @type {UAVariable}
     */
    const conditionName = options.conditionName || "Unset Condition Name";
    node_opcua_assert_1.assert(_.isString(conditionName));
    conditionNode.conditionName.setValueFromSource({
        dataType: node_opcua_variant_1.DataType.String,
        value: conditionName
    });
    // set SourceNode and SourceName based on HasCondition node
    const sourceNodes = conditionNode.findReferencesAsObject("HasCondition", false);
    if (sourceNodes.length) {
        node_opcua_assert_1.assert(sourceNodes.length === 1);
        conditionNode.setSourceNode(sourceNodes[0].nodeId);
        conditionNode.setSourceName(sourceNodes[0].browseName.toString());
    }
    conditionNode.post_initialize();
    const branch0 = conditionNode.currentBranch();
    branch0.setRetain(false);
    branch0.setComment("");
    branch0.setQuality(node_opcua_status_code_1.StatusCodes.Good);
    branch0.setSeverity(0);
    branch0.setLocalTime(new node_opcua_types_1.TimeZoneDataType({
        daylightSavingInOffset: false,
        offset: 0
    }));
    branch0.setMessage("");
    branch0.setReceiveTime(node_opcua_factory_1.minDate);
    branch0.setTime(node_opcua_factory_1.minDate);
    // UAConditionBase
    return conditionNode;
}
function _disable_method(inputArguments, context, callback) {
    node_opcua_assert_1.assert(inputArguments.length === 0);
    const conditionNode = context.object;
    node_opcua_assert_1.assert(conditionNode);
    if (!(conditionNode instanceof UAConditionBase)) {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdInvalid
        });
    }
    const statusCode = conditionNode._setEnabledState(false);
    return callback(null, {
        statusCode
    });
}
function _enable_method(inputArguments, context, callback) {
    node_opcua_assert_1.assert(inputArguments.length === 0);
    const conditionNode = context.object;
    node_opcua_assert_1.assert(conditionNode);
    if (!(conditionNode instanceof UAConditionBase)) {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdInvalid
        });
    }
    const statusCode = conditionNode._setEnabledState(true);
    return callback(null, {
        statusCode
    });
}
function _condition_refresh_method(inputArguments, context, callback) {
    // arguments : IntegerId SubscriptionId
    node_opcua_assert_1.assert(inputArguments.length === 1);
    const addressSpace = context.object.addressSpace;
    if (doDebug) {
        debugLog(chalk_1.default.red(" ConditionType.ConditionRefresh ! subscriptionId ="), inputArguments[0].toString());
    }
    const subscriptionId = inputArguments[0].value;
    let statusCode = _check_subscription_id_is_valid(subscriptionId, context);
    if (statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
        return statusCode;
    }
    statusCode = _perform_condition_refresh(addressSpace, inputArguments, context);
    return callback(null, {
        statusCode
    });
}
function _perform_condition_refresh(addressSpace, inputArguments, context) {
    // --- possible StatusCodes:
    //
    // Bad_SubscriptionIdInvalid  See Part 4 for the description of this result code
    // Bad_RefreshInProgress      See Table 74 for the description of this result code
    // Bad_UserAccessDenied       The Method was not called in the context of the Session
    //                            that owns the Subscription
    //
    // istanbul ignore next
    if (addressSpace._condition_refresh_in_progress) {
        // a refresh operation is already in progress....
        return node_opcua_status_code_1.StatusCodes.BadRefreshInProgress;
    }
    addressSpace._condition_refresh_in_progress = true;
    const server = context.object.addressSpace.rootFolder.objects.server;
    node_opcua_assert_1.assert(server instanceof ua_object_1.UAObject);
    const refreshStartEventType = addressSpace.findEventType("RefreshStartEventType");
    const refreshEndEventType = addressSpace.findEventType("RefreshEndEventType");
    node_opcua_assert_1.assert(refreshStartEventType instanceof ua_object_type_1.UAObjectType);
    node_opcua_assert_1.assert(refreshEndEventType instanceof ua_object_type_1.UAObjectType);
    server.raiseEvent(refreshStartEventType, {});
    // todo : resend retained conditions
    // starting from server object ..
    // evaluated all --> hasNotifier/hasEventSource -> node
    server._conditionRefresh();
    server.raiseEvent(refreshEndEventType, {});
    addressSpace._condition_refresh_in_progress = false;
    return node_opcua_status_code_1.StatusCodes.Good;
}
function _condition_refresh2_method(inputArguments, context, callback) {
    // arguments : IntegerId SubscriptionId
    // arguments : IntegerId MonitoredItemId
    node_opcua_assert_1.assert(inputArguments.length === 2);
    const addressSpace = context.object.addressSpace;
    // istanbul ignore next
    if (doDebug) {
        debugLog(chalk_1.default.cyan.bgWhite(" ConditionType.conditionRefresh2 !"));
    }
    // xx var subscriptionId = inputArguments[0].value;
    // xx var monitoredItemId = inputArguments[1].value;
    const statusCode = _perform_condition_refresh(addressSpace, inputArguments, context);
    return callback(null, {
        statusCode
    });
}
function _add_comment_method(inputArguments, context, callback) {
    //
    // The AddComment Method is used to apply a comment to a specific state of a Condition
    // instance. Normally, the NodeId of the object instance as the ObjectId is passed to the Call
    // Service. However, some Servers do not expose Condition instances in the AddressSpace.
    // Therefore all Servers shall also allow Clients to call the AddComment Method by specifying
    // ConditionId as the ObjectId. The Method cannot be called with an ObjectId of the
    // ConditionType Node.
    // Signature
    //   - EventId EventId identifying a particular Event Notification where a state was reported for a
    //             Condition.
    //   - Comment A localized text to be applied to the Condition.
    //
    // AlwaysGeneratesEvent  AuditConditionCommentEventType
    //
    UAConditionBase.with_condition_method(inputArguments, context, callback, (eventId, comment, branch, conditionNode) => {
        node_opcua_assert_1.assert(inputArguments instanceof Array);
        node_opcua_assert_1.assert(eventId instanceof Buffer || eventId === null);
        node_opcua_assert_1.assert(branch instanceof condition_snapshot_1.ConditionSnapshot);
        branch.setComment(comment);
        const sourceName = "Method/AddComment";
        conditionNode._raiseAuditConditionCommentEvent(sourceName, eventId, comment);
        // raise new event
        conditionNode.raiseConditionEvent(branch, true);
        /**
         * raised when the  branch has been added a comment
         * @event addComment
         * @param  eventId   NodeId|null
         * @param  comment   {LocalizedText}
         * @param  branch    {ConditionSnapshot}
         */
        conditionNode.emit("addComment", eventId, comment, branch);
        return node_opcua_status_code_1.StatusCodes.Good;
    });
}
function sameBuffer(b1, b2) {
    if (!b1 && !b2) {
        return true;
    }
    if (b1 && !b2) {
        return false;
    }
    if (!b1 && b2) {
        return false;
    }
    node_opcua_assert_1.assert(b1 instanceof Buffer);
    node_opcua_assert_1.assert(b2 instanceof Buffer);
    if (b1.length !== b2.length) {
        return false;
    }
    /*
        var bb1 = (Buffer.from(b1)).toString("hex");
        var bb2 = (Buffer.from(b2)).toString("hex");
        return bb1 === bb2;
    */
    const n = b1.length;
    for (let i = 0; i < n; i++) {
        if (b1[i] !== b2[i]) {
            return false;
        }
    }
    return true;
}
function _create_new_branch_id() {
    return node_opcua_nodeid_1.makeNodeId(node_opcua_basic_types_1.randomGuid(), 1);
}
function _update_sourceTimestamp(dataValue /*, indexRange*/) {
    this.sourceTimestamp.setValueFromSource({
        dataType: node_opcua_variant_1.DataType.DateTime,
        value: dataValue.sourceTimestamp
    });
}
// tslint:disable:no-console
function _install_condition_variable_type(node) {
    node_opcua_assert_1.assert(node instanceof base_node_1.BaseNode);
    // from spec 1.03 : 5.3 condition variables
    // However,  a change in their value is considered important and supposed to trigger
    // an Event Notification. These information elements are called ConditionVariables.
    if (node.sourceTimestamp) {
        node.sourceTimestamp.accessLevel = node_opcua_data_model_1.makeAccessLevelFlag("CurrentRead");
    }
    else {
        console.warn("cannot find node.sourceTimestamp", node.browseName.toString());
    }
    node.accessLevel = node_opcua_data_model_1.makeAccessLevelFlag("CurrentRead");
    // from spec 1.03 : 5.3 condition variables
    // a condition VariableType has a sourceTimeStamp exposed property
    // SourceTimestamp indicates the time of the last change of the Value of this ConditionVariable.
    // It shall be the same time that would be returned from the Read Service inside the DataValue
    // structure for the ConditionVariable Value Attribute.
    node_opcua_assert_1.assert(node.typeDefinitionObj.browseName.toString() === "ConditionVariableType");
    node_opcua_assert_1.assert(node.sourceTimestamp.browseName.toString() === "SourceTimestamp");
    node.on("value_changed", _update_sourceTimestamp);
}
/**
 * @method _getCompositeKey
 * @param node {BaseNode}
 * @param key {String}
 * @return {BaseNode}
 * @private
 *
 * @example
 *
 *     var node  = _getComposite(node,"enabledState.id");
 *
 */
function _getCompositeKey(node, key) {
    let cur = node;
    const elements = key.split(".");
    for (const e of elements) {
        // istanbul ignore next
        if (!cur.hasOwnProperty(e)) {
            throw new Error(" cannot extract '" + key + "' from " + node.browseName.toString());
        }
        cur = cur[e];
    }
    return cur;
}
/**
 * verify that the subscription id belongs to the session that make the call.
 * @method _check_subscription_id_is_valid
 * @param subscriptionId {Number}
 * @param context {Object}
 * @private
 */
function _check_subscription_id_is_valid(subscriptionId, context) {
    /// todo: return StatusCodes.BadSubscriptionIdInvalid; if subscriptionId doesn't belong to session...
    return node_opcua_status_code_1.StatusCodes.Good;
}
//# sourceMappingURL=ua_condition_base.js.map