/**
 * @module node-opcua-factory
 */
import { ExpandedNodeId } from "node-opcua-nodeid";
import { DataTypeFactory } from "./datatype_factory";
import { ConstructorFuncWithSchema, ConstructorFunc } from "./constructor_type";
import { BaseUAObject } from "./factories_baseobject";
import { StructuredTypeSchema } from "./factories_structuredTypeSchema";
export declare function getStandartDataTypeFactory(): DataTypeFactory;
export declare function getStructureTypeConstructor(typeName: string): ConstructorFuncWithSchema;
export declare function hasStructuredType(typeName: string): boolean;
export declare function getStructuredTypeSchema(typeName: string): StructuredTypeSchema;
export declare function registerFactory(typeName: string, constructor: ConstructorFuncWithSchema): void;
export declare function getConstructor(expandedNodeId: ExpandedNodeId): ConstructorFunc | null;
export declare function hasConstructor(expandedNodeId: ExpandedNodeId): boolean;
export declare function constructObject(expandedNodeId: ExpandedNodeId): BaseUAObject;
export declare function registerClassDefinition(className: string, classConstructor: ConstructorFuncWithSchema): void;
export declare function dump(): void;
