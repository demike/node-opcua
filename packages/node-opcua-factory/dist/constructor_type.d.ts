/**
 * @module node-opcua-factory
 */
import { ExpandedNodeId } from "node-opcua-nodeid";
import { BaseUAObject } from "./factories_baseobject";
import { StructuredTypeSchema } from "./factories_structuredTypeSchema";
declare type BaseUAObjectConstructable = new (options?: any) => BaseUAObject;
export declare type ConstructorFunc = BaseUAObjectConstructable;
export interface ConstructorFuncWithSchema extends ConstructorFunc {
    schema: StructuredTypeSchema;
    possibleFields: string[];
    encodingDefaultBinary: ExpandedNodeId;
    encodingDefaultXml: ExpandedNodeId;
}
export {};
