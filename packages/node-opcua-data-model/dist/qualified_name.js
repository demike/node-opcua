"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-data-model
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_factory_1 = require("node-opcua-factory");
const _ = require("underscore");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
exports.schemaQualifiedName = node_opcua_factory_1.buildStructuredType({
    baseType: "BaseUAObject",
    name: "QualifiedName",
    fields: [
        {
            name: "namespaceIndex",
            fieldType: "UInt16"
        },
        {
            name: "name",
            fieldType: "UAString",
            defaultValue: () => null
        }
    ]
});
exports.schemaQualifiedName.coerce = coerceQualifiedName;
class QualifiedName extends node_opcua_factory_1.BaseUAObject {
    /**
     *
     * @class QualifiedName
     * @constructor
     * @extends BaseUAObject
     * @param  options {Object}
     */
    constructor(options) {
        super();
        const schema = QualifiedName.schema;
        options = options || {};
        /* istanbul ignore next */
        if (node_opcua_factory_1.parameters.debugSchemaHelper) {
            node_opcua_factory_1.check_options_correctness_against_schema(this, schema, options);
        }
        /**
         * @property namespaceIndex
         * @type {Int32}
         */
        this.namespaceIndex = node_opcua_factory_1.initialize_field(schema.fields[0], options.namespaceIndex);
        /**
         * @property name
         * @type {UAString}
         */
        this.name = node_opcua_factory_1.initialize_field(schema.fields[1], options.name);
    }
    /**
     * encode the object into a binary stream
     * @method encode
     *
     * @param stream {BinaryStream}
     */
    encode(stream) {
        // call base class implementation first
        super.encode(stream);
        node_opcua_basic_types_1.encodeUInt16(this.namespaceIndex, stream);
        node_opcua_basic_types_1.encodeUAString(this.name, stream);
    }
    /**
     * decode the object from a binary stream
     * @method decode
     *
     * @param stream {BinaryStream}
     */
    decode(stream) {
        // call base class implementation first
        super.decode(stream);
        this.namespaceIndex = node_opcua_basic_types_1.decodeUInt16(stream);
        this.name = node_opcua_basic_types_1.decodeUAString(stream);
    }
    toString() {
        if (this.namespaceIndex) {
            return this.namespaceIndex + ":" + this.name;
        }
        return this.name || "<null>";
    }
    isEmpty() {
        return !this.name || this.name.length === 0;
    }
}
exports.QualifiedName = QualifiedName;
QualifiedName.schema = exports.schemaQualifiedName;
QualifiedName.possibleFields = [
    "namespaceIndex",
    "name"
];
QualifiedName.encodingDefaultBinary = node_opcua_nodeid_1.makeExpandedNodeId(0, 0);
QualifiedName.encodingDefaultXml = node_opcua_nodeid_1.makeExpandedNodeId(0, 0);
QualifiedName.prototype.schema = QualifiedName.schema;
// xx QualifiedName.prototype.isEmpty = function (): boolean {
// xx    return !this.name || this.name.length === 0;
// xx}
function isInteger(value) {
    return typeof value === "number" &&
        isFinite(value) &&
        Math.floor(value) === value;
}
/**
 * @method stringToQualifiedName
 * @param value {String}
 * @return {{namespaceIndex: Number, name: String}}
 *
 * @example
 *
 *  stringToQualifiedName("Hello")   => {namespaceIndex: 0, name: "Hello"}
 *  stringToQualifiedName("3:Hello") => {namespaceIndex: 3, name: "Hello"}
 */
function stringToQualifiedName(value) {
    const splitArray = value.split(":");
    let namespaceIndex = 0;
    if (!isNaN(parseFloat(splitArray[0])) &&
        isFinite(parseInt(splitArray[0], 10)) &&
        isInteger(parseFloat(splitArray[0])) &&
        splitArray.length > 1) {
        namespaceIndex = parseInt(splitArray[0], 10);
        splitArray.shift();
        value = splitArray.join(":");
    }
    return new QualifiedName({ namespaceIndex, name: value });
}
exports.stringToQualifiedName = stringToQualifiedName;
function coerceQualifiedName(value) {
    if (!value) {
        return null;
    }
    else if (value instanceof QualifiedName) {
        return value;
    }
    else if (_.isString(value)) {
        return stringToQualifiedName(value);
    }
    else {
        node_opcua_assert_1.assert(value.hasOwnProperty("namespaceIndex"));
        node_opcua_assert_1.assert(value.hasOwnProperty("name"));
        return new exports.QualifiedName(value);
    }
}
exports.coerceQualifiedName = coerceQualifiedName;
node_opcua_factory_1.registerSpecialVariantEncoder(QualifiedName);
function encodeQualifiedName(value, stream) {
    value.encode(stream);
}
exports.encodeQualifiedName = encodeQualifiedName;
function decodeQualifiedName(stream) {
    const value = new QualifiedName({});
    value.decode(stream);
    return value;
}
exports.decodeQualifiedName = decodeQualifiedName;
//# sourceMappingURL=qualified_name.js.map