import { NodeId } from "node-opcua-nodeid";
import { Variant } from "node-opcua-variant";
import { EventFilter, SimpleAttributeOperand } from "./imports";
/**
 * helper to construct event filters:
 * construct a simple event filter
 *
 *
 * @example
 *
 *     constructEventFilter(["SourceName","Message","ReceiveTime"]);
 *
 *     constructEventFilter(["SourceName",{namespaceIndex:2 , "MyData"}]);
 *     constructEventFilter(["SourceName","2:MyData" ]);
 *
 *     constructEventFilter(["SourceName" ,["EnabledState","EffectiveDisplayName"] ]);
 *     constructEventFilter(["SourceName" ,"EnabledState.EffectiveDisplayName" ]);
 *
 */
export declare function constructEventFilter(arrayOfNames: string[] | string, conditionTypes?: NodeId[] | NodeId): EventFilter;
/**
 * @class SimpleAttributeOperand
 * @method toShortString
 * @return {String}
 *
 * @example:
 *
 *
 */
export declare function simpleAttributeOperandToShortString(self: SimpleAttributeOperand, addressSpace: any): string;
/**
 * @method extractEventFields
 * extract a array of eventFields from a event node, matching the selectClauses
 * @param selectClauses
 * @param eventData : a pseudo Node that provides a browse Method and a readValue(nodeId)
 */
export declare function extractEventFields(selectClauses: SimpleAttributeOperand[], eventData: any): Variant[];
