import { AddReferenceOpts, BaseNode } from "../source";
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
export declare function assertHasMatchingReference(node: BaseNode, reference: AddReferenceOpts): void;
