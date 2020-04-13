"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const _ = require("underscore");
const types_1 = require("./types");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
exports.parameters = {
    debugSchemaHelper: !!process.env.DEBUG_CLASS
};
/**
 * ensure correctness of a schema object.
 *
 * @method check_schema_correctness
 * @param schema
 *
 */
function check_schema_correctness(schema) {
    node_opcua_assert_1.assert(typeof schema.name === "string", " expecting schema to have a name");
    node_opcua_assert_1.assert(schema.fields instanceof Array, " expecting schema to provide a set of fields " + schema.name);
    node_opcua_assert_1.assert(schema.baseType === undefined || (typeof schema.baseType === "string"));
}
exports.check_schema_correctness = check_schema_correctness;
/**
 * @method initialize_field
 * @param field
 * @param value
 * @return {*}
 */
function initialize_field(field, value) {
    const _t = field.schema;
    if (!_.isObject(_t)) {
        throw new Error("initialize_field: expecting field.schema to be set field.name = '" + field.name + "' type = " + field.fieldType);
    }
    node_opcua_assert_1.assert(_.isObject(field));
    node_opcua_assert_1.assert(!field.isArray);
    try {
        if (field.category === types_1.FieldCategory.complex) {
            if (field.fieldTypeConstructor) {
                return new field.fieldTypeConstructor(value);
            }
            else {
                debugLog("xxxx => missing constructor for field type", field.fieldType);
            }
        }
        const defaultValue = _t.computer_default_value ? _t.computer_default_value(field.defaultValue) : field.defaultValue;
        value = _t.initialize_value(value, defaultValue);
    }
    catch (err) {
        /* empty */
    }
    if (field.validate) {
        if (!field.validate(value)) {
            throw Error(" invalid value " + value + " for field " + field.name + " of type " + field.fieldType);
        }
    }
    return value;
}
exports.initialize_field = initialize_field;
/**
 * @method initialize_field_array
 * @param field
 * @param valueArray
 * @return
 */
function initialize_field_array(field, valueArray) {
    const _t = field.schema;
    let value;
    let i;
    node_opcua_assert_1.assert(_.isObject(field));
    node_opcua_assert_1.assert(field.isArray);
    if (!valueArray && field.defaultValue === null) {
        return null;
    }
    valueArray = valueArray || [];
    let defaultValue;
    if (_t.computer_default_value) {
        defaultValue = _t.computer_default_value(field.defaultValue);
    }
    const arr = [];
    for (i = 0; i < valueArray.length; i++) {
        value = _t.initialize_value(valueArray[i], defaultValue);
        arr.push(value);
    }
    if (field.validate) {
        for (i = 0; i < arr.length; i++) {
            if (!field.validate(arr[i])) {
                throw Error(" invalid value " + arr[i] + " for field " + field.name + " of type " + field.fieldType);
            }
        }
    }
    return arr;
}
exports.initialize_field_array = initialize_field_array;
//# sourceMappingURL=factories_schema_helpers.js.map