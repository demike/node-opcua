"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_types_1 = require("node-opcua-types");
const make_relative_path_1 = require("./make_relative_path");
function _get_nodeId(node) {
    if (node.nodeId) {
        return node.nodeId;
    }
    return node_opcua_nodeid_1.resolveNodeId(node);
}
function makeBrowsePath(rootNode, relativePathBNF) {
    return new node_opcua_types_1.BrowsePath({
        startingNode: _get_nodeId(rootNode),
        relativePath: make_relative_path_1.makeRelativePath(relativePathBNF)
    });
}
exports.makeBrowsePath = makeBrowsePath;
//# sourceMappingURL=make_browse_path.js.map