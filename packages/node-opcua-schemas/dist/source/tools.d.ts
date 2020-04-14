import { StructuredTypeSchema } from "node-opcua-factory";
import { EnumeratedType, StructureTypeRaw, TypeDictionary } from "./parse_binary_xsd";
export declare function getOrCreateStructuredTypeSchema(name: string, typeDictionary: TypeDictionary): StructuredTypeSchema;
export declare function prepareStructureType(structuredType: StructureTypeRaw, typeDictionary: TypeDictionary): StructuredTypeSchema;
export declare function prepareEnumeratedType(enumeratedType: EnumeratedType, typeDictionary: TypeDictionary): void;
