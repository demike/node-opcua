"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_guid_1 = require("node-opcua-guid");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const _ = require("underscore");
const types_1 = require("./types");
// tslint:disable:no-empty
// tslint:enable:no-unused-variable
function defaultEncode(value, stream) {
}
function defaultDecode(stream) {
    return null;
}
class BasicTypeSchema extends types_1.TypeSchemaBase {
    constructor(options) {
        super(options);
        this.subType = options.subType;
        this.encode = options.encode || defaultEncode;
        this.decode = options.decode || defaultDecode;
    }
}
exports.BasicTypeSchema = BasicTypeSchema;
exports.minDate = new Date(Date.UTC(1601, 0, 1, 0, 0, 0));
function defaultGuidValue() {
    return Buffer.alloc(0);
}
function toJSONGuid(value) {
    if (typeof value === "string") {
        return value;
    }
    node_opcua_assert_1.assert(value instanceof Buffer);
    return value.toString("base64");
}
function encodeAny(value, stream) {
    node_opcua_assert_1.assert(false, "type 'Any' cannot be encoded");
}
function decodeAny(stream) {
    node_opcua_assert_1.assert(false, "type 'Any' cannot be decoded");
}
function encodeNull(value, stream) {
}
function decodeNull(stream) {
    return null;
}
// there are 4 types of DataTypes in opcua:
//   Built-In DataType
//   Simple DataType
//   Complex DataType
//   Enumeration
const defaultXmlElement = "";
// Built-In Type
const _defaultType = [
    // Built-in DataTypes ( see OPCUA Part III v1.02 - $5.8.2 )
    {
        name: "Null",
        decode: decodeNull,
        encode: encodeNull,
        defaultValue: null
    },
    {
        name: "Any",
        decode: decodeAny,
        encode: encodeAny
    },
    {
        name: "Boolean",
        decode: node_opcua_basic_types_1.decodeBoolean,
        encode: node_opcua_basic_types_1.encodeBoolean,
        coerce: node_opcua_basic_types_1.coerceBoolean,
        defaultValue: false
    },
    { name: "Int8", encode: node_opcua_basic_types_1.encodeInt8, decode: node_opcua_basic_types_1.decodeInt8, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceInt8 },
    { name: "UInt8", encode: node_opcua_basic_types_1.encodeUInt8, decode: node_opcua_basic_types_1.decodeUInt8, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceUInt8 },
    { name: "SByte", encode: node_opcua_basic_types_1.encodeSByte, decode: node_opcua_basic_types_1.decodeSByte, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceSByte },
    { name: "Byte", encode: node_opcua_basic_types_1.encodeByte, decode: node_opcua_basic_types_1.decodeByte, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceByte },
    { name: "Int16", encode: node_opcua_basic_types_1.encodeInt16, decode: node_opcua_basic_types_1.decodeInt16, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceInt16 },
    { name: "UInt16", encode: node_opcua_basic_types_1.encodeUInt16, decode: node_opcua_basic_types_1.decodeUInt16, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceUInt16 },
    { name: "Int32", encode: node_opcua_basic_types_1.encodeInt32, decode: node_opcua_basic_types_1.decodeInt32, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceInt32 },
    { name: "UInt32", encode: node_opcua_basic_types_1.encodeUInt32, decode: node_opcua_basic_types_1.decodeUInt32, defaultValue: 0, coerce: node_opcua_basic_types_1.coerceUInt32 },
    {
        name: "Int64",
        decode: node_opcua_basic_types_1.decodeInt64,
        encode: node_opcua_basic_types_1.encodeInt64,
        coerce: node_opcua_basic_types_1.coerceInt64,
        defaultValue: node_opcua_basic_types_1.coerceInt64(0)
    },
    {
        name: "UInt64",
        decode: node_opcua_basic_types_1.decodeUInt64,
        encode: node_opcua_basic_types_1.encodeUInt64,
        coerce: node_opcua_basic_types_1.coerceUInt64,
        defaultValue: node_opcua_basic_types_1.coerceUInt64(0)
    },
    {
        name: "Float",
        decode: node_opcua_basic_types_1.decodeFloat,
        encode: node_opcua_basic_types_1.encodeFloat,
        coerce: node_opcua_basic_types_1.coerceFloat,
        defaultValue: 0.0
    },
    {
        name: "Double",
        decode: node_opcua_basic_types_1.decodeDouble,
        encode: node_opcua_basic_types_1.encodeDouble,
        coerce: node_opcua_basic_types_1.coerceDouble,
        defaultValue: 0.0
    },
    {
        name: "String",
        decode: node_opcua_basic_types_1.decodeString,
        encode: node_opcua_basic_types_1.encodeString,
        defaultValue: ""
    },
    // OPC Unified Architecture, part 3.0 $8.26 page 67
    {
        name: "DateTime",
        decode: node_opcua_basic_types_1.decodeDateTime,
        encode: node_opcua_basic_types_1.encodeDateTime,
        coerce: node_opcua_basic_types_1.coerceDateTime,
        defaultValue: exports.minDate
    },
    {
        name: "Guid",
        decode: node_opcua_basic_types_1.decodeGuid,
        encode: node_opcua_basic_types_1.encodeGuid,
        defaultValue: node_opcua_guid_1.emptyGuid
    },
    {
        name: "ByteString",
        decode: node_opcua_basic_types_1.decodeByteString,
        encode: node_opcua_basic_types_1.encodeByteString,
        coerce: node_opcua_basic_types_1.coerceByteString,
        defaultValue: null,
        toJSON: toJSONGuid
    },
    {
        name: "XmlElement",
        decode: node_opcua_basic_types_1.decodeString,
        encode: node_opcua_basic_types_1.encodeString,
        defaultValue: defaultXmlElement
    },
    // see OPCUA Part 3 - V1.02 $8.2.1
    {
        name: "NodeId",
        decode: node_opcua_basic_types_1.decodeNodeId,
        encode: node_opcua_basic_types_1.encodeNodeId,
        coerce: node_opcua_basic_types_1.coerceNodeId,
        defaultValue: node_opcua_nodeid_1.makeNodeId
    },
    {
        name: "ExpandedNodeId",
        decode: node_opcua_basic_types_1.decodeExpandedNodeId,
        encode: node_opcua_basic_types_1.encodeExpandedNodeId,
        coerce: node_opcua_basic_types_1.coerceExpandedNodeId,
        defaultValue: node_opcua_nodeid_1.makeExpandedNodeId
    },
    // ----------------------------------------------------------------------------------------
    // Simple  DataTypes
    // ( see OPCUA Part III v1.02 - $5.8.2 )
    // Simple DataTypes are subtypes of the Built-in DataTypes. They are handled on the wire like the
    // Built-in   DataType, i.e. they cannot be distinguished on the wire from their  Built-in supertypes.
    // Since they are handled like  Built-in   DataTypes  regarding the encoding they cannot have encodings
    // defined  in the  AddressSpace.  Clients  can read the  DataType  Attribute  of a  Variable  or  VariableType  to
    // identify the  Simple  DataType  of the  Value  Attribute. An example of a  Simple  DataType  is  Duration. It
    // is handled on the wire as a  Double   but the Client can read the  DataType  Attribute  and thus interpret
    // the value as defined by  Duration
    //
    // OPC Unified Architecture, part 4.0 $7.13
    // IntegerID: This primitive data type is an UInt32 that is used as an identifier, such as a handle. All values,
    // except for 0, are valid.
    {
        name: "IntegerId",
        decode: node_opcua_basic_types_1.decodeUInt32,
        encode: node_opcua_basic_types_1.encodeUInt32,
        defaultValue: 0xFFFFFFFF
    },
    // The StatusCode is a 32-bit unsigned integer. The top 16 bits represent the numeric value of the
    // code that shall be used for detecting specific errors or conditions. The bottom 16 bits are bit flags
    // that contain additional information but do not affect the meaning of the StatusCode.
    // 7.33 Part 4 - P 143
    {
        name: "StatusCode",
        decode: node_opcua_status_code_1.decodeStatusCode,
        encode: node_opcua_status_code_1.encodeStatusCode,
        coerce: node_opcua_status_code_1.coerceStatusCode,
        defaultValue: node_opcua_status_code_1.StatusCodes.Good
    }
];
/**
 * @method registerType
 * @param schema {TypeSchemaBase}
 */
function registerType(schema) {
    node_opcua_assert_1.assert(typeof schema.name === "string");
    if (!_.isFunction(schema.encode)) {
        throw new Error("schema " + schema.name + " has no encode function");
    }
    if (!_.isFunction(schema.decode)) {
        throw new Error("schema " + schema.name + " has no decode function");
    }
    schema.category = types_1.FieldCategory.basic;
    const definition = new BasicTypeSchema(schema);
    _defaultTypeMap.set(schema.name, definition);
}
exports.registerType = registerType;
exports.registerBuiltInType = registerType;
function unregisterType(typeName) {
    _defaultTypeMap.delete(typeName);
}
exports.unregisterType = unregisterType;
/**
 * @method findSimpleType
 * @param name
 * @return {TypeSchemaBase|null}
 */
function findSimpleType(name) {
    const typeSchema = _defaultTypeMap.get(name);
    if (!typeSchema) {
        throw new Error("Cannot find schema for simple type " + name);
    }
    node_opcua_assert_1.assert(typeSchema instanceof types_1.TypeSchemaBase);
    return typeSchema;
}
exports.findSimpleType = findSimpleType;
// populate the default type map
const _defaultTypeMap = new Map();
_defaultType.forEach(registerType);
function hasBuiltInType(name) {
    return _defaultTypeMap.has(name);
}
exports.hasBuiltInType = hasBuiltInType;
function getBuildInType(name) {
    return _defaultTypeMap.get(name);
}
exports.getBuildInType = getBuildInType;
/**
 * @method findBuiltInType
 * find the Builtin Type that this
 * @param dataTypeName
 * @return {*}
 */
function findBuiltInType(dataTypeName) {
    // coerce string or Qualified Name to string
    if (dataTypeName.name) {
        dataTypeName = dataTypeName.toString();
    }
    node_opcua_assert_1.assert(typeof dataTypeName === "string", "findBuiltInType : expecting a string " + dataTypeName);
    const t = _defaultTypeMap.get(dataTypeName);
    if (!t) {
        throw new Error("datatype " + dataTypeName + " must be registered");
    }
    if (t.subType && t.subType !== t.name /* avoid infinite recursion */) {
        return findBuiltInType(t.subType);
    }
    return t;
}
exports.findBuiltInType = findBuiltInType;
function getTypeMap() {
    return _defaultTypeMap;
}
exports.getTypeMap = getTypeMap;
//# sourceMappingURL=factories_builtin_types.js.map