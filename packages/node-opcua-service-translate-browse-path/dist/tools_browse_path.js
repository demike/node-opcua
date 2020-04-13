"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-translate-browse-path
 * @class ToolBrowsePath
 * @static
 */
const node_opcua_constants_1 = require("node-opcua-constants");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const imports_1 = require("./imports");
const hierarchicalReferencesId = node_opcua_nodeid_1.makeNodeId(node_opcua_constants_1.ReferenceTypeIds.HierarchicalReferences);
var node_opcua_data_model_1 = require("node-opcua-data-model");
exports.stringToQualifiedName = node_opcua_data_model_1.stringToQualifiedName;
/**
 * @method constructBrowsePathFromQualifiedName
 * @param startingNode
 * @param targetNames
 * @return {BrowsePath}
 */
function constructBrowsePathFromQualifiedName(startingNode, targetNames) {
    targetNames = targetNames || [];
    const elements = targetNames.map((targetName) => {
        return {
            isInverse: false,
            includeSubtypes: true,
            referenceTypeId: hierarchicalReferencesId,
            targetName
        };
    });
    const browsePath = new imports_1.BrowsePath({
        relativePath: { elements },
        startingNode: startingNode.nodeId,
    });
    return browsePath;
}
exports.constructBrowsePathFromQualifiedName = constructBrowsePathFromQualifiedName;
//# sourceMappingURL=tools_browse_path.js.map