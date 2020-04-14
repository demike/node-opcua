import { NodeClass } from "node-opcua-data-model";
import { AttributeIds } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { NodeId } from "node-opcua-nodeid";
import { InstantiateObjectOptions, UAObject as UAObjectPublic, UAObjectType as UAObjectTypePublic } from "../source";
import { BaseNode } from "./base_node";
import { SessionContext } from "./session_context";
import * as tools from "./tool_isSupertypeOf";
export declare class UAObjectType extends BaseNode implements UAObjectTypePublic {
    readonly nodeClass = NodeClass.ObjectType;
    readonly isAbstract: boolean;
    /**
     * returns true if the object has some opcua methods
     */
    readonly hasMethods: boolean;
    readonly subtypeOf: NodeId | null;
    readonly subtypeOfObj: UAObjectTypePublic | null;
    isSupertypeOf: tools.IsSupertypeOfFunc<UAObjectTypePublic>;
    constructor(options: any);
    readAttribute(context: SessionContext, attributeId: AttributeIds): DataValue;
    /**
     * instantiate an object of this UAObjectType
     * The instantiation takes care of object type inheritance when constructing inner properties and components.
     * @method instantiate
     * @param options
     * @param options.browseName
     * @param [options.description]
     * @param [options.organizedBy] the parent Folder holding this object
     * @param [options.componentOf] the parent Object holding this object
     * @param [options.notifierOf]
     * @param [options.eventSourceOf]
     * @param [options.optionals = [] name of the optional child to create
     * @param [options.modellingRule]
     *
     *
     * Note : HasComponent usage scope
     *
     *    Source          |     Destination
     * -------------------+---------------------------
     *  Object            | Object, Variable,Method
     *  ObjectType        |
     * -------------------+---------------------------
     *  DataVariable      | Variable
     *  DataVariableType  |
     */
    instantiate(options: InstantiateObjectOptions): UAObjectPublic;
    toString(): string;
}
