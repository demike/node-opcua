"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const factories_builtin_types_1 = require("./factories_builtin_types");
function _self_encode(constructor) {
    node_opcua_assert_1.assert(_.isFunction(constructor));
    return (value, stream) => {
        if (!value || !value.encode) {
            value = new constructor(value);
        }
        value.encode(stream);
    };
}
function _self_decode(constructor) {
    node_opcua_assert_1.assert(_.isFunction(constructor));
    return (stream) => {
        const value = new constructor();
        value.decode(stream);
        return value;
    };
}
function _self_coerce(constructor) {
    node_opcua_assert_1.assert(_.isFunction(constructor));
    return (value) => {
        const obj = new constructor(value);
        return obj;
    };
}
function registerSpecialVariantEncoder(constructor) {
    node_opcua_assert_1.assert(_.isFunction(constructor));
    const name = constructor.prototype.schema.name;
    factories_builtin_types_1.registerType({
        name,
        subType: name,
        encode: _self_encode(constructor),
        decode: _self_decode(constructor),
        coerce: _self_coerce(constructor),
        defaultValue: () => new constructor()
    });
}
exports.registerSpecialVariantEncoder = registerSpecialVariantEncoder;
//# sourceMappingURL=factories_builtin_types_special.js.map