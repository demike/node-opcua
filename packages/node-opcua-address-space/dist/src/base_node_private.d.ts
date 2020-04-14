import { LocalizedText } from "node-opcua-data-model";
import { ReferenceDescription } from "node-opcua-types";
import { AddressSpace, SessionContext, UAReferenceType as UAReferenceTypePublic } from "../source";
import { BaseNode as BaseNodePublic } from "../source";
import { BaseNode } from "./base_node";
import { Reference } from "./reference";
import { UAMethod } from "./ua_method";
import { UAObject } from "./ua_object";
import { UAObjectType } from "./ua_object_type";
import { UAVariable } from "./ua_variable";
import { UAVariableType } from "./ua_variable_type";
interface BaseNodeCache {
    __address_space: AddressSpace | null;
    _back_referenceIdx: any;
    _browseFilter?: (this: BaseNode, context?: SessionContext) => boolean;
    _cache: any;
    _description?: LocalizedText;
    _displayName: LocalizedText[];
    _parent?: BaseNodePublic | null;
    _referenceIdx: any;
    _subtype_idxVersion: number;
    _subtype_idx: any;
}
export declare function BaseNode_initPrivate(self: BaseNode): BaseNodeCache;
export declare function BaseNode_getPrivate(self: BaseNode): BaseNodeCache;
export interface ToStringOption {
    level: number;
    cycleDetector: any;
    padding: string;
    add(someline: string): void;
    indent(a: string, b: string | null): void;
}
export declare class ToStringBuilder implements ToStringOption {
    level: number;
    cycleDetector: any;
    padding: string;
    private str;
    constructor();
    add(line: string): void;
    toString(): string;
    indent(str: string, padding: string | null): string;
}
export declare function BaseNode_toString(this: BaseNode, options: ToStringOption): void;
export declare function BaseNode_References_toString(this: BaseNode, options: ToStringOption): void;
export declare function UAVariableType_toString(this: UAVariableType, options: ToStringOption): void;
export declare function UAVariable_toString(this: UAVariable, options: ToStringOption): void;
export declare function UAObject_toString(this: UAObject, options: ToStringOption): void;
export declare function UAObjectType_toString(this: UAObjectType, options: ToStringOption): void;
export declare function VariableOrVariableType_toString(this: UAVariableType | UAVariable, options: ToStringOption): void;
export declare function _clone_children_references(this: BaseNodePublic, newParent: BaseNodePublic, optionalFilter: any, extraInfo: any): void;
export declare function _clone_non_hierarchical_references(this: BaseNode, newParent: BaseNodePublic, optionalFilter: any, extraInfo: any): void;
/**
 * @method _clone
 * @private
 */
export declare function _clone(this: UAObject | UAVariable | UAMethod, Constructor: any, options: any, optionalFilter: any, extraInfo: any): BaseNode;
export declare function _handle_HierarchicalReference(node: BaseNode, reference: Reference): void;
export declare function _constructReferenceDescription(addressSpace: AddressSpace, references: Reference[], resultMask: number): ReferenceDescription[];
export declare function BaseNode_remove_backward_reference(this: BaseNode, reference: Reference): void;
export declare function BaseNode_add_backward_reference(this: BaseNode, reference: Reference): void;
export declare const ReferenceTypeCounter: {
    count: number;
};
/**
 * getSubtypeIndex
 * @returns {null|*}
 * @private
 */
export declare function getSubtypeIndex(this: UAReferenceTypePublic): any;
export declare function apply_condition_refresh(this: BaseNode, _cache?: any): void;
export {};
