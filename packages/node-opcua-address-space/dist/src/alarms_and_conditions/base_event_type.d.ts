import { NodeId } from "node-opcua-nodeid";
import { UAVariableT } from "../../source";
import { BaseNode } from "../base_node";
import { UAObject } from "../ua_object";
export interface BaseEventType extends UAObject {
    sourceName: UAVariableT<string>;
    sourceNode: UAVariableT<NodeId>;
}
/**
 * @class BaseEventType
 * @class UAObject
 * @constructor
 */
export declare class BaseEventType extends UAObject {
    /**
     * @method setSourceName
     * @param name
     */
    setSourceName(name: string): void;
    /**
     * @method setSourceNode
     * @param node {NodeId|UAObject}
     */
    setSourceNode(node: NodeId | BaseNode): void;
}
