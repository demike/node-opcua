import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { Enum } from "node-opcua-enum";
import { NodeId } from "node-opcua-nodeid";
import { ConstructorFunc } from "./constructor_type";
import { FieldInterfaceOptions } from "./types";
export interface CommonInterface {
    name: string;
    encode?: (value: any, stream: OutputBinaryStream) => void;
    decode?: (stream: BinaryStream) => any;
    coerce?: (value: any) => any;
    toJSON?: () => any;
    random?: () => any;
    validate?: (value: any) => void;
    defaultValue?: any;
    initialize_value(value: any, defaultValue: any): any;
    computer_default_value(defaultValue: any): any;
}
export declare enum FieldCategory {
    enumeration = "enumeration",
    complex = "complex",
    basic = "basic"
}
export interface StructuredTypeField {
    name: string;
    fieldType: string;
    isArray?: boolean;
    documentation?: string;
    category: FieldCategory;
    schema: CommonInterface;
    fieldTypeConstructor?: ConstructorFunc;
    subType?: string;
    defaultValue?: any;
    validate?: (value: any) => boolean;
    decode?: (stream: BinaryStream) => any;
    switchBit?: number;
    switchValue?: number;
}
export interface FieldEnumeration extends StructuredTypeField {
}
export interface FieldComplex extends StructuredTypeField {
}
export interface FieldBasic extends StructuredTypeField {
}
export declare type FieldType = FieldEnumeration | FieldComplex | FieldBasic;
export declare type DefaultValueFunc = () => any;
export interface FieldInterfaceOptions {
    name: string;
    fieldType: string;
    isArray?: boolean;
    documentation?: string;
    category?: FieldCategory;
    defaultValue?: any | DefaultValueFunc;
    schema?: any;
    switchBit?: number;
    switchValue?: number;
}
export interface StructuredTypeOptions {
    name: string;
    id?: number | NodeId;
    fields: FieldInterfaceOptions[];
    documentation?: string;
    baseType: string;
    _resolved?: boolean;
    bitFields?: any[];
    base?: StructuredTypeOptions;
}
export interface TypeSchemaConstructorOptions {
    name: string;
    category?: FieldCategory;
    defaultValue?: any;
    encode?: (value: any, stream: OutputBinaryStream) => void;
    decode?: (stream: BinaryStream) => any;
    coerce?: (value: any) => any;
}
export interface BasicTypeDefinitionOptions extends TypeSchemaConstructorOptions {
    subType: string;
    toJSON?: () => any;
    random?: () => any;
    validate?: (value: any) => void;
}
export interface BasicTypeDefinition extends CommonInterface {
    subType: string;
}
export interface BuiltInTypeDefinition extends BasicTypeDefinition {
}
export interface EnumerationDefinition extends CommonInterface {
    enumValues: any;
    typedEnum: Enum;
    documentation?: string;
}
export declare type TypeDefinition = BuiltInTypeDefinition | EnumerationDefinition | BasicTypeDefinition | TypeSchemaBase;
/**
 * @class TypeSchemaBase
 * @param options {Object}
 * @constructor
 * create a new type Schema
 */
export declare class TypeSchemaBase implements CommonInterface {
    name: string;
    defaultValue: any;
    encode?: (value: any, stream: OutputBinaryStream) => void;
    decode?: (stream: BinaryStream) => any;
    coerce?: (value: any) => any;
    toJSON?: () => string;
    category: FieldCategory;
    constructor(options: TypeSchemaConstructorOptions);
    /**
     * @method  computer_default_value
     * @param defaultValue {*} the default value
     * @return {*}
     */
    computer_default_value(defaultValue: any): any;
    /**
     * @method initialize_value
     * @param value
     * @param defaultValue
     * @return {*}
     */
    initialize_value(value: any, defaultValue: any): any;
}
