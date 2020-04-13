"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
const events_1 = require("events");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_types_1 = require("node-opcua-types");
const utils = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const event_data_1 = require("../event_data");
const ua_two_state_variable_1 = require("../ua_two_state_variable");
const condition_1 = require("./condition");
const ua_condition_base_1 = require("./ua_condition_base");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
function normalizeName(str) {
    return str
        .split(".")
        .map(utils.lowerFirstLetter)
        .join(".");
}
function _visit(self, node, prefix) {
    const aggregates = node.getAggregates();
    for (const aggregate of aggregates) {
        if (aggregate.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
            let name = aggregate.browseName.toString();
            name = utils.lowerFirstLetter(name);
            const key = prefix + name;
            // istanbul ignore next
            if (doDebug) {
                debugLog("adding key =", key);
            }
            const aggregateVariable = aggregate;
            self._map[key] = aggregateVariable.readValue().value;
            self._node_index[key] = aggregateVariable;
            _visit(self, aggregate, prefix + name + ".");
        }
    }
}
function _record_condition_state(self, condition) {
    self._map = {};
    self._node_index = {};
    node_opcua_assert_1.assert(condition instanceof ua_condition_base_1.UAConditionBase);
    _visit(self, condition, "");
}
function _installOnChangeEventHandlers(self, node, prefix) {
    const aggregates = node.getAggregates();
    for (const aggregate of aggregates) {
        if (aggregate.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
            let name = aggregate.browseName.toString();
            name = utils.lowerFirstLetter(name);
            const key = prefix + name;
            // istanbul ignore next
            if (doDebug) {
                debugLog("adding key =", key);
            }
            aggregate.on("value_changed", (newDataValue, oldDataValue) => {
                self._map[key] = newDataValue.value;
                self._node_index[key] = aggregate;
            });
            _installOnChangeEventHandlers(self, aggregate, prefix + name + ".");
        }
    }
}
function _ensure_condition_values_correctness(self, node, prefix, error) {
    const displayError = !!error;
    error = error || [];
    const aggregates = node.getAggregates();
    for (const aggregate of aggregates) {
        if (aggregate.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
            let name = aggregate.browseName.toString();
            name = utils.lowerFirstLetter(name);
            const key = prefix + name;
            const snapshot_value = self._map[key].toString();
            const aggregateVariable = aggregate;
            const condition_value = aggregateVariable.readValue().value.toString();
            if (snapshot_value !== condition_value) {
                error.push(" Condition Branch0 is not in sync with node values for " +
                    key +
                    "\n v1= " +
                    snapshot_value +
                    "\n v2= " +
                    condition_value);
            }
            self._node_index[key] = aggregate;
            _ensure_condition_values_correctness(self, aggregate, prefix + name + ".", error);
        }
    }
    if (displayError && error.length) {
        throw new Error(error.join("\n"));
    }
}
const disabledVar = new node_opcua_variant_1.Variant({
    dataType: "StatusCode",
    value: node_opcua_status_code_1.StatusCodes.BadConditionDisabled
});
// list of Condition variables that should not be published as BadConditionDisabled when the condition
// is in a disabled state.
const _varTable = {
    "branchId": 1,
    "conditionClassId": 1,
    "conditionClassName": 1,
    "conditionName": 1,
    "enabledState": 1,
    "enabledState.effectiveDisplayName": 1,
    "enabledState.id": 1,
    "enabledState.transitionTime": 1,
    "eventId": 1,
    "eventType": 1,
    "localTime": 1,
    "sourceName": 1,
    "sourceNode": 1,
    "time": 1
};
class ConditionSnapshot extends events_1.EventEmitter {
    /**
     * @class ConditionSnapshot
     * @extends EventEmitter
     * @param condition
     * @param branchId
     * @constructor
     */
    constructor(condition, branchId) {
        super();
        this.eventData = null;
        this.branchId = null;
        this._map = null;
        this._node_index = null;
        this._need_event_raise = false;
        node_opcua_assert_1.assert(branchId instanceof node_opcua_nodeid_1.NodeId);
        // xx self.branchId = branchId;
        this.condition = condition;
        this.eventData = new event_data_1.EventData(condition);
        // a nodeId/Variant map
        _record_condition_state(this, condition);
        if (branchId === node_opcua_nodeid_1.NodeId.nullNodeId) {
            _installOnChangeEventHandlers(this, condition, "");
        }
        this._set_var("branchId", node_opcua_variant_1.DataType.NodeId, branchId);
    }
    _constructEventData() {
        if (this.branchId === node_opcua_nodeid_1.NodeId.nullNodeId) {
            _ensure_condition_values_correctness(this, this.condition, "", []);
        }
        const isDisabled = !this.condition.getEnabledState();
        const eventData = new event_data_1.EventData(this.condition);
        for (const key of Object.keys(this._map)) {
            const node = this._node_index[key];
            if (!node) {
                debugLog("cannot node for find key", key);
                continue;
            }
            if (isDisabled && !_varTable.hasOwnProperty(key)) {
                eventData.setValue(key, node, disabledVar);
            }
            else {
                eventData.setValue(key, node, this._map[key]);
            }
        }
        return eventData;
    }
    /**
     * @method resolveSelectClause
     * @param selectClause {SelectClause}
     */
    resolveSelectClause(selectClause) {
        return this.eventData.resolveSelectClause(selectClause);
    }
    /**
     *
     */
    readValue(nodeId, selectClause) {
        const isDisabled = !this.condition.getEnabledState();
        if (isDisabled) {
            return disabledVar;
        }
        const key = nodeId.toString();
        const variant = this._map[key];
        if (!variant) {
            // the value is not handled by us .. let's delegate
            // to the eventData helper object
            return this.eventData.readValue(nodeId, selectClause);
        }
        node_opcua_assert_1.assert(variant instanceof node_opcua_variant_1.Variant);
        return variant;
    }
    _get_var(varName, dataType) {
        if (!this.condition.getEnabledState() && !_varTable.hasOwnProperty(varName)) {
            // xx console.log("ConditionSnapshot#_get_var condition enabled =", self.condition.getEnabledState());
            return disabledVar;
        }
        const key = normalizeName(varName);
        const variant = this._map[key];
        return variant.value;
    }
    _set_var(varName, dataType, value) {
        const key = normalizeName(varName);
        // istanbul ignore next
        if (!this._map.hasOwnProperty(key)) {
            if (doDebug) {
                debugLog(" cannot find node " + varName);
                debugLog("  map=", Object.keys(this._map).join(" "));
            }
        }
        this._map[key] = new node_opcua_variant_1.Variant({
            dataType,
            value
        });
        if (this._map[key + ".sourceTimestamp"]) {
            this._map[key + ".sourceTimestamp"] = new node_opcua_variant_1.Variant({
                dataType: node_opcua_variant_1.DataType.DateTime,
                value: new Date()
            });
        }
        const variant = this._map[key];
        const node = this._node_index[key];
        if (!node) {
            // for instance localTime is optional
            debugLog("Cannot serVar " + varName + " dataType " + node_opcua_variant_1.DataType[dataType]);
            return;
        }
        node_opcua_assert_1.assert(node.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
        this.emit("value_changed", node, variant);
    }
    /**
     * @method getBrandId
     * @return {NodeId}
     */
    getBranchId() {
        return this._get_var("branchId", node_opcua_variant_1.DataType.NodeId);
    }
    /**
     * @method getEventId
     * @return {ByteString}
     */
    getEventId() {
        return this._get_var("eventId", node_opcua_variant_1.DataType.ByteString);
    }
    /**
     * @method getRetain
     * @return {Boolean}
     */
    getRetain() {
        return this._get_var("retain", node_opcua_variant_1.DataType.Boolean);
    }
    /**
     *
     * @method setRetain
     * @param retainFlag {Boolean}
     */
    setRetain(retainFlag) {
        retainFlag = !!retainFlag;
        return this._set_var("retain", node_opcua_variant_1.DataType.Boolean, retainFlag);
    }
    /**
     * @method renewEventId
     *
     */
    renewEventId() {
        const addressSpace = this.condition.addressSpace;
        // create a new event  Id for this new condition
        const eventId = addressSpace.generateEventId();
        const ret = this._set_var("eventId", node_opcua_variant_1.DataType.ByteString, eventId.value);
        // xx var branch = self; console.log("MMMMMMMMrenewEventId branch  " +
        // branch.getBranchId().toString() + " eventId = " + branch.getEventId().toString("hex"));
        return ret;
    }
    /**
     * @method getEnabledState
     * @return {Boolean}
     */
    getEnabledState() {
        return this._get_twoStateVariable("enabledState");
    }
    /**
     * @method setEnabledState
     * @param value {Boolean}
     * @return void
     */
    setEnabledState(value) {
        return this._set_twoStateVariable("enabledState", value);
    }
    /**
     * @method getEnabledStateAsString
     * @return {String}
     */
    getEnabledStateAsString() {
        return this._get_var("enabledState", node_opcua_variant_1.DataType.LocalizedText).text;
    }
    /**
     * @method getComment
     * @return {LocalizedText}
     */
    getComment() {
        return this._get_var("comment", node_opcua_variant_1.DataType.LocalizedText);
    }
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
    setComment(txtMessage) {
        const txtMessage1 = node_opcua_data_model_1.coerceLocalizedText(txtMessage);
        this._set_var("comment", node_opcua_variant_1.DataType.LocalizedText, txtMessage1);
        /*
         * OPCUA Spec 1.0.3 - Part 9:
         * Comment, severity and quality are important elements of Conditions and any change
         * to them will cause Event Notifications.
         *
         */
        this._need_event_raise = true;
    }
    /**
     *
     * @method setMessage
     * @param txtMessage {LocalizedText}
     */
    setMessage(txtMessage) {
        const txtMessage1 = node_opcua_data_model_1.coerceLocalizedText(txtMessage);
        return this._set_var("message", node_opcua_variant_1.DataType.LocalizedText, txtMessage1);
    }
    /**
     * @method setClientUserId
     * @param userIdentity {String}
     */
    setClientUserId(userIdentity) {
        return this._set_var("clientUserId", node_opcua_variant_1.DataType.String, userIdentity.toString());
    }
    /*
     *
     *
     * as per spec 1.0.3 - Part 9
     *
     * Quality reveals the status of process values or other resources that this Condition instance is
     * based upon. If, for example, a process value is “Uncertain”, the associated “LevelAlarm”
     * Condition is also questionable. Values for the Quality can be any of the OPC StatusCodes
     * defined in Part 8 as well as Good, Uncertain and Bad as defined in Part 4. These
     * StatusCodes are similar to but slightly more generic than the description of data quality in the
     * various field bus specifications. It is the responsibility of the Server to map internal status
     * information to these codes. A Server which supports no quality information shall return Good.
     * This quality can also reflect the communication status associated with the system that this
     * value or resource is based on and from which this Alarm was received. For communication
     * errors to the underlying system, especially those that result in some unavailable Event fields,
     * the quality shall be BadNoCommunication error.
     *
     * Quality refers to the quality of the data value(s) upon which this Condition is based. Since a
     * Condition is usually based on one or more Variables, the Condition inherits the quality of
     * these Variables. E.g., if the process value is “Uncertain”, the “LevelAlarm” Condition is also
     * questionable. If more than one variable is represented by a given condition or if the condition
     * is from an underlining system and no direct mapping to a variable is available, it is up to the
     * application to determine what quality is displayed as part of the condition.
     */
    /**
     * set the condition quality
     * @method setQuality
     * @param quality {StatusCode}
     */
    setQuality(quality) {
        this._set_var("quality", node_opcua_variant_1.DataType.StatusCode, quality);
        /*
         * OPCUA Spec 1.0.3 - Part 9:
         * Comment, severity and quality are important elements of Conditions and any change
         * to them will cause Event Notifications.
         *
         */
        this._need_event_raise = true;
    }
    /**
     * @method getQuality
     * @return {StatusCode}
     */
    getQuality() {
        return this._get_var("quality", node_opcua_variant_1.DataType.StatusCode);
    }
    /*
     * as per spec 1.0.3 - Part 9
     * The Severity of a Condition is inherited from the base Event model defined in Part 5. It
     * indicates the urgency of the Condition and is also commonly called ‘priority’, especially in
     * relation to Alarms in the ProcessConditionClass.
     *
     * as per spec 1.0.3 - PArt 5
     * Severity is an indication of the urgency of the Event. This is also commonly called “priority”.
     * Values will range from 1 to 1 000, with 1 being the lowest severity and 1 000 being the highest.
     * Typically, a severity of 1 would indicate an Event which is informational in nature, while a value
     * of 1 000 would indicate an Event of catastrophic nature, which could potentially result in severe
     * financial loss or loss of life.
     * It is expected that very few Server implementations will support 1 000 distinct severity levels.
     * Therefore, Server developers are responsible for distributing their severity levels across the
     * 1 to 1 000 range in such a manner that clients can assume a linear distribution. For example, a
     * client wishing to present five severity levels to a user should be able to do the following
     * mapping:
     *            Client Severity OPC Severity
     *                HIGH        801 – 1 000
     *                MEDIUM HIGH 601 – 800
     *                MEDIUM      401 – 600
     *                MEDIUM LOW  201 – 400
     *                LOW           1 – 200
     * In many cases a strict linear mapping of underlying source severities to the OPC Severity range
     * is not appropriate. The Server developer will instead intelligently map the underlying source
     * severities to the 1 to 1 000 OPC Severity range in some other fashion. In particular, it is
     * recommended that Server developers map Events of high urgency into the OPC severity range
     * of 667 to 1 000, Events of medium urgency into the OPC severity range of 334 to 666 and
     * Events of low urgency into OPC severities of 1 to 333.
     */
    /**
     * @method setSeverity
     * @param severity {UInt16}
     */
    setSeverity(severity) {
        node_opcua_assert_1.assert(_.isFinite(severity), "expecting a UInt16");
        // record automatically last severity
        const lastSeverity = this.getSeverity();
        this.setLastSeverity(lastSeverity);
        this._set_var("severity", node_opcua_variant_1.DataType.UInt16, severity);
        /*
         * OPCUA Spec 1.0.3 - Part 9:
         * Comment, severity and quality are important elements of Conditions and any change
         * to them will cause Event Notifications.
         *
         */
        this._need_event_raise = true;
    }
    /**
     * @method getSeverity
     * @return {UInt16}
     */
    getSeverity() {
        node_opcua_assert_1.assert(this.condition.getEnabledState(), "condition must be enabled");
        const value = this._get_var("severity", node_opcua_variant_1.DataType.UInt16);
        return +value;
    }
    /*
     * as per spec 1.0.3 - part 9:
     *  LastSeverity provides the previous severity of the ConditionBranch. Initially this Variable
     *  contains a zero value; it will return a value only after a severity change. The new severity is
     *  supplied via the Severity Property which is inherited from the BaseEventType.
     *
     */
    /**
     * @method setLastSeverity
     * @param severity {UInt16}
     */
    setLastSeverity(severity) {
        severity = +severity;
        return this._set_var("lastSeverity", node_opcua_variant_1.DataType.UInt16, severity);
    }
    /**
     * @method getLastSeverity
     * @return {UInt16}
     */
    getLastSeverity() {
        const value = this._get_var("lastSeverity", node_opcua_variant_1.DataType.UInt16);
        return +value;
    }
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
    setReceiveTime(time) {
        node_opcua_assert_1.assert(time instanceof Date);
        return this._set_var("receiveTime", node_opcua_variant_1.DataType.DateTime, time);
    }
    /**
     * (as per OPCUA 1.0.3 part 5)
     * Time provides the time the Event occurred. This value is set as close to the event generator as
     * possible. It often comes from the underlying system or device. Once set, intermediate OPC UA
     * Servers shall not alter the value.
     *
     * @method setTime
     * @param time {Date}
     */
    setTime(time) {
        node_opcua_assert_1.assert(time instanceof Date);
        return this._set_var("time", node_opcua_variant_1.DataType.DateTime, time);
    }
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
    setLocalTime(localTime) {
        node_opcua_assert_1.assert(localTime instanceof node_opcua_types_1.TimeZoneDataType);
        return this._set_var("localTime", node_opcua_variant_1.DataType.ExtensionObject, new node_opcua_types_1.TimeZoneDataType(localTime));
    }
    // read only !
    getSourceName() {
        return this._get_var("sourceName", node_opcua_variant_1.DataType.LocalizedText);
    }
    /**
     * @method getSourceNode
     * return {NodeId}
     */
    getSourceNode() {
        return this._get_var("sourceNode", node_opcua_variant_1.DataType.NodeId);
    }
    /**
     * @method getEventType
     * return {NodeId}
     */
    getEventType() {
        return this._get_var("eventType", node_opcua_variant_1.DataType.NodeId);
    }
    getMessage() {
        return this._get_var("message", node_opcua_variant_1.DataType.LocalizedText);
    }
    isCurrentBranch() {
        return this._get_var("branchId", node_opcua_variant_1.DataType.NodeId) === node_opcua_nodeid_1.NodeId.nullNodeId;
    }
    // -- ACKNOWLEDGEABLE -------------------------------------------------------------------
    getAckedState() {
        const acknowledgeableCondition = this.condition;
        if (!acknowledgeableCondition.ackedState) {
            throw new Error("Node " + acknowledgeableCondition.browseName.toString() +
                " of type " + acknowledgeableCondition.typeDefinitionObj.browseName.toString() +
                " has no AckedState");
        }
        return this._get_twoStateVariable("ackedState");
    }
    setAckedState(ackedState) {
        ackedState = !!ackedState;
        return condition_1._setAckedState(this, ackedState);
    }
    getConfirmedState() {
        const acknowledgeableCondition = this.condition;
        node_opcua_assert_1.assert(acknowledgeableCondition.confirmedState, "Must have a confirmed state");
        return this._get_twoStateVariable("confirmedState");
    }
    setConfirmedStateIfExists(confirmedState) {
        confirmedState = !!confirmedState;
        const acknowledgeableCondition = this.condition;
        if (!acknowledgeableCondition.confirmedState) {
            // no condition node has been defined (this is valid)
            // confirm state cannot be set
            return;
        }
        // todo deal with Error code BadConditionBranchAlreadyConfirmed
        return this._set_twoStateVariable("confirmedState", confirmedState);
    }
    setConfirmedState(confirmedState) {
        const acknowledgeableCondition = this.condition;
        node_opcua_assert_1.assert(acknowledgeableCondition.confirmedState, "Must have a confirmed state.  Add ConfirmedState to the optionals");
        return this.setConfirmedStateIfExists(confirmedState);
    }
    // ---- Shelving
    /**
     * @class ConditionSnapshot
     */
    /**
     * @method getSuppressedState
     * @return {Boolean}
     */
    getSuppressedState() {
        return this._get_twoStateVariable("suppressedState");
    }
    /**
     * @method setSuppressedState
     * @param suppressed {Boolean}
     */
    setSuppressedState(suppressed) {
        suppressed = !!suppressed;
        this._set_twoStateVariable("suppressedState", suppressed);
    }
    getActiveState() {
        return this._get_twoStateVariable("activeState");
    }
    setActiveState(newActiveState) {
        // xx var activeState = self.getActiveState();
        // xx if (activeState === newActiveState) {
        // xx     return StatusCodes.Bad;
        // xx }
        this._set_twoStateVariable("activeState", newActiveState);
        return node_opcua_status_code_1.StatusCodes.Good;
    }
    // tslint:disable:no-empty
    setShelvingState(state) {
        // todo
    }
    toString() {
        //   public condition: any = null;
        //   public eventData: any = null;
        //   public branchId: NodeId | null = null;
        const t = this.condition.addressSpace.findNode(this.condition.typeDefinition);
        return ""
            + "condition: " + (this.condition.browseName.toString() + " " + this.condition.nodeId.toString())
            + ", type: " + (t.browseName.toString() + " " + t.nodeId.toString())
            + ", branchId: " + (this.branchId ? this.branchId.toString() : "<null>")
            + ", acked: " + this.getAckedState()
            + ", confirmed: " + this.getConfirmedState()
            + ", activeState: " + this.getActiveState()
            // + ", suppressed: " + this.getSuppressedState()
            + ", retain: " + this.getRetain()
            + ", message: " + this.getMessage()
            + ", comment: " + this.getComment();
    }
    /**
     * @class ConditionSnapshot
     * @param varName
     * @param value
     * @private
     */
    _set_twoStateVariable(varName, value) {
        value = !!value;
        const hrKey = ConditionSnapshot.normalizeName(varName);
        const idKey = ConditionSnapshot.normalizeName(varName) + ".id";
        const variant = new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.Boolean, value });
        this._map[idKey] = variant;
        // also change varName with human readable text
        const twoStateNode = this._node_index[hrKey];
        if (!twoStateNode) {
            throw new Error("Cannot find twoState Varaible with name " + varName);
        }
        if (!(twoStateNode instanceof ua_two_state_variable_1.UATwoStateVariable)) {
            throw new Error("Cannot find twoState Varaible with name " + varName + " " + twoStateNode);
        }
        const txt = value ? twoStateNode._trueState : twoStateNode._falseState;
        const hrValue = new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.LocalizedText,
            value: node_opcua_data_model_1.coerceLocalizedText(txt)
        });
        this._map[hrKey] = hrValue;
        const node = this._node_index[idKey];
        // also change ConditionNode if we are on currentBranch
        if (this.isCurrentBranch()) {
            node_opcua_assert_1.assert(twoStateNode instanceof ua_two_state_variable_1.UATwoStateVariable);
            twoStateNode.setValue(value);
            // xx console.log("Is current branch", twoStateNode.toString(),variant.toString());
            // xx console.log("  = ",twoStateNode.getValue());
        }
        this.emit("value_changed", node, variant);
    }
    _get_twoStateVariable(varName) {
        const key = ConditionSnapshot.normalizeName(varName) + ".id";
        const variant = this._map[key];
        // istanbul ignore next
        if (!variant) {
            return "???";
            // throw new Error("Cannot find TwoStateVariable with name " + varName);
        }
        return variant.value;
    }
}
exports.ConditionSnapshot = ConditionSnapshot;
ConditionSnapshot.normalizeName = normalizeName;
//# sourceMappingURL=condition_snapshot.js.map