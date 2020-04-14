import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BasicTypeDefinition, BasicTypeDefinitionOptions, TypeSchemaBase } from "./types";
export declare class BasicTypeSchema extends TypeSchemaBase implements BasicTypeDefinition {
    subType: string;
    encode: (value: any, stream: OutputBinaryStream) => void;
    decode: (stream: BinaryStream) => any;
    constructor(options: BasicTypeDefinitionOptions);
}
export declare const minDate: Date;
/**
 * @method registerType
 * @param schema {TypeSchemaBase}
 */
export declare function registerType(schema: BasicTypeDefinitionOptions): void;
export declare const registerBuiltInType: typeof registerType;
export declare function unregisterType(typeName: string): void;
/**
 * @method findSimpleType
 * @param name
 * @return {TypeSchemaBase|null}
 */
export declare function findSimpleType(name: string): BasicTypeDefinition;
export declare function hasBuiltInType(name: string): boolean;
export declare function getBuildInType(name: string): BasicTypeDefinition;
/**
 * @method findBuiltInType
 * find the Builtin Type that this
 * @param dataTypeName
 * @return {*}
 */
export declare function findBuiltInType(dataTypeName: any): BasicTypeDefinition;
export declare function getTypeMap(): Map<string, BasicTypeSchema>;
