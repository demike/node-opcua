"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
// tslint:disable:no-shadowed-variable
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_debug_1 = require("node-opcua-debug");
const utils = require("node-opcua-utils");
const _ = require("underscore");
const factories_builtin_types_1 = require("./factories_builtin_types");
const factories_enumerations_1 = require("./factories_enumerations");
const datatype_factory_1 = require("./datatype_factory");
const factories_factories_1 = require("./factories_factories");
const factories_structuredTypeSchema_1 = require("./factories_structuredTypeSchema");
const types_1 = require("./types");
function r(str, length = 30) {
    return (str + "                                ").substr(0, length);
}
function _decode_member_(value, field, stream, options) {
    const tracer = options.tracer;
    const cursorBefore = stream.length;
    const fieldType = field.fieldType;
    switch (field.category) {
        case types_1.FieldCategory.basic:
            if (field.schema.decode) {
                value = field.schema.decode(stream);
            }
            tracer.trace("member", options.name, value, cursorBefore, stream.length, fieldType);
            break;
        case types_1.FieldCategory.enumeration:
            if (field.schema.decode) {
                value = field.schema.decode(stream);
            }
            tracer.trace("member", options.name, value, cursorBefore, stream.length, fieldType);
            break;
        case types_1.FieldCategory.complex: {
            node_opcua_assert_1.assert(field.category === types_1.FieldCategory.complex);
            if (!field.fieldTypeConstructor) {
                field.fieldTypeConstructor = factories_factories_1.getStructureTypeConstructor(field.fieldType);
            }
            if (!_.isFunction(field.fieldTypeConstructor)) {
                throw new Error("Cannot find constructor for  " + field.name + "of type " + field.fieldType);
            }
            // assert(_.isFunction(field.fieldTypeConstructor));
            const constructor = field.fieldTypeConstructor;
            value = datatype_factory_1.callConstructor(constructor);
            value.decodeDebug(stream, options);
        }
    }
    return value;
}
function applyOnAllSchemaFields(self, schema, data, functor, args) {
    const baseSchema = factories_structuredTypeSchema_1.get_base_schema(schema);
    if (baseSchema) {
        applyOnAllSchemaFields(self, baseSchema, data, functor, args);
    }
    for (const field of schema.fields) {
        functor(self, field, data, args);
    }
}
const _nbElements = process.env.ARRAYLENGTH ? parseInt(process.env.ARRAYLENGTH, 10) : 10;
function _arrayEllipsis(value) {
    if (!value) {
        return "null []";
    }
    else {
        if (value.length === 0) {
            return "[ /* empty*/ ]";
        }
        node_opcua_assert_1.assert(_.isArray(value));
        const v = [];
        const m = Math.min(_nbElements, value.length);
        for (let i = 0; i < m; i++) {
            let element = value[i];
            if (element instanceof Buffer) {
                element = node_opcua_debug_1.hexDump(element, 32, 16);
            }
            v.push(!utils.isNullOrUndefined(element) ? element.toString() : null);
        }
        return "[ " + v.join(",") + (value.length > 10 ? " ... " : "") + "] (l=" + value.length + ")";
    }
}
function _exploreObject(self, field, data, args) {
    if (!self) {
        return;
    }
    node_opcua_assert_1.assert(self);
    const fieldType = field.fieldType;
    const fieldName = field.name;
    const category = field.category;
    const padding = data.padding;
    let value = self[fieldName];
    let str;
    // decorate the field name with ?# if the field is optional
    let opt = "    ";
    if (field.switchBit !== undefined) {
        opt = " ?" + field.switchBit + " ";
    }
    if (field.switchValue !== undefined) {
        opt = " !" + field.switchValue + " ";
    }
    const fieldNameF = chalk_1.default.yellow(r(padding + fieldName, 30));
    const fieldTypeF = chalk_1.default.cyan(("/* " + r(fieldType + opt, 17) + (field.isArray ? "[]" : "  ") + " */"));
    // detected when optional field is not specified in value
    if (field.switchBit !== undefined && value === undefined) {
        str = fieldNameF + " " + fieldTypeF + ": " + chalk_1.default.italic.grey("undefined") + " /* optional field not specified */";
        data.lines.push(str);
        return;
    }
    // detected when union field is not specified in value
    if (field.switchValue !== undefined && value === undefined) {
        str = fieldNameF + " " + fieldTypeF + ": " + chalk_1.default.italic.grey("undefined") + " /* union field not specified */";
        data.lines.push(str);
        return;
    }
    // compact version of very usual objects
    if (fieldType === "QualifiedName" && !field.isArray && value) {
        value = value.toString() || "<null>";
        str = fieldNameF + " " + fieldTypeF + ": " + chalk_1.default.green(value.toString());
        data.lines.push(str);
        return;
    }
    if (fieldType === "LocalizedText" && !field.isArray && value) {
        value = value.toString() || "<null>";
        str = fieldNameF + " " + fieldTypeF + ": " + chalk_1.default.green(value.toString());
        data.lines.push(str);
        return;
    }
    function _dump_simple_value(self, field, data, value, fieldType) {
        let str = "";
        if (value instanceof Buffer) {
            const _hexDump = node_opcua_debug_1.hexDump(value);
            data.lines.push(fieldNameF + " " + fieldTypeF);
            data.lines.push("BUFFER{" + _hexDump + "}");
        }
        else {
            if (field.isArray) {
                str = fieldNameF + " " + fieldTypeF + ": " + _arrayEllipsis(value);
            }
            else {
                if (fieldType === "IntegerId" || fieldType === "UInt32") {
                    value = "" + value + "               " + ((value !== undefined) ? "0x" + value.toString(16) : "undefined");
                }
                else if (fieldType === "DateTime" || fieldType === "UtcTime") {
                    value = (value && value.toISOString) ? value.toISOString() : value;
                }
                else if (typeof value === "object" && value !== null && value !== undefined) {
                    value = value.toString.apply(value, args);
                }
                str = fieldNameF + " " + fieldTypeF + ": "
                    + ((value === null || value === undefined) ? chalk_1.default.blue("null") : value.toString());
            }
            data.lines.push(str);
        }
    }
    function _dump_complex_value(self, field, data, value, fieldType) {
        if (field.subType) {
            // this is a synonymous
            fieldType = field.subType;
            _dump_simple_value(self, field, data, value, fieldType);
        }
        else {
            const typeDictionary = self.schema.$typeDictionary;
            if (!typeDictionary) {
                console.log(" No typeDictionary for ", self.schema);
            }
            field.fieldTypeConstructor = field.fieldTypeConstructor ||
                (typeDictionary.getStructureTypeConstructor(fieldType));
            const fieldTypeConstructor = field.fieldTypeConstructor;
            const _newDesc = fieldTypeConstructor.prototype.schema || fieldTypeConstructor.schema;
            if (field.isArray) {
                if (value === null) {
                    data.lines.push(fieldNameF + " " + fieldTypeF + ": null []");
                }
                else if (value.length === 0) {
                    data.lines.push(fieldNameF + " " + fieldTypeF + ": [ /* empty */ ]");
                }
                else {
                    data.lines.push(fieldNameF + " " + fieldTypeF + ": [");
                    const m = Math.min(_nbElements, value.length);
                    for (let i = 0; i < m; i++) {
                        const element = value[i];
                        data.lines.push(padding + chalk_1.default.cyan("  { " + ("/*" + i + "*/")));
                        const data1 = { padding: padding + "    ", lines: [] };
                        applyOnAllSchemaFields(element, _newDesc, data1, _exploreObject, args);
                        data.lines = data.lines.concat(data1.lines);
                        data.lines.push(padding + "  }" + ((i === value.length - 1) ? "" : ","));
                    }
                    if (m < value.length) {
                        data.lines.push(padding + " ..... ( " + value.length + " elements )");
                    }
                    data.lines.push(padding + "]");
                }
            }
            else {
                data.lines.push(fieldNameF + " " + fieldTypeF + ": {");
                const data1 = { padding: padding + "  ", lines: [] };
                applyOnAllSchemaFields(value, _newDesc, data1, _exploreObject, args);
                data.lines = data.lines.concat(data1.lines);
                data.lines.push(padding + "}");
            }
        }
    }
    switch (category) {
        case types_1.FieldCategory.enumeration:
            const s = field.schema;
            if (!s.typedEnum) {
                // tslint:disable:no-console
                console.log("xxxx cannot find typeEnum", s);
            }
            str = fieldNameF + " " + fieldTypeF + ": " + s.typedEnum.get(value) + " ( " + value + ")";
            data.lines.push(str);
            break;
        case types_1.FieldCategory.basic:
            _dump_simple_value(self, field, data, value, fieldType);
            break;
        case types_1.FieldCategory.complex:
            _dump_complex_value(self, field, data, value, fieldType);
            break;
        default:
            throw new Error("internal error: unknown kind_of_field " + category);
    }
}
function json_ify(t, f, field, value) {
    if (_.isFunction(field.toJSON)) {
        return field.toJSON(value);
    }
    else if (t && t.toJSON) {
        return t.toJSON(value);
    }
    else if (value.toJSON) {
        return value.toJSON();
    }
    else {
        return f;
    }
}
function _JSONify(self, schema, options) {
    /* jshint validthis: true */
    for (const field of schema.fields) {
        const f = self[field.name];
        if (f === null || f === undefined) {
            continue;
        }
        if (factories_enumerations_1.hasEnumeration(field.fieldType)) {
            const enumeration = factories_enumerations_1.getEnumeration(field.fieldType);
            node_opcua_assert_1.assert(enumeration !== null);
            if (field.isArray) {
                options[field.name] = f.map((value) => enumeration.enumValues[value.toString()]);
            }
            else {
                options[field.name] = enumeration.enumValues[f.toString()];
            }
            continue;
        }
        const t = factories_builtin_types_1.getBuildInType(field.fieldType);
        if (field.isArray) {
            options[field.name] = f.map((value) => json_ify(t, value, field, value));
        }
        else {
            options[field.name] = json_ify(t, f, field, f);
        }
    }
}
/**
 * @class BaseUAObject
 * @constructor
 */
class BaseUAObject {
    constructor() {
    }
    /**
     * Encode the object to the binary stream.
     * @class BaseUAObject
     * @method encode
     * @param stream {BinaryStream}
     */
    encode(stream) {
    }
    /**
     * Decode the object from the binary stream.
     * @class BaseUAObject
     * @method decode
     * @param stream {BinaryStream}
     */
    decode(stream) {
    }
    /**
     * Calculate the required size to store this object in a binary stream.
     * @method binaryStoreSize
     * @return number
     */
    binaryStoreSize() {
        const stream = new node_opcua_binary_stream_1.BinaryStreamSizeCalculator();
        this.encode(stream);
        return stream.length;
    }
    /**
     * @method toString
     * @return {String}
     */
    toString(...args) {
        if (this.schema && this.schema.hasOwnProperty("toString")) {
            return this.schema.toString.apply(this, arguments);
        }
        else {
            if (!this.explore) {
                // xx console.log(util.inspect(this));
                return Object.prototype.toString.apply(this, arguments);
            }
            return this.explore.apply(this, arguments);
        }
    }
    /**
     *
     * verify that all object attributes values are valid according to schema
     * @method isValid
     * @return boolean
     */
    isValid() {
        node_opcua_assert_1.assert(this.schema);
        if (this.schema.isValid) {
            return this.schema.isValid(this);
        }
        else {
            return true;
        }
    }
    /**
     * @method decodeDebug
     *
     */
    decodeDebug(stream, options) {
        const tracer = options.tracer;
        const schema = this.schema;
        tracer.trace("start", options.name + "(" + schema.name + ")", stream.length, stream.length);
        const self = this;
        for (const field of schema.fields) {
            const value = self[field.name];
            if (field.isArray) {
                const cursorBefore = stream.length;
                let nb = stream.readUInt32();
                if (nb === 0xFFFFFFFF) {
                    nb = 0;
                }
                options.name = field.name + [];
                tracer.trace("start_array", field.name, nb, cursorBefore, stream.length);
                for (let i = 0; i < nb; i++) {
                    tracer.trace("start_element", field.name, i);
                    options.name = "element #" + i;
                    _decode_member_(value, field, stream, options);
                    tracer.trace("end_element", field.name, i);
                }
                tracer.trace("end_array", field.name, stream.length - 4);
            }
            else {
                options.name = field.name;
                _decode_member_(value, field, stream, options);
            }
        }
        tracer.trace("end", schema.name, stream.length, stream.length);
    }
    explore() {
        const data = {
            lines: [],
            padding: " "
        };
        data.lines.push("{" + chalk_1.default.cyan(" /*" + (this.schema ? this.schema.name : "") + "*/"));
        if (this.schema) {
            applyOnAllSchemaFields(this, this.schema, data, _exploreObject, arguments);
        }
        data.lines.push("};");
        return data.lines.join("\n");
    }
    toJSON() {
        node_opcua_assert_1.assert(this.schema);
        if (this.schema.toJSON) {
            return this.schema.toJSON.apply(this, arguments);
        }
        else {
            node_opcua_assert_1.assert(this.schema);
            const schema = this.schema;
            const options = {};
            _visitSchemaChain(this, schema, options, _JSONify, null);
            return options;
        }
    }
    clone( /*options,optionalFilter,extraInfo*/) {
        const self = this;
        const params = {};
        function construct_param(schema, options) {
            for (const field of schema.fields) {
                const f = self[field.name];
                if (f === null || f === undefined) {
                    continue;
                }
                if (field.isArray) {
                    options[field.name] = self[field.name];
                }
                else {
                    options[field.name] = self[field.name];
                }
            }
        }
        construct_param.call(this, self.schema, params);
        return new self.constructor(params);
    }
}
exports.BaseUAObject = BaseUAObject;
function _visitSchemaChain(self, schema, options, func, extraData) {
    node_opcua_assert_1.assert(_.isFunction(func));
    // apply also construct to baseType schema first
    const baseSchema = factories_structuredTypeSchema_1.get_base_schema(schema);
    if (baseSchema) {
        _visitSchemaChain(self, baseSchema, options, func, extraData);
    }
    func.call(null, self, schema, options);
}
//# sourceMappingURL=factories_baseobject.js.map