"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-console
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_service_translate_browse_path_1 = require("node-opcua-service-translate-browse-path");
const node_opcua_status_code_1 = require("node-opcua-status-code");
/**
 * @method checkSelectClause
 * @param parentNode
 * @param selectClause
 * @return {Array<StatusCode>}
 */
function checkSelectClause(parentNode, selectClause) {
    //
    const addressSpace = parentNode.addressSpace;
    // istanbul ignore next
    if (selectClause.typeDefinitionId.isEmpty()) {
        return node_opcua_status_code_1.StatusCodes.Good;
    }
    const eventTypeNode = addressSpace.findEventType(selectClause.typeDefinitionId);
    if (!eventTypeNode || !(eventTypeNode.nodeClass === node_opcua_data_model_1.NodeClass.ObjectType)) {
        // xx console.log("eventTypeNode = ",selectClause.typeDefinitionId.toString());
        // xx console.log("eventTypeNode = ",eventTypeNode);
        // istanbul ignore next
        if (eventTypeNode) {
            console.log(eventTypeNode.toString());
        }
    }
    // istanbul ignore next
    if (eventTypeNode.nodeClass !== node_opcua_data_model_1.NodeClass.ObjectType) {
        throw new Error("Expecting a ObjectType");
    }
    // navigate to the innerNode specified by the browsePath [ QualifiedName]
    const browsePath = node_opcua_service_translate_browse_path_1.constructBrowsePathFromQualifiedName(eventTypeNode, selectClause.browsePath);
    const browsePathResult = addressSpace.browsePath(browsePath);
    return browsePathResult.statusCode;
}
exports.checkSelectClause = checkSelectClause;
/**
 * @method checkSelectClauses
 * @param eventTypeNode
 * @param selectClauses
 * @return an array of StatusCode
 */
function checkSelectClauses(eventTypeNode, selectClauses) {
    return selectClauses.map(checkSelectClause.bind(null, eventTypeNode));
}
exports.checkSelectClauses = checkSelectClauses;
//# sourceMappingURL=check_event_clause.js.map