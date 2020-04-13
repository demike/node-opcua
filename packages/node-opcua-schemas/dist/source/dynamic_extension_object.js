"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-schemas
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_extension_object_1 = require("node-opcua-extension-object");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
function getOrCreateConstructor(fieldType, typeDictionary, encodingDefaultBinary, encodingDefaultXml) {
    if (typeDictionary.hasStructuredType(fieldType)) {
        return typeDictionary.getStructureTypeConstructor(fieldType);
    }
    const schema = typeDictionary.structuredTypes[fieldType];
    // istanbul ignore next
    if (!schema) {
        throw new Error("Unknown type in dictionary " + fieldType);
    }
    const constructor = createDynamicObjectConstructor(schema, typeDictionary);
    if (!constructor) {
        return constructor;
    }
    // istanbul ignore next
    if (!typeDictionary.hasStructuredType(fieldType)) {
        typeDictionary.registerFactory(fieldType, constructor);
        return constructor;
        // hrow new Error("constructor should now be registered - " + fieldType);
    }
    if (encodingDefaultBinary && encodingDefaultBinary.value !== 0) {
        schema.encodingDefaultBinary = encodingDefaultBinary;
        schema.encodingDefaultXml = encodingDefaultXml;
        constructor.encodingDefaultBinary = encodingDefaultBinary;
        constructor.encodingDefaultXml = encodingDefaultXml;
        typeDictionary.associateWithBinaryEncoding(fieldType, encodingDefaultBinary);
    }
    return constructor;
}
exports.getOrCreateConstructor = getOrCreateConstructor;
function encodeArrayOrElement(field, obj, stream, encodeFunc) {
    if (field.isArray) {
        const array = obj[field.name];
        if (!array) {
            stream.writeUInt32(0xFFFFFFFF);
        }
        else {
            stream.writeUInt32(array.length);
            for (const e of array) {
                if (encodeFunc) {
                    encodeFunc(e, stream);
                }
                else {
                    e.encode(stream);
                }
            }
        }
    }
    else {
        if (encodeFunc) {
            encodeFunc(obj[field.name], stream);
        }
        else {
            if (!obj[field.name].encode) {
                // tslint:disable:no-console
                console.log(obj.schema.fields, field);
                throw new Error("encodeArrayOrElement: object field "
                    + field.name + " has no encode method and encodeFunc is missing");
            }
            obj[field.name].encode(stream);
        }
    }
}
function decodeArrayOrElement(typeDictionary, field, obj, stream, decodeFunc) {
    if (field.isArray) {
        const array = [];
        const nbElements = stream.readUInt32();
        if (nbElements === 0xFFFFFFFF) {
            obj[field.name] = null;
        }
        else {
            for (let i = 0; i < nbElements; i++) {
                if (decodeFunc) {
                    array.push(decodeFunc(stream));
                }
                else {
                    // construct an instance
                    const constructor = typeDictionary.getStructureTypeConstructor(field.fieldType);
                    const element = new constructor({});
                    element.decode(stream);
                    array.push(element);
                }
            }
            obj[field.name] = array;
        }
    }
    else {
        if (decodeFunc) {
            obj[field.name] = decodeFunc(stream);
        }
        else {
            if (!obj[field.name]) {
                throw new Error(" cannot find field with name " + field.name);
            }
            obj[field.name].decode(stream);
        }
    }
}
function initializeField(field, thisAny, options, schema, typeDictionary) {
    const name = field.name;
    switch (field.category) {
        case node_opcua_factory_1.FieldCategory.complex: {
            const constuctor = getOrCreateConstructor(field.fieldType, typeDictionary) || node_opcua_factory_1.BaseUAObject;
            if (field.isArray) {
                (thisAny)[name] = (options[name] || []).map((x) => constuctor ? new constuctor(x) : null);
            }
            else {
                (thisAny)[name] = constuctor ? new constuctor(options[name]) : null;
            }
            // xx processStructuredType(fieldSchema);
            break;
        }
        case node_opcua_factory_1.FieldCategory.enumeration:
        case node_opcua_factory_1.FieldCategory.basic:
            if (field.isArray) {
                (thisAny)[name] = node_opcua_factory_1.initialize_field_array(field, options[name]);
            }
            else {
                (thisAny)[name] = node_opcua_factory_1.initialize_field(field, options[name]);
            }
            break;
    }
}
/**
 * @private
 * @param thisAny
 * @param options
 * @param schema
 * @param typeDictionary
 */
function initializeFields(thisAny, options, schema, typeDictionary) {
    // initialize base class first
    if (schema._baseSchema && schema._baseSchema.fields.length) {
        initializeFields(thisAny, options, schema._baseSchema, typeDictionary);
    }
    // finding fields that are in options but not in schema!
    for (const field of schema.fields) {
        const name = field.name;
        // dealing with optional fields
        if (field.switchBit !== undefined && options[field.name] === undefined) {
            (thisAny)[name] = undefined;
            continue;
        }
        initializeField(field, thisAny, options, schema, typeDictionary);
    }
}
function encodeFields(thisAny, schema, stream) {
    // encodeFields base class first
    if (schema._baseSchema && schema._baseSchema.fields.length) {
        encodeFields(thisAny, schema._baseSchema, stream);
    }
    // ============ Deal with switchBits
    if (schema.bitFields && schema.bitFields.length) {
        let bitField = 0;
        for (const field of schema.fields) {
            if (field.switchBit === undefined) {
                continue;
            }
            if ((thisAny)[field.name] === undefined) {
                continue;
            }
            // tslint:disable-next-line:no-bitwise
            bitField |= (1 << field.switchBit);
        }
        // write
        stream.writeUInt32(bitField);
    }
    for (const field of schema.fields) {
        // ignore
        if (field.switchBit !== undefined && (thisAny)[field.name] === undefined) {
            continue;
        }
        switch (field.category) {
            case node_opcua_factory_1.FieldCategory.complex:
                encodeArrayOrElement(field, thisAny, stream);
                break;
            case node_opcua_factory_1.FieldCategory.enumeration:
            case node_opcua_factory_1.FieldCategory.basic:
                encodeArrayOrElement(field, thisAny, stream, field.schema.encode);
                break;
            default:
                /* istanbul ignore next*/
                throw new Error("Invalid category " + field.category + " " + node_opcua_factory_1.FieldCategory[field.category]);
        }
    }
}
function decodeFields(thisAny, schema, stream, typeDictionary) {
    // encodeFields base class first
    if (schema._baseSchema && schema._baseSchema.fields.length) {
        decodeFields(thisAny, schema._baseSchema, stream, typeDictionary);
    }
    // ============ Deal with switchBits
    let bitField = 0;
    if (schema.bitFields && schema.bitFields.length) {
        bitField = stream.readUInt32();
    }
    for (const field of schema.fields) {
        // ignore fields that have a switch bit when bit is not set
        if (field.switchBit !== undefined) {
            // tslint:disable-next-line:no-bitwise
            if ((bitField & (1 << field.switchBit)) === 0) {
                (thisAny)[field.name] = undefined;
                continue;
            }
            else {
                if (field.category === node_opcua_factory_1.FieldCategory.complex && (thisAny)[field.name] === undefined) {
                    // need to create empty structure for deserialisation
                    initializeField(field, thisAny, {}, schema, typeDictionary);
                }
            }
        }
        switch (field.category) {
            case node_opcua_factory_1.FieldCategory.complex:
                decodeArrayOrElement(typeDictionary, field, thisAny, stream);
                break;
            case node_opcua_factory_1.FieldCategory.enumeration:
            case node_opcua_factory_1.FieldCategory.basic:
                decodeArrayOrElement(typeDictionary, field, thisAny, stream, field.schema.decode);
                break;
            default:
                /* istanbul ignore next*/
                throw new Error("Invalid category " + field.category + " " + node_opcua_factory_1.FieldCategory[field.category]);
        }
    }
}
class DynamicExtensionObject extends node_opcua_extension_object_1.ExtensionObject {
    constructor(options, schema, typeDictionary) {
        node_opcua_assert_1.assert(schema, "expecting a schema here ");
        node_opcua_assert_1.assert(typeDictionary, "expecting a typeDic");
        super(options);
        options = options || {};
        this.__schema = schema;
        this._typeDictionary = typeDictionary;
        node_opcua_factory_1.check_options_correctness_against_schema(this, this.schema, options);
        initializeFields(this, options, this.schema, typeDictionary);
    }
    encode(stream) {
        super.encode(stream);
        encodeFields(this, this.schema, stream);
    }
    decode(stream) {
        super.decode(stream);
        decodeFields(this, this.schema, stream, this._typeDictionary);
    }
    get schema() {
        return this.__schema;
    }
}
DynamicExtensionObject.schema = node_opcua_extension_object_1.ExtensionObject.schema;
DynamicExtensionObject.possibleFields = [];
// tslint:disable-next-line:max-classes-per-file
class UnionBaseClass extends node_opcua_factory_1.BaseUAObject {
    constructor(options, schema, typeDictionary) {
        super();
        node_opcua_assert_1.assert(schema, "expecting a schema here ");
        node_opcua_assert_1.assert(typeDictionary, "expecting a typeDic");
        options = options || {};
        this.__schema = schema;
        node_opcua_factory_1.check_options_correctness_against_schema(this, this.schema, options);
        let uniqueFieldHasBeenFound = false;
        let switchFieldName = "";
        // finding fields that are in options but not in schema!
        for (const field of this.schema.fields) {
            const name = field.name;
            if (field.switchValue === undefined) {
                // this is the switch value field
                switchFieldName = field.name;
                continue;
            }
            node_opcua_assert_1.assert(switchFieldName.length > 0, "It seems that there is no switch field in union schema");
            node_opcua_assert_1.assert(field.switchValue !== undefined, "union schema must only have one switched value field");
            // dealing with optional fields
            /* istanbul ignore next */
            if (uniqueFieldHasBeenFound && options[field.name] !== undefined) {
                // let try to be helpful for the developper by providing some hint
                debugLog(this.schema);
                throw new Error("union must have only one choice in " + JSON.stringify(options) +
                    "\n found while investigating " + field.name +
                    "\n switchFieldName = " + switchFieldName);
            }
            if (options[switchFieldName] !== undefined) {
                // then options[switchFieldName] must equal
                if (options[switchFieldName] !== field.switchValue) {
                    continue;
                }
            }
            else {
                // the is no switchFieldName , in this case the i
                if (options[name] === undefined) {
                    continue;
                }
            }
            uniqueFieldHasBeenFound = true;
            this[switchFieldName] = field.switchValue;
            switch (field.category) {
                case node_opcua_factory_1.FieldCategory.complex: {
                    const constuctor = getOrCreateConstructor(field.fieldType, typeDictionary) || node_opcua_factory_1.BaseUAObject;
                    if (field.isArray) {
                        this[name] = (options[name] || []).map((x) => constuctor ? new constuctor(x) : null);
                    }
                    else {
                        this[name] = constuctor ? new constuctor(options[name]) : null;
                    }
                    // xx processStructuredType(fieldSchema);
                    break;
                }
                case node_opcua_factory_1.FieldCategory.enumeration:
                case node_opcua_factory_1.FieldCategory.basic:
                    if (field.isArray) {
                        this[name] = node_opcua_factory_1.initialize_field_array(field, options[name]);
                    }
                    else {
                        this[name] = node_opcua_factory_1.initialize_field(field, options[name]);
                    }
                    break;
            }
        }
        if (!uniqueFieldHasBeenFound) {
            if (Object.keys(options).length === 0) {
                this[switchFieldName] = 0xFFFFFFFF;
                return;
            }
            const r = schema.fields.filter((f) => f.switchValue !== undefined).map((f) => f.name).join(" , ");
            // it is possible also that the switchfield value do not correspond to a valid field
            const foundFieldForSwitchValue = schema.fields.findIndex((f) => f.switchValue !== undefined && f.switchValue === options[switchFieldName]);
            if (foundFieldForSwitchValue) {
                // throw new Error(this.schema.name + ": cannot find field with value "
                // +  options[switchFieldName]);
            }
            else {
                console.log(this.schema);
                throw new Error(this.schema.name + ": At least one of [ " + r + " ] must be specified in " + JSON.stringify(options));
            }
        }
    }
    encode(stream) {
        const switchFieldName = this.schema.fields[0].name;
        const switchValue = this[switchFieldName];
        if (typeof switchValue !== "number") {
            throw new Error("Invalid switchValue  " + switchValue);
        }
        stream.writeUInt32(switchValue);
        for (const field of this.schema.fields) {
            if (field.switchValue === undefined || field.switchValue !== switchValue) {
                continue;
            }
            switch (field.category) {
                case node_opcua_factory_1.FieldCategory.complex:
                    encodeArrayOrElement(field, this, stream);
                    break;
                case node_opcua_factory_1.FieldCategory.enumeration:
                case node_opcua_factory_1.FieldCategory.basic:
                    encodeArrayOrElement(field, this, stream, field.schema.encode);
                    break;
                default:
                    /* istanbul ignore next*/
                    throw new Error("Invalid category " + field.category + " " + node_opcua_factory_1.FieldCategory[field.category]);
            }
            break;
        }
    }
    decode(stream) {
        const typeDictionary = this.schema.$typeDictionary;
        const switchValue = stream.readUInt32();
        const switchFieldName = this.schema.fields[0].name;
        this[switchFieldName] = switchValue;
        for (const field of this.schema.fields) {
            if (field.switchValue === undefined || field.switchValue !== switchValue) {
                continue;
            }
            switch (field.category) {
                case node_opcua_factory_1.FieldCategory.complex:
                    decodeArrayOrElement(typeDictionary, field, this, stream);
                    break;
                case node_opcua_factory_1.FieldCategory.enumeration:
                case node_opcua_factory_1.FieldCategory.basic:
                    decodeArrayOrElement(typeDictionary, field, this, stream, field.schema.decode);
                    break;
                default:
                    /* istanbul ignore next*/
                    throw new Error("Invalid category " + field.category + " " + node_opcua_factory_1.FieldCategory[field.category]);
            }
            break;
        }
    }
    get schema() {
        return this.__schema;
    }
    toString() {
        return super.toString();
    }
    toJSON() {
        const pojo = {};
        const switchFieldName = this.schema.fields[0].name;
        const switchValue = this[switchFieldName];
        if (typeof switchValue !== "number") {
            throw new Error("Invalid switchValue  " + switchValue);
        }
        pojo[switchFieldName] = switchValue;
        for (const field of this.schema.fields) {
            if (field.switchValue === undefined || field.switchValue !== switchValue) {
                continue;
            }
            if (this[field.name] === undefined) {
                continue;
            }
            switch (field.category) {
                case node_opcua_factory_1.FieldCategory.complex:
                    pojo[field.name] = this[field.name].toJSON();
                    break;
                case node_opcua_factory_1.FieldCategory.enumeration:
                case node_opcua_factory_1.FieldCategory.basic:
                    pojo[field.name] = this[field.name].toJSON ? this[field.name].toJSON() : this[field.name];
                    break;
                default:
                    /* istanbul ignore next*/
                    throw new Error("Invalid category " + field.category + " " + node_opcua_factory_1.FieldCategory[field.category]);
            }
            break;
        }
        return pojo;
    }
}
function _createDynamicUnionConstructor(schema, typeDictionary) {
    const possibleFields = schema.fields.map((x) => x.name);
    // tslint:disable-next-line:max-classes-per-file
    class UNION extends UnionBaseClass {
        constructor(options) {
            super(options, schema, typeDictionary);
            node_opcua_assert_1.assert(this.schema === schema);
        }
    }
    UNION.possibleFields = possibleFields;
    UNION.schema = schema;
    // to do : may be remove DataType suffix here ?
    Object.defineProperty(UNION, "name", { value: schema.name });
    return UNION;
}
function createDynamicObjectConstructor(schema, typeDictionary) {
    const schemaPriv = schema;
    if (schemaPriv.$Constructor) {
        return schemaPriv.$Constructor;
    }
    if (schema.baseType === "Union") {
        const UNIONConstructor = _createDynamicUnionConstructor(schema, typeDictionary);
        schemaPriv.$Constructor = UNIONConstructor;
        return UNIONConstructor;
    }
    let possibleFields = schema.fields.map((x) => x.name);
    let BaseClass = DynamicExtensionObject;
    if (schema.baseType !== "ExtensionObject") {
        BaseClass = getOrCreateConstructor(schema.baseType, typeDictionary);
        if (!BaseClass) {
            throw new Error("Cannot find base class : " + schema.baseType);
        }
        if (BaseClass.possibleFields) {
            possibleFields = BaseClass.possibleFields.concat(possibleFields);
        }
        schema._baseSchema = BaseClass.schema;
    }
    // tslint:disable-next-line:max-classes-per-file
    class EXTENSION extends BaseClass {
        constructor(options, schema2, typeDictionary2) {
            super(options, schema2 ? schema2 : schema, typeDictionary2 ? typeDictionary2 : typeDictionary);
        }
        toString() {
            return super.toString();
        }
    }
    EXTENSION.encodingDefaultXml = new node_opcua_nodeid_1.ExpandedNodeId(node_opcua_nodeid_1.NodeIdType.NUMERIC, 0, 0);
    EXTENSION.encodingDefaultBinary = new node_opcua_nodeid_1.ExpandedNodeId(node_opcua_nodeid_1.NodeIdType.NUMERIC, 0, 0);
    EXTENSION.possibleFields = possibleFields;
    EXTENSION.schema = schema;
    // to do : may be remove DataType suffix here ?
    Object.defineProperty(EXTENSION, "name", { value: schema.name });
    schemaPriv.$Constructor = EXTENSION;
    typeDictionary.registerFactory(schema.name, EXTENSION);
    return EXTENSION;
}
exports.createDynamicObjectConstructor = createDynamicObjectConstructor;
//# sourceMappingURL=dynamic_extension_object.js.map