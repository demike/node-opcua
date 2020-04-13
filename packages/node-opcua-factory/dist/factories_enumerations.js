"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_enum_1 = require("node-opcua-enum");
const types_1 = require("./types");
const _enumerations = new Map();
function _encode_enumeration(typedEnum, value, stream) {
    node_opcua_assert_1.assert(typeof value === "number", "Expecting a number here");
    node_opcua_assert_1.assert(typedEnum.get(value) !== undefined, "expecting a valid value");
    stream.writeInteger(value);
}
function _decode_enumeration(typedEnum, stream) {
    const value = stream.readInteger();
    const e = typedEnum.get(value);
    // istanbul ignore next
    if (!e) {
        throw new Error("cannot  coerce value=" + value + " to " + typedEnum.constructor.name);
    }
    return value;
}
class EnumerationDefinitionSchema extends types_1.TypeSchemaBase {
    // xx encode: (value: EnumItem, stream: OutputBinaryStream) => void;
    // xx decode: (stream: BinaryStream) => EnumItem;
    constructor(options) {
        super(options);
        // create a new Enum
        const typedEnum = new node_opcua_enum_1.Enum(options.enumValues);
        options.typedEnum = typedEnum;
        node_opcua_assert_1.assert(!options.encode || _.isFunction(options.encode));
        node_opcua_assert_1.assert(!options.decode || _.isFunction(options.decode));
        this.encode = options.encode || _encode_enumeration.bind(null, typedEnum);
        this.decode = options.decode || _decode_enumeration.bind(null, typedEnum);
        this.typedEnum = options.typedEnum;
        this.defaultValue = this.typedEnum.getDefaultValue().value;
    }
}
exports.EnumerationDefinitionSchema = EnumerationDefinitionSchema;
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
function registerEnumeration(options) {
    node_opcua_assert_1.assert(options.hasOwnProperty("name"));
    node_opcua_assert_1.assert(options.hasOwnProperty("enumValues"));
    const name = options.name;
    if (_enumerations.hasOwnProperty(name)) {
        throw new Error("factories.registerEnumeration : Enumeration " + options.name + " has been already inserted");
    }
    const enumerationDefinition = new EnumerationDefinitionSchema(options);
    _enumerations.set(name, enumerationDefinition);
    return enumerationDefinition.typedEnum;
}
exports.registerEnumeration = registerEnumeration;
function hasEnumeration(enumerationName) {
    return _enumerations.has(enumerationName);
}
exports.hasEnumeration = hasEnumeration;
function getEnumeration(enumerationName) {
    node_opcua_assert_1.assert(exports.hasEnumeration(enumerationName));
    return _enumerations.get(enumerationName);
}
exports.getEnumeration = getEnumeration;
//# sourceMappingURL=factories_enumerations.js.map