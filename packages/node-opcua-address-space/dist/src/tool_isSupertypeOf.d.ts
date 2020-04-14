import { NodeId } from "node-opcua-nodeid";
import { UADataType, UAObjectType, UAReferenceType, UAVariableType } from "../source";
import { BaseNode } from "./base_node";
export interface BaseNodeConstructor<T extends BaseNode> {
    new (): T;
}
export declare type MemberFuncValue<T, P, R> = (this: T, param: P) => R;
export declare type IsSupertypeOfFunc<T extends UAType> = (this: T, baseType: T) => boolean;
export declare type UAType = UAReferenceType | UADataType | UAObjectType | UAVariableType;
export declare function construct_isSupertypeOf<T extends UAType>(Class: typeof BaseNode): IsSupertypeOfFunc<T>;
export declare function construct_slow_isSupertypeOf<T extends UAType>(Class: typeof BaseNode): (this: T, baseType: T) => boolean;
/**
 * returns the nodeId of the Type which is the super type of this
 */
export declare function get_subtypeOf<T extends BaseNode>(this: T): NodeId | null;
export declare function get_subtypeOfObj(this: BaseNode): BaseNode | null;
