/// <reference types="node" />
import { Guid } from "node-opcua-guid";
import { NodeId, NodeIdType } from "./nodeid";
/**
 * An ExpandedNodeId extends the NodeId structure.
 *
 * An ExpandedNodeId extends the NodeId structure by allowing the NamespaceUri to be
 * explicitly specified instead of using the NamespaceIndex. The NamespaceUri is optional. If it
 * is specified then the NamespaceIndex inside the NodeId shall be ignored.
 *
 * The ExpandedNodeId is encoded by first encoding a NodeId as described in Clause 5 .2.2.9
 * and then encoding NamespaceUri as a String.
 *
 * An instance of an ExpandedNodeId may still use the NamespaceIndex instead of the
 * NamespaceUri. In this case, the NamespaceUri is not encoded in the stream. The presence of
 * the NamespaceUri in the stream is indicated by setting the NamespaceUri flag in the encoding
 * format byte for the NodeId.
 *
 * If the NamespaceUri is present then the encoder shall encode the NamespaceIndex as 0 in
 * the stream when the NodeId portion is encoded. The unused NamespaceIndex is included in
 * the stream for consistency,
 *
 * An ExpandedNodeId may also have a ServerIndex which is encoded as a UInt32 after the
 * NamespaceUri. The ServerIndex flag in the NodeId encoding byte indicates whether the
 * ServerIndex is present in the stream. The ServerIndex is omitted if it is equal to zero.
 *
 * @class  ExpandedNodeId
 * @extends NodeId
 *
 *
 *
 * @param identifierType   - the nodeID type
 * @param value            - the node id value. The type of Value depends on identifierType.
 * @param namespace        - the index of the related namespace (optional , default value = 0 )
 * @param namespaceUri     - NamespaceUri
 * @param serverIndex      - the server Index
 * @constructor
 */
export declare class ExpandedNodeId extends NodeId {
    static nullExpandedNodeId: ExpandedNodeId;
    static fromNodeId(nodeId: NodeId, namespaceUri?: string, serverIndex?: number): ExpandedNodeId;
    namespaceUri: null | string;
    serverIndex: number;
    constructor(identifierType: NodeIdType, value: number | string | Guid | Buffer, namespace: number, namespaceUri?: null | string, serverIndex?: number);
    /**
     * @method toString
     * @return {string}
     */
    toString(): string;
    /**
     * convert nodeId to a JSON string. same as {@link NodeId#toString }
     * @method  toJSON
     * @return {String}
     */
    toJSON(): any;
}
export declare function coerceExpandedNodeId(value: any): ExpandedNodeId;
/**
 * @method  makeExpandedNodeId
 * @param  value
 * @param [namespace=0] the namespace
 * @return {ExpandedNodeId}
 */
export declare function makeExpandedNodeId(value: any, namespace?: number): ExpandedNodeId;
