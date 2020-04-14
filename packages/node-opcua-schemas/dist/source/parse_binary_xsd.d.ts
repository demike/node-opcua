/**
 * @module node-opcua-schemas
 */
import { EnumerationDefinitionSchema, StructuredTypeSchema } from "node-opcua-factory";
import { DataTypeFactory } from "node-opcua-factory";
export interface EnumeratedType {
    name: string;
    documentation?: string;
    enumeratedValues: any;
    lengthInBits?: number;
}
export interface StructureTypeRaw {
    name: string;
    baseType?: string;
    base?: StructureTypeRaw;
    fields: any[];
}
export interface ITypeDictionary {
    targetNamespace: string;
    imports: string[];
    structuredTypes: {
        [key: string]: StructuredTypeSchema;
    };
    enumeratedTypes: {
        [key: string]: EnumerationDefinitionSchema;
    };
    structuredTypesRaw: {
        [key: string]: StructureTypeRaw;
    };
    enumeratedTypesRaw: {
        [key: string]: EnumeratedType;
    };
}
export declare class TypeDictionary extends DataTypeFactory implements ITypeDictionary {
    structuredTypes: {
        [key: string]: StructuredTypeSchema;
    };
    enumeratedTypes: {
        [key: string]: EnumerationDefinitionSchema;
    };
    structuredTypesRaw: {
        [key: string]: StructureTypeRaw;
    };
    enumeratedTypesRaw: {
        [key: string]: EnumeratedType;
    };
    constructor(baseDataFactories: DataTypeFactory[]);
}
export declare function parseBinaryXSD(xmlString: string, dataTypeFactories: DataTypeFactory[], callback: (err: Error | null, typeDictionary: TypeDictionary) => void): void;
