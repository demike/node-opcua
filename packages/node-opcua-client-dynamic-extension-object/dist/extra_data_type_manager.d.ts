import { DataTypeFactory } from "node-opcua-factory";
import { NodeId } from "node-opcua-nodeid";
import { AnyConstructorFunc, TypeDictionary } from "node-opcua-schemas";
export declare class ExtraDataTypeManager {
    namespaceArray: string[];
    private readonly typeDictionaries;
    private readonly typeDictionariesByNamespace;
    constructor();
    setNamespaceArray(namespaceArray: string[]): void;
    hasDataTypeDictionary(nodeId: NodeId): boolean;
    registerTypeDictionary(nodeId: NodeId, typeDictionary: TypeDictionary): void;
    getTypeDictionaryForNamespace(namespaceIndex: number): TypeDictionary;
    getDataTypeFactory(namespaceIndex: number): DataTypeFactory;
    getExtensionObjectConstructorFromDataType(dataTypeNodeId: NodeId): AnyConstructorFunc;
    getExtensionObjectConstructorFromBinaryEncoding(binaryEncodingNodeId: NodeId): AnyConstructorFunc;
    private makeKey;
}
