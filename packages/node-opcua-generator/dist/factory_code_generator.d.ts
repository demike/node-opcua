/**
 * @module node-opcua-generator
 */
import { StructuredTypeSchema } from "node-opcua-factory";
export declare function get_class_tscript_filename(schemaName: string, optionalFolder?: string): string;
export declare function get_class_jscript_filename(schemaName: string, optionalFolder?: string): string;
declare type WriteFunc = (...args: string[]) => void;
export declare function writeStructuredType(write: WriteFunc, schema: StructuredTypeSchema): void;
export declare function produce_tscript_code(schema: StructuredTypeSchema, localSchemaFile: string, generatedTypescriptFilename: string): void;
export {};
