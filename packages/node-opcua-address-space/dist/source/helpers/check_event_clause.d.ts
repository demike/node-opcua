import { SimpleAttributeOperand } from "node-opcua-service-filter";
import { StatusCode } from "node-opcua-status-code";
import { BaseNode, UAObjectType } from "../address_space_ts";
/**
 * @method checkSelectClause
 * @param parentNode
 * @param selectClause
 * @return {Array<StatusCode>}
 */
export declare function checkSelectClause(parentNode: BaseNode, selectClause: SimpleAttributeOperand): StatusCode;
/**
 * @method checkSelectClauses
 * @param eventTypeNode
 * @param selectClauses
 * @return an array of StatusCode
 */
export declare function checkSelectClauses(eventTypeNode: UAObjectType, selectClauses: SimpleAttributeOperand[]): StatusCode[];
