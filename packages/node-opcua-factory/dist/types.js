"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
var FieldCategory;
(function (FieldCategory) {
    FieldCategory["enumeration"] = "enumeration";
    FieldCategory["complex"] = "complex";
    FieldCategory["basic"] = "basic";
})(FieldCategory = exports.FieldCategory || (exports.FieldCategory = {}));
// tslint:disable-next-line:no-empty
function defaultEncode(value, stream) {
}
// tslint:disable-next-line:no-empty
function defaultDecode(stream) {
}
/**
 * @class TypeSchemaBase
 * @param options {Object}
 * @constructor
 * create a new type Schema
 */
class TypeSchemaBase {
    constructor(options) {
        node_opcua_assert_1.assert(options.category !== null);
        this.encode = options.encode || undefined;
        this.decode = options.decode || undefined;
        this.coerce = options.coerce;
        this.category = options.category || FieldCategory.basic;
        this.name = options.name;
        for (const prop in options) {
            if (options.hasOwnProperty(prop)) {
                this[prop] = options[prop];
            }
        }
    }
    /**
     * @method  computer_default_value
     * @param defaultValue {*} the default value
     * @return {*}
     */
    computer_default_value(defaultValue) {
        if (defaultValue === undefined) {
            defaultValue = this.defaultValue;
        }
        if (_.isFunction(defaultValue)) {
            // be careful not to cache this value , it must be call each time to make sure
            // we do not end up with the same value/instance twice.
            defaultValue = defaultValue();
        }
        return defaultValue;
    }
    /**
     * @method initialize_value
     * @param value
     * @param defaultValue
     * @return {*}
     */
    initialize_value(value, defaultValue) {
        if (value === undefined) {
            return defaultValue;
        }
        if (defaultValue === null) {
            if (value === null) {
                return null;
            }
        }
        if (value === undefined) {
            return defaultValue;
        }
        if (this.coerce) {
            value = this.coerce(value);
        }
        return value;
    }
}
exports.TypeSchemaBase = TypeSchemaBase;
//# sourceMappingURL=types.js.map