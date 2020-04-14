import { ExpandedNodeId } from "node-opcua-nodeid";
import { BaseUAObject } from "./factories_baseobject";
import { ConstructorFuncWithSchema, ConstructorFunc } from "./constructor_type";
import { StructuredTypeSchema } from "./factories_structuredTypeSchema";
export declare class DataTypeFactory {
    defaultByteOrder: string;
    targetNamespace: string;
    imports: string[];
    private _structureTypeConstructorByNameMap;
    private _structureTypeConstructorByEncodingNodeIdMap;
    private baseDataFactories;
    constructor(baseDataFactories: DataTypeFactory[]);
    registerFactory(typeName: string, constructor: ConstructorFuncWithSchema): void;
    getStructureTypeConstructor(typeName: string): ConstructorFuncWithSchema;
    hasStructuredType(typeName: string): boolean;
    getStructuredTypeSchema(typeName: string): StructuredTypeSchema;
    dump(): void;
    registerClassDefinition(className: string, classConstructor: ConstructorFuncWithSchema): void;
    associateWithBinaryEncoding(className: string, expandedNodeId: ExpandedNodeId): void;
    getConstructor(expandedNodeId: ExpandedNodeId): ConstructorFunc | null;
    hasConstructor(expandedNodeId: ExpandedNodeId): boolean;
    constructObject(expandedNodeId: ExpandedNodeId): BaseUAObject;
}
export declare function callConstructor(constructor: ConstructorFunc): BaseUAObject;
