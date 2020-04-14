import { NodeId } from "node-opcua-nodeid";
import { BaseNode } from "./base_node";
export declare function _handle_add_reference_change_event(node1: BaseNode, node2id: NodeId): void;
export declare function _handle_model_change_event(node: BaseNode): void;
export declare function _handle_delete_node_model_change_event(node: BaseNode): void;
