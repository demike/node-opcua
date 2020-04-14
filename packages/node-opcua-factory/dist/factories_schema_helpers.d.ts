import { FieldType, StructuredTypeField } from "./types";
export declare const parameters: {
    debugSchemaHelper: boolean;
};
/**
 * ensure correctness of a schema object.
 *
 * @method check_schema_correctness
 * @param schema
 *
 */
export declare function check_schema_correctness(schema: any): void;
/**
 * @method initialize_field
 * @param field
 * @param value
 * @return {*}
 */
export declare function initialize_field(field: StructuredTypeField, value: any): any;
/**
 * @method initialize_field_array
 * @param field
 * @param valueArray
 * @return
 */
export declare function initialize_field_array(field: FieldType, valueArray: any): any[] | null;
