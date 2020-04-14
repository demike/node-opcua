/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
import { NodeId } from "node-opcua-nodeid";
import { NamespacePrivate } from "../namespace_private";
import { UAExclusiveLimitAlarm } from "./ua_exclusive_limit_alarm";
/**
 * @class UAExclusiveLevelAlarm
 * @extends UAExclusiveLimitAlarm
 * @constructor
 */
export declare class UAExclusiveLevelAlarm extends UAExclusiveLimitAlarm {
    static instantiate(namespace: NamespacePrivate, type: NodeId | string, option: any, data: any): UAExclusiveLevelAlarm;
}
