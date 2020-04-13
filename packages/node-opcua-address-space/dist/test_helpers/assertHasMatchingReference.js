"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
/**
 * asserts that the provided reference exists in the node references
 *
 * @method assertHasMatchingReference
 *
 * @param node
 * @param reference (Reference}
 * @param reference.referenceType {String}
 * @param reference.nodeId        {NodeId}
 * @param reference.isForward     {Boolean}
 *
 * @example:
 *
 *     assertHasMatchingReference(node,{ referenceType: "Organizes",i sForward:true, nodeId: "ns=1,i=12" });
 *
 *
 */
function assertHasMatchingReference(node, reference) {
    const addressSpace = node.addressSpace;
    const normalizedReference = addressSpace.normalizeReferenceType(reference);
    node_opcua_assert_1.assert(normalizedReference.referenceType instanceof node_opcua_nodeid_1.NodeId);
    let refs = node.findReferences(normalizedReference.referenceType, normalizedReference.isForward);
    refs = refs.filter((ref) => {
        return node_opcua_nodeid_1.sameNodeId(ref.nodeId, normalizedReference.nodeId);
    });
    const dispOpts = { addressSpace };
    if (refs.length !== 1) {
        throw new Error(" Cannot find reference " + JSON.stringify(normalizedReference));
    }
    node_opcua_assert_1.assert(refs.length === 1);
}
exports.assertHasMatchingReference = assertHasMatchingReference;
//# sourceMappingURL=assertHasMatchingReference.js.map