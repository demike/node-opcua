import { NodeClass } from "node-opcua-data-model";
import { AttributeIds } from "node-opcua-data-model";
import { DataValue } from "node-opcua-data-value";
import { ExtensionObject } from "node-opcua-extension-object";
import { NodeId } from "node-opcua-nodeid";
import { SessionContext, UADataType as UADataTypePublic } from "../source";
import { BaseNode } from "./base_node";
import { ToStringOption } from "./base_node_private";
import * as tools from "./tool_isSupertypeOf";
declare type ExtensionObjectConstructor = new (options: any) => ExtensionObject;
export interface UADataType {
    _extensionObjectConstructor: ExtensionObjectConstructor;
}
export declare class UADataType extends BaseNode implements UADataTypePublic {
    readonly nodeClass = NodeClass.DataType;
    readonly definitionName: string;
    /**
     * returns true if this is a super type of baseType
     *
     * @example
     *
     *    var dataTypeDouble = addressSpace.findDataType("Double");
     *    var dataTypeNumber = addressSpace.findDataType("Number");
     *    assert(dataTypeDouble.isSupertypeOf(dataTypeNumber));
     *    assert(!dataTypeNumber.isSupertypeOf(dataTypeDouble));
     *
     */
    readonly subtypeOf: NodeId | null;
    readonly subtypeOfObj: UADataTypePublic | null;
    isSupertypeOf: tools.IsSupertypeOfFunc<UADataTypePublic>;
    readonly isAbstract: boolean;
    definition_name: string;
    definition: any[];
    private enumStrings?;
    private enumValues?;
    constructor(options: any);
    readAttribute(context: SessionContext | null, attributeId: AttributeIds): DataValue;
    getEncodingNode(encoding_name: string): BaseNode | null;
    /**
     * returns the encoding of this node's
     * TODO objects have 2 encodings : XML and Binaries
     */
    readonly binaryEncodingNodeId: any;
    readonly binaryEncoding: BaseNode;
    readonly binaryEncodingDefinition: string;
    readonly xmlEncoding: BaseNode;
    readonly xmlEncodingNodeId: NodeId;
    readonly xmlEncodingDefinition: string;
    _getDefinition(): any;
    install_extra_properties(): void;
    toString(): string;
}
export declare function DataType_toString(this: UADataType, options: ToStringOption): void;
export {};
