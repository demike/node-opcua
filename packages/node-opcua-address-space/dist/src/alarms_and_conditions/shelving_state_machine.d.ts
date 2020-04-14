/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
/// <reference types="node" />
import { UAMethod } from "../../source";
import { StateMachine } from "../state_machine/finite_state_machine";
import { UAObject } from "../ua_object";
import { UAVariable } from "../ua_variable";
export interface ShelvingStateMachine {
    unshelve: UAMethod;
    timedShelve: UAMethod;
    oneShotShelve: UAMethod;
    unshelveTime: UAVariable;
    _timer: NodeJS.Timer | null;
    _sheveldTime: Date;
    _unshelvedTime: Date;
    _duration: number;
}
export declare class ShelvingStateMachine extends StateMachine {
    static promote(object: UAObject): ShelvingStateMachine;
}
export declare function _clear_timer_if_any(shelvingState: ShelvingStateMachine): void;
