"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const chalk_1 = require("chalk");
const _ = require("underscore");
const types_1 = require("./types");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_utils_1 = require("node-opcua-utils");
const factories_builtin_types_1 = require("./factories_builtin_types");
const factories_enumerations_1 = require("./factories_enumerations");
const factories_factories_1 = require("./factories_factories");
const factories_schema_helpers_1 = require("./factories_schema_helpers");
function figureOutFieldCategory(field) {
    const fieldType = field.fieldType;
    if (field.category) {
        return field.category;
    }
    if (factories_enumerations_1.hasEnumeration(fieldType)) {
        return types_1.FieldCategory.enumeration;
    }
    else if (factories_builtin_types_1.hasBuiltInType(fieldType)) {
        return types_1.FieldCategory.basic;
    }
    else if (factories_factories_1.hasStructuredType(fieldType)) {
        node_opcua_assert_1.assert(fieldType !== "LocalizedText"); // LocalizedText should be treated as BasicType!!!
        return types_1.FieldCategory.complex;
    }
    return types_1.FieldCategory.basic;
}
function figureOutSchema(underConstructSchema, field, category) {
    if (field.schema) {
        return field.schema;
    }
    if (underConstructSchema.name === field.fieldType) {
        return underConstructSchema;
    }
    let returnValue = null;
    switch (category) {
        case types_1.FieldCategory.complex:
            if (factories_factories_1.hasStructuredType(field.fieldType)) {
                returnValue = factories_factories_1.getStructuredTypeSchema(field.fieldType);
            }
            else {
                // LocalizedText etc ...
                returnValue = factories_builtin_types_1.getBuildInType(field.fieldType);
            }
            break;
        case types_1.FieldCategory.basic:
            returnValue = factories_builtin_types_1.getBuildInType(field.fieldType);
            break;
        case types_1.FieldCategory.enumeration:
            returnValue = factories_enumerations_1.getEnumeration(field.fieldType);
            break;
    }
    if (null === returnValue || undefined === returnValue) {
        throw new Error("Cannot find Schema for field with name " + field.name +
            " with type " + field.fieldType + " category = " + category + JSON.stringify(field, null, "\t"));
    }
    return returnValue;
}
function buildField(underConstructSchema, fieldLight) {
    const category = figureOutFieldCategory(fieldLight);
    const schema = figureOutSchema(underConstructSchema, fieldLight, category);
    /* istanbul ignore next */
    if (!schema) {
        throw new Error("expecting a valid schema for field with name " +
            fieldLight.name + " with type " + fieldLight.fieldType + " category" + category);
    }
    return {
        name: node_opcua_utils_1.lowerFirstLetter(fieldLight.name),
        category,
        defaultValue: fieldLight.defaultValue,
        isArray: fieldLight.isArray,
        documentation: fieldLight.documentation,
        fieldType: fieldLight.fieldType,
        switchBit: fieldLight.switchBit,
        switchValue: fieldLight.switchValue,
        schema
    };
}
class StructuredTypeSchema extends types_1.TypeSchemaBase {
    constructor(options) {
        super(options);
        this.bitFields = options.bitFields;
        this.baseType = options.baseType;
        this.category = types_1.FieldCategory.complex;
        if (factories_builtin_types_1.hasBuiltInType(options.name)) {
            this.category = types_1.FieldCategory.basic;
        }
        this.fields = options.fields.map(buildField.bind(null, this));
        this.id = node_opcua_nodeid_1.NodeId.nullNodeId;
        this._possibleFields = this.fields.map((field) => field.name);
        this._baseSchema = null;
    }
}
exports.StructuredTypeSchema = StructuredTypeSchema;
/**
 *
 * @method get_base_schema
 * @param schema
 * @return {*}
 *
 */
function get_base_schema(schema) {
    let baseSchema = schema._baseSchema;
    if (baseSchema) {
        return baseSchema;
    }
    if (schema.baseType === "ExtensionObject") {
        return null;
    }
    if (schema.baseType === "Union") {
        return null;
    }
    if (schema.baseType && schema.baseType !== "BaseUAObject") {
        const baseType = factories_factories_1.getStructureTypeConstructor(schema.baseType);
        // istanbul ignore next
        if (!baseType) {
            throw new Error(" cannot find factory for " + schema.baseType);
        }
        if (baseType.prototype.schema) {
            baseSchema = baseType.prototype.schema;
        }
    }
    // put in  cache for speedup
    schema._baseSchema = baseSchema;
    return baseSchema;
}
exports.get_base_schema = get_base_schema;
/**
 * extract a list of all possible fields for a schema
 * (by walking up the inheritance chain)
 * @method extract_all_fields
 *
 */
function extract_all_fields(schema) {
    // returns cached result if any
    // istanbul ignore next
    if (schema._possibleFields) {
        return schema._possibleFields;
    }
    // extract the possible fields from the schema.
    let possibleFields = schema.fields.map((field) => field.name);
    const baseSchema = get_base_schema(schema);
    // istanbul ignore next
    if (baseSchema) {
        const fields = extract_all_fields(baseSchema);
        possibleFields = fields.concat(possibleFields);
    }
    // put in cache to speed up
    schema._possibleFields = possibleFields;
    return possibleFields;
}
exports.extract_all_fields = extract_all_fields;
/**
 * check correctness of option fields against scheme
 *
 * @method  check_options_correctness_against_schema
 *
 */
function check_options_correctness_against_schema(obj, schema, options) {
    if (!factories_schema_helpers_1.parameters.debugSchemaHelper) {
        return; // ignoring set
    }
    options = options || {};
    // istanbul ignore next
    if (!_.isObject(options) && !(typeof (options) === "object")) {
        let message = chalk_1.default.red(" Invalid options specified while trying to construct a ")
            + " " + chalk_1.default.yellow(schema.name);
        message += "\n";
        message += chalk_1.default.red(" expecting a ") + chalk_1.default.yellow(" Object ");
        message += "\n";
        message += chalk_1.default.red(" and got a ") + chalk_1.default.yellow((typeof options)) + chalk_1.default.red(" instead ");
        // console.log(" Schema  = ", schema);
        // console.log(" options = ", options);
        throw new Error(message);
    }
    // istanbul ignore next
    if (options instanceof obj.constructor) {
        return true;
    }
    // extract the possible fields from the schema.
    const possibleFields = obj.constructor.possibleFields || schema._possibleFields;
    // extracts the fields exposed by the option object
    const currentFields = Object.keys(options);
    // get a list of field that are in the 'options' object but not in schema
    const invalidOptionsFields = _.difference(currentFields, possibleFields);
    /* istanbul ignore next */
    if (invalidOptionsFields.length > 0) {
        // tslint:disable:no-console
        console.log("expected schema", schema.name);
        console.log(chalk_1.default.yellow("possible fields= "), possibleFields.sort().join(" "));
        console.log(chalk_1.default.red("current fields= "), currentFields.sort().join(" "));
        console.log(chalk_1.default.cyan("invalid_options_fields= "), invalidOptionsFields.sort().join(" "));
        console.log("options = ", options);
    }
    /* istanbul ignore next */
    if (invalidOptionsFields.length !== 0) {
        // tslint:disable:no-console
        console.log(chalk_1.default.yellow("possible fields= "), possibleFields.sort().join(" "));
        console.log(chalk_1.default.red("current fields= "), currentFields.sort().join(" "));
        throw new Error(" invalid field found in option :" + JSON.stringify(invalidOptionsFields));
    }
    return true;
}
exports.check_options_correctness_against_schema = check_options_correctness_against_schema;
function buildStructuredType(schemaLight) {
    return new StructuredTypeSchema(schemaLight);
}
exports.buildStructuredType = buildStructuredType;
//# sourceMappingURL=factories_structuredTypeSchema.js.map