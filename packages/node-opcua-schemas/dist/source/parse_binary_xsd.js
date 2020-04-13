"use strict";
/**
 * @module node-opcua-schemas
 */
// tslint:disable:no-console
// tslint:disable:object-literal-sort-keys
// tslint:disable:no-empty
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_xml2json_1 = require("node-opcua-xml2json");
const tools_1 = require("./tools");
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
function w(s, l) {
    return (s + "                                                    ").substr(0, l);
}
const predefinedType = {
    "opc:Bit": 1,
    "opc:Boolean": 1,
    "opc:Byte": 1,
    "opc:ByteString": 1,
    "opc:Char": 1,
    "opc:CharArray": 1,
    "opc:DateTime": 1,
    "opc:Double": 1,
    "opc:Float": 1,
    "opc:Guid": 1,
    "opc:Int16": 1,
    "opc:Int32": 1,
    "opc:Int64": 1,
    "opc:SByte": 1,
    "opc:String": 1,
    "opc:UInt16": 1,
    "opc:UInt32": 1,
    "opc:UInt64": 1,
    "ua:ByteStringNodeId": 1,
    "ua:DataValue": 1,
    "ua:DiagnosticInfo": 1,
    "ua:ExpandedNodeId": 1,
    "ua:ExtensionObject": 1,
    "ua:FourByteNodeId": 1,
    "ua:GuidNodeId": 1,
    "ua:LocalizedText": 1,
    "ua:NodeId": 1,
    "ua:NodeIdType": 1,
    "ua:NumericNodeId": 1,
    "ua:QualifiedName": 1,
    "ua:StatusCode": 1,
    "ua:StringNodeId": 1,
    "ua:TwoByteNodeId": 1,
    "ua:Variant": 1,
    "ua:XmlElement": 1
};
const found = {};
function resolveType(typeDictionary, typeName) {
    const namespace = typeName.split(":")[0];
    if (predefinedType[typeName]) {
        return;
    }
    if (!found[typeName]) {
        found[typeName] = typeName;
    }
    if (namespace === "ua") {
    }
}
class TypeDictionary extends node_opcua_factory_1.DataTypeFactory {
    constructor(baseDataFactories) {
        super(baseDataFactories);
        this.structuredTypes = {};
        this.structuredTypesRaw = {};
        this.enumeratedTypes = {};
        this.enumeratedTypesRaw = {};
    }
}
exports.TypeDictionary = TypeDictionary;
/* tslint:disable:object-literal-shorthand */
const state0 = {
    init: () => {
        const a = 1;
    },
    parser: {
        TypeDictionary: {
            init: function (name, attributes) {
                this.typeDictionary = this.engine.typeDictionary;
                this.typeDictionary.defaultByteOrder = attributes.DefaultByteOrder;
                this.typeDictionary.targetNamespace = attributes.TargetNamespace;
            },
            parser: {
                Import: {
                    init: function (name, attributes) {
                        this.parent.typeDictionary.imports.push(attributes.Namespace);
                    },
                    finish: function () {
                        // _register_namespace_uri(this.text);
                        if (doDebug) {
                            console.log("Import NameSpace = ", this.attrs.Namespace, " Location", this.attrs.Location);
                        }
                    }
                },
                EnumeratedType: {
                    init: function () {
                        this.typescriptDefinition = "";
                        if (doDebug) {
                            console.log(chalk_1.default.cyan("EnumeratedType Name="), w(this.attrs.Name, 40), "LengthInBits=", this.attrs.LengthInBits);
                        }
                        this.enumeratedType = {
                            enumeratedValues: {},
                            lengthInBits: parseInt(this.attrs.LengthInBits, 10),
                            name: this.attrs.Name
                        };
                        this.typescriptDefinition += `enum ${this.enumeratedType.name} {`;
                    },
                    parser: {
                        Documentation: {
                            finish: function () {
                                this.parent.enumeratedType.documentation = this.text;
                            }
                        },
                        EnumeratedValue: {
                            finish: function () {
                                if (doDebug) {
                                    console.log(" EnumeratedValue Name=", w(this.attrs.Name, 40), " Value=", this.attrs.Value);
                                }
                                const key = this.attrs.Name;
                                const value = parseInt(this.attrs.Value, 10);
                                const _enum = this.parent.enumeratedType.enumeratedValues;
                                _enum[_enum[key] = value] = key;
                                this.parent.typescriptDefinition += `\n  ${key} = ${value},`;
                            }
                        }
                    },
                    finish: function () {
                        this.typescriptDefinition += `\n}`;
                        this.parent.typeDictionary.enumeratedTypesRaw[this.attrs.Name] = this.enumeratedType;
                        if (doDebug) {
                            console.log(" this.typescriptDefinition  = ", this.typescriptDefinition);
                        }
                    }
                },
                StructuredType: {
                    init: function () {
                        if (doDebug) {
                            console.log(chalk_1.default.cyan("StructureType Name="), chalk_1.default.green(this.attrs.Name), " BaseType=", this.attrs.BaseType);
                        }
                        const baseType = this.attrs.BaseType;
                        const base = this.parent.typeDictionary.structuredTypesRaw[baseType];
                        const structuredType = {
                            name: this.attrs.Name,
                            baseType: baseType,
                            fields: []
                        };
                        if (base) {
                            structuredType.base = base;
                        }
                        this.structuredType = structuredType;
                    },
                    parser: {
                        Field: {
                            finish: function () {
                                if (this.attrs.SourceType) {
                                    // ignore  this field, This is a repetition of the base type field with same name
                                    return;
                                }
                                if (doDebug) {
                                    console.log(chalk_1.default.yellow(" field Name="), w(this.attrs.Name, 40), chalk_1.default.yellow(" field TypeName="), w(this.attrs.TypeName, 40), chalk_1.default.yellow(" field LengthField="), w(this.attrs.LengthField, 40));
                                }
                                resolveType(this.parent.typeDictionary, this.attrs.TypeName);
                                const field = {
                                    name: this.attrs.Name,
                                    fieldType: this.attrs.TypeName
                                };
                                const structuredType = this.parent.structuredType;
                                if (field.fieldType === "opc:Bit") {
                                    // do something to collect bits but ignore them as field
                                    structuredType.bitFields = structuredType.bitFields || [];
                                    const length = this.attrs.Length || 1;
                                    structuredType.bitFields.push({ name: field.name, length });
                                    return;
                                }
                                if (this.attrs.LengthField) {
                                    field.isArray = true;
                                    const n = structuredType.fields.length - 1;
                                    structuredType.fields[n] = field;
                                }
                                else {
                                    structuredType.fields.push(field);
                                }
                                if (this.attrs.SwitchField) {
                                    // field is optional and can be omitted
                                    const switchField = this.attrs.SwitchField;
                                    if (this.attrs.SwitchValue) {
                                        // we are in a union
                                        field.switchValue = parseInt(this.attrs.SwitchValue, 10);
                                        if (doDebug) {
                                            console.log("field", field.name, " is part of a union  => ", switchField, " value #", field.switchValue);
                                        }
                                    }
                                    else {
                                        field.switchBit = structuredType.bitFields ?
                                            structuredType.bitFields.findIndex((x) => x.name === switchField) : -2;
                                        if (doDebug) {
                                            console.log("field", field.name, " is optional => ", switchField, "bit #", field.switchBit);
                                        }
                                    }
                                }
                            }
                        }
                    },
                    finish: function () {
                        this.parent.typeDictionary.structuredTypesRaw[this.attrs.Name] = this.structuredType;
                    }
                }
            }
        }
    }
};
function parseBinaryXSD(xmlString, dataTypeFactories, callback) {
    const typeDictionary = new TypeDictionary(dataTypeFactories);
    const parser = new node_opcua_xml2json_1.Xml2Json(state0);
    parser.typeDictionary = typeDictionary;
    parser.parseString(xmlString, (err) => {
        // resolve and prepare enumerations
        for (const key in typeDictionary.enumeratedTypesRaw) {
            if (!typeDictionary.enumeratedTypesRaw.hasOwnProperty(key)) {
                continue;
            }
            const enumeratedType = typeDictionary.enumeratedTypesRaw[key];
            tools_1.prepareEnumeratedType(enumeratedType, typeDictionary);
        }
        // resolve complex types
        for (const key in typeDictionary.structuredTypesRaw) {
            if (!typeDictionary.structuredTypesRaw.hasOwnProperty(key)) {
                continue;
            }
            const structuredType = typeDictionary.structuredTypesRaw[key];
            if (structuredType.name !== key) {
                throw new Error("Invalid name");
            }
            tools_1.prepareStructureType(structuredType, typeDictionary);
        }
        callback(err, typeDictionary);
    });
}
exports.parseBinaryXSD = parseBinaryXSD;
//# sourceMappingURL=parse_binary_xsd.js.map