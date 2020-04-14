import { NodeId, NodeIdLike } from "node-opcua-nodeid";
import { AddReferenceOpts, BaseNode, UAReference, UAReferenceType } from "../source";
export declare function isNodeIdString(str: string): boolean;
export interface MinimalistAddressSpace {
    findNode(nodeId: NodeIdLike): BaseNode | null;
    findReferenceType(referenceTypeId: NodeIdLike | UAReferenceType, namespaceIndex?: number): UAReferenceType | null;
}
export declare function resolveReferenceNode(addressSpace: MinimalistAddressSpace, reference: UAReference): BaseNode;
export declare function resolveReferenceType(addressSpace: MinimalistAddressSpace, reference: UAReference): UAReferenceType;
/**
 * @class Reference
 * @param options.referenceType {NodeId}
 * @param options.nodeId        {NodeId}
 * @param options.isForward     {Boolean}
 * @constructor
 */
export declare class Reference implements UAReference {
    static resolveReferenceNode(addressSpace: MinimalistAddressSpace, reference: UAReference): BaseNode;
    static resolveReferenceType(addressSpace: MinimalistAddressSpace, reference: UAReference): UAReferenceType;
    nodeId: NodeId;
    referenceType: NodeId;
    _referenceType?: UAReferenceType;
    readonly isForward: boolean;
    node?: BaseNode;
    private __hash?;
    constructor(options: AddReferenceOpts | Reference);
    /**
     * turn reference into a arrow :   ---- ReferenceType --> [NodeId]
     * @method toString
     * @return {String}
     */
    toString(options?: {
        addressSpace?: any;
    }): string;
    /**
     * @internal
     */
    readonly hash: string;
    /**
     * @internal
     */
    dispose(): void;
}
