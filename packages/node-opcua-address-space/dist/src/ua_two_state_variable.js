"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_nodeid_2 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const ua_variable_1 = require("./ua_variable");
const hasTrueSubState_ReferenceTypeNodeId = node_opcua_nodeid_1.resolveNodeId("HasTrueSubState");
const hasFalseSubState_ReferenceTypeNodeId = node_opcua_nodeid_1.resolveNodeId("HasFalseSubState");
// Release 1.03 12 OPC Unified Architecture, Part 9
// Two-state state machines
// Most states defined in this standard are simple – i.e. they are either TRUE or FALSE. The
// TwoStateVariableType is introduced specifically for this use case. More complex states are
// modelled by using a StateMachineType defined in Part 5.
// The TwoStateVariableType is derived from the StateVariableType.
//
// Attribute        Value
// BrowseName       TwoStateVariableType
// DataType         LocalizedText
// ValueRank        -1 (-1 = Scalar)
// IsAbstract       False
//
// Subtype of the StateVariableType defined in Part 5.
// Note that a Reference to this subtype is not shown in the definition of the StateVariableType
//
// References      NodeClass BrowseName              DataType      TypeDefinition Modelling Rule
// HasProperty     Variable  Id                      Boolean       PropertyType   Mandatory
// HasProperty     Variable  TransitionTime          UtcTime       PropertyType   Optional
// HasProperty     Variable  EffectiveTransitionTime UtcTime       PropertyType   Optional
// HasProperty     Variable  TrueState               LocalizedText PropertyType   Optional
// HasProperty     Variable  FalseState              LocalizedText PropertyType   Optional
// HasTrueSubState StateMachine or
//                 TwoStateVariableType
//                                                  <StateIdentifier> Defined in Clause 5.4.2 Optional
// HasFalseSubState StateMachine or
//                  TwoStateVariableType
//                                                  <StateIdentifier> Defined in Clause 5.4.3 Optional
function _updateTransitionTime(node) {
    // TransitionTime specifies the time when the current state was entered.
    if (node.transitionTime) {
        node.transitionTime.setValueFromSource({ dataType: node_opcua_variant_2.DataType.DateTime, value: (new Date()) });
    }
}
function _updateEffectiveTransitionTime(node) {
    if (node.effectiveTransitionTime) {
        // xx console.log("xxxx _updateEffectiveTransitionTime
        // because subStateNode ",subStateNode.browseName.toString());
        node.effectiveTransitionTime.setValueFromSource({
            dataType: node_opcua_variant_2.DataType.DateTime,
            value: (new Date())
        });
    }
}
function _getEffectiveDisplayName(node) {
    const dataValue = node.id.readValue();
    if (dataValue.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
        return dataValue;
    }
    node_opcua_assert_1.assert(dataValue.value.dataType === node_opcua_variant_2.DataType.Boolean);
    const boolValue = dataValue.value.value;
    const humanReadableString = _getHumanReadableString(node);
    let subStateNodes;
    if (boolValue) {
        subStateNodes = node.findReferencesExAsObject("HasTrueSubState", node_opcua_data_model_1.BrowseDirection.Forward);
    }
    else {
        subStateNodes = node.findReferencesExAsObject("HasFalseSubState", node_opcua_data_model_1.BrowseDirection.Forward);
    }
    const states = subStateNodes.forEach((n) => {
        // todo happen
    });
    return humanReadableString;
}
function _getHumanReadableString(node) {
    let dataValue = node.id.readValue();
    if (dataValue.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
        return dataValue;
    }
    node_opcua_assert_1.assert(dataValue.value.dataType === node_opcua_variant_2.DataType.Boolean);
    const boolValue = dataValue.value.value;
    // The Value Attribute of a TwoStateVariable contains the current state as a human readable name.
    // The EnabledState for example, might contain the name “Enabled” when TRUE and “Disabled” when FALSE.
    let valueAsLocalizedText;
    if (boolValue) {
        const _trueState = (node._trueState) ? node._trueState : "TRUE";
        valueAsLocalizedText = { dataType: "LocalizedText", value: { text: _trueState } };
    }
    else {
        const _falseState = (node._falseState) ? node._falseState : "FALSE";
        valueAsLocalizedText = { dataType: "LocalizedText", value: { text: _falseState } };
    }
    dataValue = dataValue.clone();
    dataValue.value = new node_opcua_variant_1.Variant(valueAsLocalizedText);
    return dataValue;
}
function _install_TwoStateVariable_machinery(node, options) {
    node_opcua_assert_1.assert(node.dataTypeObj.browseName.toString() === "LocalizedText");
    node_opcua_assert_1.assert(node.minimumSamplingInterval === 0);
    node_opcua_assert_1.assert(node.typeDefinitionObj.browseName.toString() === "TwoStateVariableType");
    node_opcua_assert_1.assert(node.dataTypeObj.browseName.toString() === "LocalizedText");
    node_opcua_assert_1.assert(node.hasOwnProperty("valueRank") && (node.valueRank === -1 || node.valueRank === 0));
    options = options || {};
    // promote node into a UATwoStateVariable
    Object.setPrototypeOf(node, UATwoStateVariable.prototype);
    node.initialize(options);
    return node;
}
exports._install_TwoStateVariable_machinery = _install_TwoStateVariable_machinery;
/***
 * @class UATwoStateVariable
 * @constructor
 * @extends UAVariable
 */
class UATwoStateVariable extends ua_variable_1.UAVariable {
    constructor(opts) {
        super(opts);
    }
    get isFalseSubStateOf() { return super.isFalseSubStateOf; }
    get isTrueSubStateOf() { return super.isTrueSubStateOf; }
    initialize(options) {
        const node = this;
        if (options.trueState) {
            node_opcua_assert_1.assert(options.falseState);
            node_opcua_assert_1.assert(typeof (options.trueState) === "string");
            node_opcua_assert_1.assert(typeof (options.falseState) === "string");
            node._trueState = options.trueState;
            node._falseState = options.falseState;
            if (node.falseState) {
                node.falseState.bindVariable({
                    get() {
                        return new node_opcua_variant_1.Variant({
                            dataType: node_opcua_variant_2.DataType.LocalizedText,
                            value: node._falseState
                        });
                    }
                }, true);
            }
            if (node.trueState) {
                node.trueState.bindVariable({
                    get() {
                        return new node_opcua_variant_1.Variant({
                            dataType: node_opcua_variant_2.DataType.LocalizedText,
                            value: node._trueState
                        });
                    }
                }, true);
            }
        }
        node.id.setValueFromSource({
            dataType: "Boolean",
            value: false
        }, node_opcua_status_code_1.StatusCodes.UncertainInitialValue);
        // handle isTrueSubStateOf
        if (options.isTrueSubStateOf) {
            node.addReference({
                isForward: false,
                nodeId: options.isTrueSubStateOf,
                referenceType: "HasTrueSubState"
            });
        }
        if (options.isFalseSubStateOf) {
            node.addReference({
                isForward: false,
                nodeId: options.isFalseSubStateOf,
                referenceType: "HasFalseSubState"
            });
        }
        if (node.effectiveTransitionTime) {
            // install "value_changed" event handler on SubState that are already defined
            const subStates = [].concat(node.getTrueSubStates(), node.getFalseSubStates());
            for (const subState of subStates) {
                subState.on("value_changed", () => _updateEffectiveTransitionTime(node));
            }
        }
        // it should be possible to define a trueState and falseState LocalizedText even if
        // the trueState or FalseState node is not exposed. Therefore we need to store their value
        // into dedicated variables.
        node.id.on("value_changed", () => {
            node._internal_set_dataValue(_getHumanReadableString(node));
        });
        node._internal_set_dataValue(_getHumanReadableString(node));
        // todo : also set the effectiveDisplayName if present
        // from spec Part 5
        // Release 1.03 OPC Unified Architecture, Part 5
        // EffectiveDisplayName contains a human readable name for the current state of the state
        // machine after taking the state of any SubStateMachines in account. There is no rule specified
        // for which state or sub-state should be used. It is up to the Server and will depend on the
        // semantics of the StateMachineType
        //
        // EffectiveDisplayName will be constructed by adding the EnableSdtate
        // and the State of the addTrue state
        if (node.effectiveDisplayName) {
            node.id.on("value_changed", () => {
                node.effectiveDisplayName._internal_set_dataValue(_getEffectiveDisplayName(node));
            });
            node.effectiveDisplayName._internal_set_dataValue(_getEffectiveDisplayName(node));
        }
    }
    /**
     * @method setValue
     * @param boolValue {Boolean}
     */
    setValue(boolValue) {
        const node = this;
        node_opcua_assert_1.assert(_.isBoolean(boolValue));
        const dataValue = node.id.readValue();
        const oldValue = dataValue.value.value;
        if (dataValue.statusCode === node_opcua_status_code_1.StatusCodes.Good && boolValue === oldValue) {
            return; // nothing to do
        }
        //
        node.id.setValueFromSource(new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_2.DataType.Boolean, value: boolValue }));
        _updateTransitionTime(node);
        _updateEffectiveTransitionTime(node);
    }
    /**
     * @method getValue
     * @return {Boolean}
     */
    getValue() {
        const node = this;
        const dataValue = node.id.readValue();
        node_opcua_assert_1.assert(dataValue.statusCode === node_opcua_status_code_1.StatusCodes.Good);
        node_opcua_assert_1.assert(dataValue.value.dataType === node_opcua_variant_2.DataType.Boolean);
        return dataValue.value.value;
    }
    /**
     * @method getValueAsString
     * @return {string}
     */
    getValueAsString() {
        const node = this;
        const dataValue = node.readValue();
        node_opcua_assert_1.assert(dataValue.statusCode === node_opcua_status_code_1.StatusCodes.Good);
        node_opcua_assert_1.assert(dataValue.value.dataType === node_opcua_variant_2.DataType.LocalizedText);
        return dataValue.value.value.text.toString();
    }
    // TODO : shall we care about overloading the remove_backward_reference method ?
    // some TrueSubState and FalseSubState relationship may be added later
    // so we need a mechanism to keep adding the "value_changed" event handle on subStates that
    // will be defined later.
    // install change detection on sub State
    // this is useful to change the effective transitionTime
    // EffectiveTransitionTime specifies the time when the current state or one of its sub states was entered.
    // If, for example, a LevelAlarm is active and – while active – switches several times between High and
    // HighHigh, then the TransitionTime stays at the point in time where the Alarm became active whereas the
    // EffectiveTransitionTime changes with each shift of a sub state.
    _add_backward_reference(reference) {
        const self = this;
        super._add_backward_reference(reference);
        if (reference.isForward &&
            (node_opcua_nodeid_2.sameNodeId(reference.referenceType, hasTrueSubState_ReferenceTypeNodeId) ||
                node_opcua_nodeid_2.sameNodeId(reference.referenceType, hasFalseSubState_ReferenceTypeNodeId))) {
            const addressSpace = self.addressSpace;
            // add event handle
            const subState = addressSpace.findNode(reference.nodeId);
            subState.on("value_changed", _updateEffectiveTransitionTime.bind(null, self, subState));
        }
    }
}
exports.UATwoStateVariable = UATwoStateVariable;
// ;
// exports.UATwoStateVariable = UATwoStateVariable;
//
// exports.install = function(AddressSpace) {
//
//     assert(_.isUndefined(AddressSpace._install_TwoStateVariable_machinery ));
//     AddressSpace._install_TwoStateVariable_machinery = _install_TwoStateVariable_machinery;
//
//     /**
//      *
//      * @method addTwoStateVariable
//      *
//      * @param options
//      * @param options.browseName  {String}
//      * @param [options.description {String}]
//      * @param [options.modellingRule {String}]
//      * @param [options.minimumSamplingInterval {Number} =0]
//      * @param options.componentOf {Node|NodeId}
//      * @param options.propertyOf {Node|NodeId}
//      * @param options.trueState {String}
//      * @param options.falseState {String}
//      * @param [options.isTrueSubStateOf {NodeId}]
//      * @param [options.isFalseSubStateOf {NodeId}]
//      * @param [options.modellingRule]
//      * @return {UATwoStateVariable}
//      *
//      * Optionals can be EffectiveDisplayName, TransitionTime, EffectiveTransitionTime
//      */
//     AddressSpace.prototype.addTwoStateVariable   = function(options) {
//         return this._resolveRequestedNamespace(options).addTwoStateVariable(options);
//     };
// };
//# sourceMappingURL=ua_two_state_variable.js.map