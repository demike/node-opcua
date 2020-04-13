"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const base_node_1 = require("../base_node");
const ua_object_1 = require("../ua_object");
const ua_object_type_1 = require("../ua_object_type");
const doDebug = false;
function getComponentFromTypeAndSubtype(typeDef) {
    const components_parts = [];
    components_parts.push(typeDef.getComponents());
    while (typeDef.subtypeOfObj) {
        typeDef = typeDef.subtypeOfObj;
        components_parts.push(typeDef.getComponents());
    }
    return [].concat.apply([], components_parts);
}
/*
 *
 * @class StateMachine
 * @constructor
 * @extends UAObject
 *
 *
 */
class StateMachine extends ua_object_1.UAObject {
    getStates() {
        const addressSpace = this.addressSpace;
        const initialStateType = addressSpace.findObjectType("InitialStateType");
        if (!initialStateType) {
            throw new Error("cannot find InitialStateType");
        }
        const stateType = addressSpace.findObjectType("StateType");
        if (!stateType) {
            throw new Error("cannot find StateType");
        }
        node_opcua_assert_1.assert(initialStateType.isSupertypeOf(stateType));
        const typeDef = this.typeDefinitionObj;
        let comp = getComponentFromTypeAndSubtype(typeDef);
        comp = comp.filter((c) => {
            if (!(c.typeDefinitionObj instanceof ua_object_type_1.UAObjectType)) {
                return false;
            }
            return c.typeDefinitionObj.isSupertypeOf(stateType);
        });
        return comp;
    }
    get states() {
        return this.getStates();
    }
    /**
     * @method getStateByName
     * @param name  the name of the state to get
     * @return the state with the given name
     */
    getStateByName(name) {
        let states = this.getStates();
        states = states.filter((s) => {
            return s.browseName.name === name;
        });
        node_opcua_assert_1.assert(states.length <= 1);
        return states.length === 1 ? states[0] : null;
    }
    getTransitions() {
        const addressSpace = this.addressSpace;
        const transitionType = addressSpace.findObjectType("TransitionType");
        const typeDef = this.typeDefinitionObj;
        let comp = getComponentFromTypeAndSubtype(typeDef);
        comp = comp.filter((c) => {
            if (!(c.typeDefinitionObj instanceof ua_object_type_1.UAObjectType)) {
                return false;
            }
            return c.typeDefinitionObj.isSupertypeOf(transitionType);
        });
        return comp;
    }
    get transitions() {
        return this.getTransitions();
    }
    /**
     * return the node InitialStateType
     * @property initialState
     */
    get initialState() {
        const addressSpace = this.addressSpace;
        const initialStateType = addressSpace.findObjectType("InitialStateType");
        const typeDef = this.typeDefinitionObj;
        let comp = getComponentFromTypeAndSubtype(typeDef);
        comp = comp.filter((c) => c.typeDefinitionObj === initialStateType);
        // istanbul ignore next
        if (comp.length > 1) {
            throw new Error(" More than 1 initial state in stateMachine");
        }
        return comp.length === 0 ? null : comp[0];
    }
    /**
     *
     * @param node
     * @private
     */
    _coerceNode(node) {
        if (node === null) {
            return null;
        }
        const addressSpace = this.addressSpace;
        if (node instanceof base_node_1.BaseNode) {
            return node;
        }
        else if (node instanceof node_opcua_nodeid_1.NodeId) {
            return addressSpace.findNode(node);
        }
        else if (_.isString(node)) {
            return this.getStateByName(node);
        }
        return null;
    }
    /**
     * @method isValidTransition
     * @param toStateNode
     * @return {boolean}
     */
    isValidTransition(toStateNode) {
        // is it legal to go from state currentState to toStateNode;
        if (!this.currentStateNode) {
            return true;
        }
        const n = this.currentState.readValue();
        // to be executed there must be a transition from currentState to toState
        const transition = this.findTransitionNode(this.currentStateNode, toStateNode);
        if (!transition) {
            // istanbul ignore next
            if (doDebug) {
                console.log(" No transition from ", this.currentStateNode.browseName.toString(), " to ", toStateNode.toString());
            }
            return false;
        }
        return true;
    }
    /**
     */
    findTransitionNode(fromStateNode, toStateNode) {
        const addressSpace = this.addressSpace;
        const _fromStateNode = this._coerceNode(fromStateNode);
        if (!_fromStateNode) {
            return null;
        }
        const _toStateNode = this._coerceNode(toStateNode);
        if (!_toStateNode) {
            return null;
        }
        node_opcua_assert_1.assert(_fromStateNode instanceof ua_object_1.UAObject);
        node_opcua_assert_1.assert(_toStateNode instanceof ua_object_1.UAObject);
        const stateType = addressSpace.findObjectType("StateType");
        if (!stateType) {
            throw new Error("Cannot find StateType");
        }
        node_opcua_assert_1.assert(_fromStateNode.typeDefinitionObj.isSupertypeOf(stateType));
        node_opcua_assert_1.assert(_toStateNode.typeDefinitionObj.isSupertypeOf(stateType));
        let transitions = _fromStateNode.findReferencesAsObject("FromState", false);
        transitions = transitions.filter((transition) => {
            node_opcua_assert_1.assert(transition.toStateNode.nodeClass === node_opcua_data_model_1.NodeClass.Object);
            return transition.toStateNode === _toStateNode;
        });
        if (transitions.length === 0) {
            // cannot find a transition from fromState to toState
            return null;
        }
        node_opcua_assert_1.assert(transitions.length === 1);
        return transitions[0];
    }
    get currentStateNode() {
        return this._currentStateNode;
    }
    /**
     * @property currentStateNode
     * @type BaseNode
     */
    set currentStateNode(value) {
        this._currentStateNode = value;
    }
    /**
     */
    getCurrentState() {
        // xx this.currentState.readValue().value.value.text
        // xx this.shelvingState.currentStateNode.browseName.toString()
        if (!this.currentStateNode) {
            return null;
        }
        return this.currentStateNode.browseName.toString();
    }
    /**
     * @method setState
     */
    setState(toStateNode) {
        if (!toStateNode) {
            this.currentStateNode = null;
            this.currentState.setValueFromSource({ dataType: node_opcua_variant_1.DataType.Null }, node_opcua_status_code_1.StatusCodes.BadStateNotActive);
            return;
        }
        if (_.isString(toStateNode)) {
            const state = this.getStateByName(toStateNode);
            // istanbul ignore next
            if (!state) {
                throw new Error("Cannot find state with name " + toStateNode);
            }
            node_opcua_assert_1.assert(state.browseName.name.toString() === toStateNode);
            toStateNode = state;
        }
        const fromStateNode = this.currentStateNode;
        toStateNode = this._coerceNode(toStateNode);
        node_opcua_assert_1.assert(toStateNode.nodeClass === node_opcua_data_model_1.NodeClass.Object);
        this.currentState.setValueFromSource({
            dataType: node_opcua_variant_1.DataType.LocalizedText,
            value: node_opcua_data_model_1.coerceLocalizedText(toStateNode.browseName.toString())
        }, node_opcua_status_code_1.StatusCodes.Good);
        this.currentStateNode = toStateNode;
        const transitionNode = this.findTransitionNode(fromStateNode, toStateNode);
        if (transitionNode) {
            // xx console.log("transitionNode ",transitionNode.toString());
            // The inherited Property SourceNode shall be filled with the NodeId of the StateMachine instance where the
            // Transition occurs. If the Transition occurs in a SubStateMachine, then the NodeId of the SubStateMachine
            // has to be used. If the Transition occurs between a StateMachine and a SubStateMachine, then the NodeId of
            // the StateMachine has to be used, independent of the direction of the Transition.
            // Transition identifies the Transition that triggered the Event.
            // FromState identifies the State before the Transition.
            // ToState identifies the State after the Transition.
            this.raiseEvent("TransitionEventType", {
                // Base EventType
                // xx nodeId:      this.nodeId,
                // TransitionEventType
                // TransitionVariableType
                "transition": {
                    dataType: "LocalizedText",
                    value: transitionNode.displayName[0]
                },
                "transition.id": transitionNode.transitionNumber.readValue().value,
                "fromState": {
                    dataType: "LocalizedText",
                    value: fromStateNode ? fromStateNode.displayName[0] : ""
                },
                "fromState.id": fromStateNode ? fromStateNode.stateNumber.readValue().value : {
                    dataType: "Null"
                },
                "toState": {
                    dataType: "LocalizedText",
                    value: toStateNode.displayName[0]
                },
                "toState.id": toStateNode.stateNumber.readValue().value
            });
        }
        else {
            if (fromStateNode && fromStateNode !== toStateNode) {
                if (doDebug) {
                    const f = fromStateNode.browseName.toString();
                    const t = toStateNode.browseName.toString();
                    // tslint:disable-next-line:no-console
                    console.log(chalk_1.default.red("Warning"), " cannot raise event :  transition " + f + " to " + t + " is missing");
                }
            }
        }
        // also update executable flags on methods
        for (const method of this.getMethods()) {
            method._notifyAttributeChange(node_opcua_data_model_2.AttributeIds.Executable);
        }
    }
    /**
     * @internal
     * @private
     */
    _post_initialize() {
        const addressSpace = this.addressSpace;
        const finiteStateMachineType = addressSpace.findObjectType("FiniteStateMachineType");
        if (!finiteStateMachineType) {
            throw new Error("cannot find FiniteStateMachineType");
        }
        // xx assert(this.typeDefinitionObj && !this.subtypeOfObj);
        // xxassert(!this.typeDefinitionObj || this.typeDefinitionObj.isSupertypeOf(finiteStateMachineType));
        // get current Status
        const d = this.currentState.readValue();
        if (d.statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            this.setState(null);
        }
        else {
            this.currentStateNode = this.getStateByName(d.value.value.text.toString());
        }
    }
}
exports.StateMachine = StateMachine;
function promoteToStateMachine(node) {
    if (node instanceof StateMachine) {
        return node; // already promoted
    }
    Object.setPrototypeOf(node, StateMachine.prototype);
    node_opcua_assert_1.assert(node instanceof StateMachine, "should now  be a State Machine");
    node._post_initialize();
    return node;
}
exports.promoteToStateMachine = promoteToStateMachine;
//# sourceMappingURL=finite_state_machine.js.map