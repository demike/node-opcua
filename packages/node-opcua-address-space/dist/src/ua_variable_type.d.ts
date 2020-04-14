import { NodeClass } from "node-opcua-data-model";
import { AttributeIds } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { InstantiateVariableOptions, UAMethod as UAMethodPublic, UAObject as UAObjectPublic, UAObjectType as UAObjectTypePublic, UAVariable as UAVariablePublic, UAVariableType as UAVariableTypePublic } from "../source";
import { AddressSpacePrivate } from "./address_space_private";
import { BaseNode } from "./base_node";
import { SessionContext } from "./session_context";
import * as tools from "./tool_isSupertypeOf";
export declare class UAVariableType extends BaseNode implements UAVariableTypePublic {
    readonly nodeClass = NodeClass.VariableType;
    readonly subtypeOf: NodeId | null;
    readonly subtypeOfObj: UAVariableType | null;
    isSupertypeOf: tools.IsSupertypeOfFunc<UAVariableTypePublic>;
    readonly isAbstract: boolean;
    dataType: NodeId;
    readonly accessLevel: number;
    readonly userAccessLevel: number;
    valueRank: number;
    arrayDimensions: number[];
    readonly minimumSamplingInterval: number;
    readonly value: any;
    historizing: boolean;
    constructor(options: any);
    readAttribute(context: SessionContext | null, attributeId: AttributeIds): DataValue;
    toString(): string;
    /**
     * instantiate an object of this UAVariableType
     * The instantiation takes care of object type inheritance when constructing inner properties
     * @method instantiate
     * @param options
     * @param options.browseName
     * @param [options.description]
     * @param [options.organizedBy]   the parent Folder holding this object
     * @param [options.componentOf]   the parent Object holding this object
     * @param [options.notifierOf]
     * @param [options.eventSourceOf]
     * @param [options.optionals]     array of browseName of optional component/property to instantiate.
     * @param [options.modellingRule]
     * @param [options.minimumSamplingInterval =0]
     * @param [options.extensionObject =null]
     * Note : HasComponent usage scope
     *
     *    Source          |     Destination
     * -------------------+---------------------------
     *  Object            | Object, Variable,Method
     *  ObjectType        |
     * -------------------+---------------------------
     *  DataVariable      | Variable
     *  DataVariableType  |
     *
     *
     *  see : OPCUA 1.03 page 44 $6.4 Instances of ObjectTypes and VariableTypes
     */
    instantiate(options: InstantiateVariableOptions): UAVariablePublic;
}
export declare function assertUnusedChildBrowseName(addressSpace: AddressSpacePrivate, options: any): void;
export declare function initialize_properties_and_components<B extends UAObjectPublic | UAVariablePublic | UAMethodPublic, T extends UAVariableTypePublic | UAObjectTypePublic>(instance: B, topMostType: T, nodeType: T, optionals?: string[]): void;
