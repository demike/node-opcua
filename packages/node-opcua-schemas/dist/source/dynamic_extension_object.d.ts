import { StructuredTypeSchema } from "node-opcua-factory";
import { ExpandedNodeId } from "node-opcua-nodeid";
import { TypeDictionary } from "./parse_binary_xsd";
export declare function getOrCreateConstructor(fieldType: string, typeDictionary: TypeDictionary, encodingDefaultBinary?: ExpandedNodeId, encodingDefaultXml?: ExpandedNodeId): AnyConstructorFunc;
interface AnyConstructable {
    schema: StructuredTypeSchema;
    possibleFields: string[];
    new (options?: any, schema?: StructuredTypeSchema, typeDictionary?: TypeDictionary): any;
}
export declare type AnyConstructorFunc = AnyConstructable;
export declare function createDynamicObjectConstructor(schema: StructuredTypeSchema, typeDictionary: TypeDictionary): AnyConstructorFunc;
export {};
