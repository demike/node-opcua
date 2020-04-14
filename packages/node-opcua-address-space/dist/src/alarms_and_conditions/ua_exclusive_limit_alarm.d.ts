import { NodeId } from "node-opcua-nodeid";
import { UAEventType } from "../../source";
import { NamespacePrivate } from "../namespace_private";
import { StateMachine } from "../state_machine/finite_state_machine";
import { UALimitAlarm } from "./ua_limit_alarm";
export interface UAExclusiveLimitAlarm extends UALimitAlarm {
    limitState: StateMachine;
}
export declare class UAExclusiveLimitAlarm extends UALimitAlarm {
    /***
     *
     * @method (static)instantiate
     * @param namespace {Namespace}
     * @param type
     * @param options
     * @param data
     * @return {UAExclusiveLimitAlarm}
     */
    static instantiate(namespace: NamespacePrivate, type: UAEventType | string | NodeId, options: any, data: any): UAExclusiveLimitAlarm;
    _signalNewCondition(stateName: string | null, isActive: boolean, value: any): void;
    _setStateBasedOnInputValue(value: number): void;
}
