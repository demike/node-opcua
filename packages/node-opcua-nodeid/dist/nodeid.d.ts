/// <reference types="node" />
import { Guid } from "node-opcua-guid";
/**
 * `NodeIdType` an enumeration that specifies the possible types of a `NodeId` value.
 */
export declare enum NodeIdType {
    /**
     * @static
     * @property NUMERIC
     * @default 0x1
     */
    NUMERIC = 1,
    /**
     * @static
     * @property STRING
     * @default 0x2
     */
    STRING = 2,
    /**
     * @static
     * @property GUID
     * @default 0x3
     */
    GUID = 3,
    /**
     * @static
     * @property BYTESTRING
     * @default 0x4
     */
    BYTESTRING = 4
}
/**
 * Construct a node ID
 *
 * @class NodeId
 * @example
 *
 *    ``` javascript
 *    const nodeId = new NodeId(NodeIdType.NUMERIC,123,1);
 *    ```
 * @constructor
 */
export declare class NodeId {
    static NodeIdType: typeof NodeIdType;
    static nullNodeId: NodeId;
    static resolveNodeId: (a: string | NodeId) => NodeId;
    static sameNodeId: (n1: NodeId, n2: NodeId) => boolean;
    identifierType: NodeIdType;
    value: number | string | Buffer | Guid;
    namespace: number;
    /**
     * @param identifierType   - the nodeID type
     * @param value            - the node id value. The type of Value depends on identifierType.
     * @param namespace        - the index of the related namespace (optional , default value = 0 )
     */
    constructor(identifierType: NodeIdType, value: any, namespace?: number);
    /**
     * get the string representation of the nodeID.
     *
     * @method toString
     * @example
     *
     *    ``` javascript
     *    const nodeid = new NodeId(NodeIdType.NUMERIC, 123,1);
     *    console.log(nodeid.toString());
     *    ```
     *
     *    ```
     *    >"ns=1;i=123"
     *    ```
     *
     * @param [options.addressSpace] {AddressSpace}
     * @return {String}
     */
    toString(options?: {
        addressSpace?: any;
    }): string;
    /**
     * convert nodeId to a JSON string. same as {@link NodeId#toString }
     */
    toJSON(): string;
    displayText(): string;
    /**
     * returns true if the NodeId is null or empty
     */
    isEmpty(): boolean;
}
export declare type NodeIdLike = string | NodeId | number;
/**
 * Convert a value into a nodeId:
 * @class opcua
 * @method coerceNodeId
 * @static
 *
 * @description:
 *    - if nodeId is a string of form : "i=1234" => nodeId({value=1234, identifierType: NodeIdType.NUMERIC})
 *    - if nodeId is a string of form : "s=foo"  => nodeId({value="foo", identifierType: NodeIdType.STRING})
 *    - if nodeId is a {@link NodeId} :  coerceNodeId returns value
 * @param value
 * @param namespace {number}
 */
export declare function coerceNodeId(value: any, namespace?: number): NodeId;
/**
 * construct a node Id from a value and a namespace.
 * @class opcua
 * @method makeNodeId
 * @static
 * @param {String|Buffer} value
 * @param [namespace]=0 {Number} the node id namespace
 * @return {NodeId}
 */
export declare function makeNodeId(value: string | Buffer | number, namespace?: number): NodeId;
/**
 * @class opcua
 * @method resolveNodeId
 * @static
 * @param nodeIdOrString
 * @return the nodeId
 */
export declare function resolveNodeId(nodeIdOrString: NodeIdLike): NodeId;
export declare function sameNodeId(n1: NodeId, n2: NodeId): boolean;
