import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { Enum, EnumItem } from "node-opcua-enum";
import { EnumerationDefinition, TypeSchemaBase, TypeSchemaConstructorOptions } from "./types";
export interface EnumerationDefinitionOptions extends TypeSchemaConstructorOptions {
    enumValues: any;
    typedEnum?: any;
    defaultValue?: EnumItem;
    encode?: (value: EnumItem, stream: OutputBinaryStream) => void;
    decode?: (stream: BinaryStream) => EnumItem;
}
export declare class EnumerationDefinitionSchema extends TypeSchemaBase implements EnumerationDefinition {
    enumValues: any;
    typedEnum: Enum;
    constructor(options: EnumerationDefinitionOptions);
}
/**
 * @method registerEnumeration
 * @param options
 * @param options.name {string}
 * @param options.enumValues [{key:Name, value:values}]
 * @param options.encode
 * @param options.decode
 * @param options.typedEnum
 * @param options.defaultValue
 * @return {Enum}
 */
export declare function registerEnumeration(options: EnumerationDefinitionOptions): Enum;
export declare function hasEnumeration(enumerationName: string): boolean;
export declare function getEnumeration(enumerationName: string): EnumerationDefinition;
