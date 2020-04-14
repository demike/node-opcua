import { NodeId } from "node-opcua-nodeid";
import { AddReferenceOpts, CreateNodeOptions, ModellingRuleType, Namespace } from "../source";
import { AddressSpacePrivate } from "./address_space_private";
import { BaseNode } from "./base_node";
export interface NamespacePrivate extends Namespace {
    addressSpace: AddressSpacePrivate;
    _nodeid_index: {
        [key: string]: BaseNode;
    };
    _construct_nodeId(options: any): NodeId;
    resolveAlias(name: string): NodeId | null;
    dispose(): void;
    _build_new_NodeId(): NodeId;
    _register(node: BaseNode): void;
    _deleteNode(node: BaseNode): void;
    _createNode(options: CreateNodeOptions): BaseNode;
}
export declare const NamespacePrivate: {
    new (options: any): NamespacePrivate;
};
/**
 * @param references
 * @param modellingRule
 * @private
 */
export declare function UANamespace_process_modelling_rule(references: AddReferenceOpts[], modellingRule: ModellingRuleType): void;
