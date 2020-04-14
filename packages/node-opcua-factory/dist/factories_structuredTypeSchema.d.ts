import { FieldType, StructuredTypeOptions, TypeSchemaBase } from "./types";
import { BinaryStream } from "node-opcua-binary-stream";
import { ExpandedNodeId, NodeId } from "node-opcua-nodeid";
export declare class StructuredTypeSchema extends TypeSchemaBase {
    fields: FieldType[];
    id: NodeId;
    baseType: string;
    _possibleFields: string[];
    _baseSchema: StructuredTypeSchema | null;
    documentation?: string;
    isValid?: (options: any) => boolean;
    decodeDebug?: (stream: BinaryStream, options: any) => any;
    constructHook?: (options: any) => any;
    encodingDefaultBinary?: ExpandedNodeId;
    encodingDefaultXml?: ExpandedNodeId;
    bitFields?: any[];
    constructor(options: StructuredTypeOptions);
}
/**
 *
 * @method get_base_schema
 * @param schema
 * @return {*}
 *
 */
export declare function get_base_schema(schema: StructuredTypeSchema): StructuredTypeSchema | null;
/**
 * extract a list of all possible fields for a schema
 * (by walking up the inheritance chain)
 * @method extract_all_fields
 *
 */
export declare function extract_all_fields(schema: StructuredTypeSchema): string[];
/**
 * check correctness of option fields against scheme
 *
 * @method  check_options_correctness_against_schema
 *
 */
export declare function check_options_correctness_against_schema(obj: any, schema: StructuredTypeSchema, options: any): true | undefined;
export declare function buildStructuredType(schemaLight: StructuredTypeOptions): StructuredTypeSchema;
