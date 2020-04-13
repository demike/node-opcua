"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const _ = require("underscore");
const util = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const factories_builtin_types_1 = require("./factories_builtin_types");
/**
 * register a Basic Type ,
 * A basic type is new entity type that resolved to  a SubType
 * @example:
 *
 *
 *   registerBasicType({name:"Duration"   ,subType:"Double"});
 *
 * @method registerBasicType
 * @param schema
 * @param schema.name {String}
 * @param schema.subType {String} mandatory, the basic type from which the new type derives.
 *
 * @param [schema.encode] {Function} optional,a specific encoder function to encode an instance of this type.
 * @param schema.encode.value  {*}
 * @param schema.encode.stream {BinaryStream}
 *
 * @param [schema.decode] optional,a specific decoder function that returns  the decode value out of the stream.
 * @param [schema.decode.stream] {BinaryStream}
 *
 * @param [schema.coerce]  optional, a method to convert a value into the request type.
 * @param schema.coerce.value {*} the value to coerce.
 *
 * @param [schema.random] optional, a method to construct a random object of this type
 *
 * @param [schema.toJSON]optional, a method to convert a value into the request type.
 */
function registerBasicType(schema) {
    const exists = factories_builtin_types_1.hasBuiltInType(schema.name);
    if (exists) {
        console.log(schema);
        throw new Error(`Basic Type ${schema.name} already registered`);
    }
    const name = schema.name;
    const t = factories_builtin_types_1.findSimpleType(schema.subType);
    /* istanbul ignore next */
    if (!t) {
        // tslint:disable-next-line:no-console
        console.log(util.inspect(schema, { colors: true }));
        throw new Error(" cannot find subtype " + schema.subType);
    }
    node_opcua_assert_1.assert(_.isFunction(t.decode));
    const encodeFunc = schema.encode || t.encode;
    node_opcua_assert_1.assert(_.isFunction(encodeFunc));
    const decodeFunc = schema.decode || t.decode;
    node_opcua_assert_1.assert(_.isFunction(decodeFunc));
    const defaultValue = (schema.defaultValue === undefined) ? t.defaultValue : schema.defaultValue;
    // assert(_.isFunction(defaultValue));
    const coerceFunc = schema.coerce || t.coerce;
    const toJSONFunc = schema.toJSON || t.toJSON;
    const random = schema.random || defaultValue;
    const newSchema = {
        name,
        subType: schema.subType,
        coerce: coerceFunc,
        decode: decodeFunc,
        encode: encodeFunc,
        random,
        defaultValue,
        toJSON: toJSONFunc,
    };
    factories_builtin_types_1.registerType(newSchema);
}
exports.registerBasicType = registerBasicType;
// =============================================================================================
// Registering the Basic Type already defined int the OPC-UA Specification
// =============================================================================================
registerBasicType({ name: "Counter", subType: "UInt32" });
// OPC Unified Architecture, part 3.0 $8.13 page 65
registerBasicType({ name: "Duration", subType: "Double" });
registerBasicType({ name: "UAString", subType: "String" });
registerBasicType({ name: "UABoolean", subType: "Boolean" });
registerBasicType({ name: "UtcTime", subType: "DateTime" });
// already ? registerBasicType({name: "Int8",     subType: "SByte"});
// already ? registerBasicType({name: "UInt8",    subType: "Byte"});
registerBasicType({ name: "Char", subType: "Byte" });
// xx registerBasicType({name:"XmlElement" ,subType:"String"  });
registerBasicType({ name: "Time", subType: "String" });
// string in the form "en-US" or "de-DE" or "fr" etc...
registerBasicType({ name: "LocaleId",
    subType: "String",
    defaultValue: null,
    decode: node_opcua_basic_types_1.decodeLocaleId,
    encode: node_opcua_basic_types_1.encodeLocaleId,
    validate: node_opcua_basic_types_1.validateLocaleId,
});
registerBasicType({ name: "ContinuationPoint", subType: "ByteString" });
registerBasicType({ name: "Image", subType: "ByteString" });
registerBasicType({ name: "NodeIdType", subType: "NodeId" });
registerBasicType({ name: "ImageBMP", subType: "Image" });
registerBasicType({ name: "ImageGIF", subType: "Image" });
registerBasicType({ name: "ImageJPG", subType: "Image" });
registerBasicType({ name: "ImagePNG", subType: "Image" });
registerBasicType({ name: "AudioDataType", subType: "ByteString" });
registerBasicType({ name: "BitFieldMaskDataType", subType: "UInt64" });
registerBasicType({ name: "DataSetFieldFlags", subType: "UInt16" });
registerBasicType({ name: "DataSetFieldContentMask", subType: "UInt32" });
registerBasicType({ name: "UadpNetworkMessageContentMask", subType: "UInt32" });
registerBasicType({ name: "UadpDataSetMessageContentMask", subType: "UInt32" });
registerBasicType({ name: "JsonNetworkMessageContentMask", subType: "UInt32" });
registerBasicType({ name: "JsonDataSetMessageContentMask", subType: "UInt32" });
registerBasicType({ name: "PermissionType", subType: "UInt32" });
registerBasicType({ name: "AccessLevelType", subType: "Byte" });
registerBasicType({ name: "AccessLevelExType", subType: "UInt32" });
registerBasicType({ name: "EventNotifierType", subType: "Byte" });
registerBasicType({ name: "AccessRestrictionType", subType: "UInt32" });
registerBasicType({ name: "NormalizedString", subType: "String" });
registerBasicType({ name: "DecimalString", subType: "String" });
registerBasicType({ name: "DurationString", subType: "String" });
registerBasicType({ name: "TimeString", subType: "String" });
registerBasicType({ name: "DateString", subType: "String" });
registerBasicType({ name: "Index", subType: "UInt32" });
registerBasicType({ name: "VersionTime", subType: "UInt32" });
registerBasicType({ name: "ApplicationInstanceCertificate", subType: "ByteString" });
registerBasicType({ name: "AttributeWriteMask", subType: "UInt32" });
registerBasicType({ name: "Date", subType: "DateTime" });
// registerBasicType({ name: "Counter", subType: "UInt32" });
// registerBasicType({ name: "IntegerId", subType: "UInt32" });
// registerBasicType({ name: "UtcTime", subType: "DateTime" });
// registerBasicType({ name: "Duration", subType: "Double" });
// registerBasicType({ name: "LocaleId", subType: "String" });
// registerBasicType({ name: "NumericRange", subType: "String" });
// registerBasicType({ name: "Time", subType: "String" });
// registerBasicType({ name: "SessionAuthenticationToken", subType: "NodeId" });
//# sourceMappingURL=factories_basic_type.js.map