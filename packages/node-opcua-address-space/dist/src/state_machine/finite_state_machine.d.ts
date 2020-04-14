import { NodeId } from "node-opcua-nodeid";
import { State, Transition, UAObject as UAObjectPublic, UAVariable as UAVariablePublic } from "../../source";
import { BaseNode } from "../base_node";
import { UAObject } from "../ua_object";
export interface StateMachine {
    /**
     * @property currentState
     */
    currentState: UAVariablePublic;
    _currentStateNode: State | null;
}
export declare class StateMachine extends UAObject implements StateMachine {
    getStates(): UAObject[];
    readonly states: any[];
    /**
     * @method getStateByName
     * @param name  the name of the state to get
     * @return the state with the given name
     */
    getStateByName(name: string): State | null;
    getTransitions(): Transition[];
    readonly transitions: Transition[];
    /**
     * return the node InitialStateType
     * @property initialState
     */
    readonly initialState: UAObject;
    /**
     *
     * @param node
     * @private
     */
    _coerceNode(node: State | BaseNode | null | string | NodeId): BaseNode | null;
    /**
     * @method isValidTransition
     * @param toStateNode
     * @return {boolean}
     */
    isValidTransition(toStateNode: State | string): boolean;
    /**
     */
    findTransitionNode(fromStateNode: NodeId | State | string | null, toStateNode: NodeId | State | string | null): Transition | null;
    /**
    * @property currentStateNode
    * @type BaseNode
    */
    currentStateNode: State | null;
    /**
     */
    getCurrentState(): string | null;
    /**
     * @method setState
     */
    setState(toStateNode: string | State | null): void;
    /**
     * @internal
     * @private
     */
    _post_initialize(): void;
}
export declare function promoteToStateMachine(node: UAObjectPublic): StateMachine;
