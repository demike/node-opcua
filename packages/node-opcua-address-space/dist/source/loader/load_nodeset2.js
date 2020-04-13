"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const async = require("async");
const fs = require("fs");
const _ = require("underscore");
const util_1 = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const ec = require("node-opcua-basic-types");
const node_opcua_client_dynamic_extension_object_1 = require("node-opcua-client-dynamic-extension-object");
const node_opcua_common_1 = require("node-opcua-common");
const node_opcua_data_access_1 = require("node-opcua-data-access");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_extension_object_1 = require("node-opcua-extension-object");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_service_call_1 = require("node-opcua-service-call");
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_xml2json_1 = require("node-opcua-xml2json");
const node_opcua_factory_1 = require("node-opcua-factory");
const source_1 = require("../../source");
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
function ensureDatatypeExtracted(addressSpace) {
    return __awaiter(this, void 0, void 0, function* () {
        const addressSpacePriv = addressSpace;
        if (!addressSpacePriv.$$extraDataTypeManager) {
            const session = new source_1.PseudoSession(addressSpace);
            const extraDataTypeManager = new node_opcua_client_dynamic_extension_object_1.ExtraDataTypeManager();
            extraDataTypeManager.setNamespaceArray(addressSpace.getNamespaceArray().map((n) => n.namespaceUri));
            yield node_opcua_client_dynamic_extension_object_1.extractNamespaceDataType(session, extraDataTypeManager);
            addressSpacePriv.$$extraDataTypeManager = extraDataTypeManager;
        }
        return addressSpacePriv.$$extraDataTypeManager;
    });
}
exports.ensureDatatypeExtracted = ensureDatatypeExtracted;
exports.ensureDatatypeExtractedWithCallback = util_1.callbackify(ensureDatatypeExtracted);
function findDataTypeNode(addressSpace, encodingNodeId) {
    const encodingNode = addressSpace.findNode(encodingNodeId);
    // istanbul ignore next
    if (!encodingNode) {
        throw new Error("findDataTypeNode:  Cannot find " + encodingNodeId.toString());
    }
    // xx console.log("encodingNode", encodingNode.toString());
    const refs = encodingNode.findReferences("HasEncoding", false);
    const dataTypes = refs
        .map((ref) => addressSpace.findNode(ref.nodeId))
        .filter((obj) => obj !== null);
    // istanbul ignore next
    if (dataTypes.length !== 1) {
        throw new Error("Internal Error");
    }
    const dataTypeNode = dataTypes[0];
    // istanbul ignore next
    if (dataTypeNode.nodeClass !== node_opcua_data_model_1.NodeClass.DataType) {
        throw new Error("internal error: expecting a UADataType node here");
    }
    return dataTypeNode;
}
function __make_back_references(namespace) {
    _.forEach(namespace._nodeid_index, (node) => {
        node.propagate_back_references();
    });
    _.forEach(namespace._nodeid_index, (node) => {
        node.install_extra_properties();
    });
}
/**
 * @method make_back_references
 * @param addressSpace  {AddressSpace}
 */
function make_back_references(addressSpace) {
    addressSpace.suspendBackReference = false;
    addressSpace.getNamespaceArray().map(__make_back_references);
}
function stringToUInt32Array(str) {
    const array = str ? str.split(",").map((value) => parseInt(value, 10)) : null;
    return array;
}
function convertAccessLevel(accessLevel) {
    const accessLevelN = parseInt(accessLevel || "1", 10); // CurrentRead if not specified
    return node_opcua_data_model_1.makeAccessLevelFlag(accessLevelN);
}
function generateAddressSpace(addressSpace, xmlFiles, callback) {
    const addressSpace1 = addressSpace;
    let postTasks = [];
    let alias_map = {};
    /**
     * @param aliasName
     */
    function addAlias(aliasName, nodeIdinXmlContext) {
        node_opcua_assert_1.assert(typeof nodeIdinXmlContext === "string");
        const nodeId = _translateNodeId(nodeIdinXmlContext);
        node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_1.NodeId);
        alias_map[aliasName] = nodeId;
        addressSpace1.getNamespace(nodeId.namespace).addAlias(aliasName, nodeId);
    }
    let namespace_uri_translation = {};
    let namespaceCounter = 0;
    let found_namespace_in_uri = {};
    function _reset_namespace_translation() {
        debugLog("_reset_namespace_translation");
        namespace_uri_translation = {};
        found_namespace_in_uri = {};
        namespaceCounter = 0;
        _register_namespace_uri("http://opcfoundation.org/UA/");
        alias_map = {};
    }
    function _translateNamespaceIndex(innerIndex) {
        const namespaceIndex = namespace_uri_translation[innerIndex];
        // istanbul ignore next
        if (namespaceIndex === undefined) {
            throw new Error("_translateNamespaceIndex! Cannot find namespace definition for index " + innerIndex);
        }
        return namespaceIndex;
    }
    function _internal_addReferenceType(params) {
        // istanbul ignore next
        if (!(params.nodeId instanceof node_opcua_nodeid_1.NodeId)) {
            throw new Error("invalid param");
        } // already translated
        const namespace = addressSpace1.getNamespace(params.nodeId.namespace);
        namespace.addReferenceType(params);
    }
    function _internal_createNode(params) {
        // istanbul ignore next
        if (!(params.nodeId instanceof node_opcua_nodeid_1.NodeId)) {
            throw new Error("invalid param");
        } // already translated
        const namespace = addressSpace1.getNamespace(params.nodeId.namespace);
        return namespace._createNode(params);
    }
    function _register_namespace_uri(namespaceUri) {
        if (found_namespace_in_uri[namespaceUri]) {
            return found_namespace_in_uri[namespaceUri];
        }
        const namespace = addressSpace1.registerNamespace(namespaceUri);
        found_namespace_in_uri[namespaceUri] = namespace;
        const index_in_xml = namespaceCounter;
        namespaceCounter++;
        namespace_uri_translation[index_in_xml] = namespace.index;
        debugLog(" _register_namespace_uri = ", namespaceUri, "index in Xml=", index_in_xml, " index in addressSpace", namespace.index);
        return namespace;
    }
    function _register_namespace_uri_model(model) {
        const namespace = _register_namespace_uri(model.modelUri);
        namespace.version = model.version;
        namespace.publicationDate = model.publicationDate;
        return namespace;
    }
    /**
     * convert a nodedId
     *
     * @method convertToNodeId
     * @param nodeId {String|null}
     * @return {NodeId}
     *
     * @example
     *    convertToNodeId("String") => resolve alias
     *    convertToNodeId("i=58")   => resolve to nodeId in namespace 0
     *    convertToNodeId("ns=1;i=100") => convert namespace from xml namespace
     *                                      table to corresponding namespace in addressSpace
     */
    const reg = /ns=([0-9]+);(.*)/;
    function _translateNodeId(nodeId) {
        if (alias_map[nodeId]) {
            return alias_map[nodeId];
        }
        const m = nodeId.match(reg);
        if (m) {
            const namespaceIndex = _translateNamespaceIndex(parseInt(m[1], 10));
            nodeId = "ns=" + namespaceIndex + ";" + m[2];
        }
        return node_opcua_nodeid_1.resolveNodeId(nodeId);
    }
    function _translateReferenceType(refType) {
        return _translateNodeId(refType);
    }
    function convertToNodeId(nodeIdLike) {
        // treat alias
        if (!nodeIdLike) {
            return null;
        }
        const nodeId = _translateNodeId(nodeIdLike);
        return addressSpace1.resolveNodeId(nodeId);
    }
    function convertQualifiedName(qualifiedName) {
        const qn = node_opcua_data_model_1.stringToQualifiedName(qualifiedName);
        // Xx if (qn.namespaceIndex > 0) {
        qn.namespaceIndex = _translateNamespaceIndex(qn.namespaceIndex);
        // Xx }
        return qn;
    }
    node_opcua_assert_1.assert(_.isFunction(callback)); // expecting a callback
    const state_Alias = {
        finish() {
            addAlias(this.attrs.Alias, this.text);
        }
    };
    const references_parser = {
        init() {
            this.parent.obj.references = [];
            this.array = this.parent.obj.references;
        },
        parser: {
            Reference: {
                finish() {
                    this.parent.array.push({
                        isForward: (this.attrs.IsForward === undefined)
                            ? true
                            : (this.attrs.IsForward === "false" ? false : true),
                        nodeId: convertToNodeId(this.text),
                        referenceType: _translateReferenceType(this.attrs.ReferenceType)
                    });
                }
            }
        }
    };
    // <Definition Name="SomeName">
    //   <Field Name="Running" Value="0" dataType: [ValueRank="1"]>
    //      [<Description>text</Description>]
    //   <Field>
    // </Definition>
    //
    // Or
    //
    //  (IsOptionSet)
    //
    //
    const definition_parser = {
        init(name, attrs) {
            this.parent.obj.definition = [];
            this.parent.obj.definition_name = attrs.Name;
            this.array = this.parent.obj.definition;
        },
        parser: {
            Field: {
                init() {
                    this.description = undefined;
                },
                parser: {
                    Description: {
                        finish() {
                            this.parent.description = this.text;
                        }
                    }
                },
                finish() {
                    this.parent.array.push({
                        dataType: convertToNodeId(this.attrs.DataType),
                        description: this.description,
                        name: this.attrs.Name,
                        value: this.attrs.Value,
                        valueRank: parseInt(this.attrs.ValueRank || "-1", 10)
                    });
                }
            }
        }
    };
    const state_UAObject = {
        init(name, attrs) {
            this.obj = {};
            this.obj.nodeClass = node_opcua_data_model_1.NodeClass.Object;
            this.obj.isAbstract = ec.coerceBoolean(attrs.IsAbstract);
            this.obj.nodeId = convertToNodeId(attrs.NodeId) || null;
            this.obj.browseName = convertQualifiedName(attrs.BrowseName);
            this.obj.eventNotifier = ec.coerceByte(attrs.EventNotifier) || 0;
            this.obj.symbolicName = attrs.SymbolicName || null;
        },
        finish() {
            _internal_createNode(this.obj);
        },
        parser: {
            DisplayName: {
                finish() {
                    this.parent.obj.displayName = this.text;
                }
            },
            Description: {
                finish() {
                    this.parent.obj.description = this.text;
                }
            },
            References: references_parser
        }
    };
    const state_UAObjectType = {
        init(name, attrs) {
            this.obj = {};
            this.obj.nodeClass = node_opcua_data_model_1.NodeClass.ObjectType;
            this.obj.isAbstract = ec.coerceBoolean(attrs.IsAbstract);
            this.obj.nodeId = convertToNodeId(attrs.NodeId) || null;
            this.obj.browseName = convertQualifiedName(attrs.BrowseName);
            this.obj.eventNotifier = ec.coerceByte(attrs.EventNotifier) || 0;
        },
        finish() {
            _internal_createNode(this.obj);
        },
        parser: {
            DisplayName: {
                finish() {
                    this.parent.obj.displayName = this.text;
                }
            },
            Description: {
                finish() {
                    this.parent.obj.description = this.text;
                }
            },
            References: references_parser
        }
    };
    const state_UAReferenceType = {
        init(name, attrs) {
            this.obj = {};
            this.obj.nodeClass = node_opcua_data_model_1.NodeClass.ReferenceType;
            this.obj.isAbstract = ec.coerceBoolean(attrs.IsAbstract);
            this.obj.nodeId = convertToNodeId(attrs.NodeId) || null;
            this.obj.browseName = convertQualifiedName(attrs.BrowseName);
        },
        finish() {
            _internal_addReferenceType(this.obj);
        },
        parser: {
            DisplayName: {
                finish() {
                    this.parent.obj.displayName = this.text;
                }
            },
            Description: {
                finish() {
                    this.parent.obj.description = this.text;
                }
            },
            InverseName: {
                finish() {
                    this.parent.obj.inverseName = this.text;
                }
            },
            References: references_parser
        }
    };
    const state_UADataType = {
        init(name, attrs) {
            this.obj = {};
            this.obj.nodeClass = node_opcua_data_model_1.NodeClass.DataType;
            this.obj.isAbstract = ec.coerceBoolean(attrs.IsAbstract);
            this.obj.nodeId = convertToNodeId(attrs.NodeId) || null;
            this.obj.browseName = convertQualifiedName(attrs.BrowseName);
            this.obj.displayName = "";
            this.obj.description = "";
        },
        finish() {
            const dataTypeNode = _internal_createNode(this.obj);
            node_opcua_assert_1.assert(addressSpace1.findNode(this.obj.nodeId));
            if (this.obj.nodeId.namespace !== 0) {
                const processBasicDataType = (addressSpace2) => __awaiter(this, void 0, void 0, function* () {
                    const enumeration = addressSpace2.findDataType("Enumeration");
                    const structure = addressSpace2.findDataType("Structure");
                    // we have a data type from a companion specification
                    // let's see if this data type need to be registered
                    if (!dataTypeNode.isSupertypeOf(enumeration) && !dataTypeNode.isSupertypeOf(structure)) {
                        const baseType = dataTypeNode.subtypeOfObj;
                        if (baseType) {
                            // this is a basic type
                            const typeName = dataTypeNode.browseName.name; // .replace("DataType","");
                            /* istanbul ignore next */
                            if (doDebug) {
                                debugLog(`registerBasicType({ name: "${typeName}", subType: "${baseType.browseName.name}" });`);
                            }
                            node_opcua_factory_1.registerBasicType({
                                name: typeName,
                                subType: baseType.browseName.name
                            });
                        }
                    }
                });
                postTasks.push(processBasicDataType);
            }
        },
        parser: {
            DisplayName: {
                finish() {
                    this.parent.obj.displayName = this.text;
                }
            },
            Description: {
                finish() {
                    this.parent.obj.description = this.text;
                }
            },
            References: references_parser,
            Definition: definition_parser
        }
    };
    const localizedText_parser = {
        LocalizedText: {
            init() {
                this.localizedText = {};
            },
            parser: {
                Locale: {
                    finish() {
                        this.parent.localizedText.locale = this.text.trim();
                    }
                },
                Text: {
                    finish() {
                        this.parent.localizedText.text = this.text.trim();
                    }
                }
            }
        }
    };
    const enumValueType_parser = {
        EnumValueType: {
            init() {
                this.enumValueType = new node_opcua_common_1.EnumValueType({
                    description: undefined,
                    displayName: undefined,
                    value: [0, 0] // Int64
                });
            },
            parser: {
                Value: {
                    finish() {
                        // Low part
                        this.parent.enumValueType.value[1] = parseInt(this.text, 10);
                    }
                },
                DisplayName: _.extend(_.clone(localizedText_parser.LocalizedText), {
                    finish() {
                        this.parent.enumValueType.displayName = _.clone(this.localizedText);
                    }
                }),
                Description: _.extend(_.clone(localizedText_parser.LocalizedText), {
                    finish() {
                        this.parent.enumValueType.description = _.clone(this.localizedText);
                    }
                })
            },
            finish() {
                this.enumValueType = new node_opcua_common_1.EnumValueType(this.enumValueType);
            }
        }
    };
    const argument_parser = {
        Argument: {
            init() {
                this.argument = new node_opcua_service_call_1.Argument({});
            },
            parser: {
                Name: {
                    finish() {
                        this.parent.argument.name = this.text.trim();
                    }
                },
                DataType: {
                    parser: {
                        Identifier: {
                            finish() {
                                this.parent.parent.argument.dataType = _translateNodeId(node_opcua_nodeid_1.resolveNodeId(this.text.trim()).toString());
                            }
                        }
                    }
                },
                ValueRank: {
                    finish() {
                        this.parent.argument.valueRank = parseInt(this.text.trim(), 10);
                    }
                },
                ArrayDimensions: {
                    finish() {
                        // xx  this.parent.argument.arrayDimensions =[];
                    }
                },
                Description: {
                    init() {
                        this._text = "";
                        this.locale = null;
                        this.text = null;
                    },
                    parser: {
                        Locale: {
                            init() {
                                this.text = "";
                            },
                            finish() {
                                this.parent.locale = this.text.trim();
                            }
                        },
                        Text: {
                            finish() {
                                this.text = this.text || "";
                                this.parent._text = this.text.trim();
                            }
                        }
                    },
                    finish() {
                        this.parent.argument.description = node_opcua_data_model_1.coerceLocalizedText(this._text);
                    }
                }
            },
            finish() {
                // xx this.argument = new Argument(this.argument);
            }
        }
    };
    const Range_parser = {
        Range: {
            init() {
                this.range = new node_opcua_types_1.Range({});
            },
            parser: {
                Low: {
                    finish() {
                        this.parent.range.low = parseFloat(this.text);
                    }
                },
                High: {
                    finish() {
                        this.parent.range.high = parseFloat(this.text);
                    }
                }
            }
        }
    };
    const EUInformation_parser = {
        EUInformation: {
            init() {
                this.euInformation = new node_opcua_data_access_1.EUInformation({});
            },
            parser: {
                NamespaceUri: {
                    finish() {
                        this.parent.euInformation.namespaceUri = this.text;
                    }
                },
                UnitId: {
                    finish() {
                        this.parent.euInformation.unitId = parseInt(this.text, 10);
                    }
                },
                DisplayName: _.extend(_.clone(localizedText_parser.LocalizedText), {
                    finish() {
                        this.parent.euInformation.displayName = _.clone(this.localizedText);
                    }
                }),
                Description: _.extend(_.clone(localizedText_parser.LocalizedText), {
                    finish() {
                        this.parent.euInformation.description = _.clone(this.localizedText);
                    }
                })
            },
            finish() {
                this.euInformation = new node_opcua_data_access_1.EUInformation(this.euInformation);
            }
        }
    };
    const _extensionObject_inner_parser = {
        TypeId: {
            parser: {
                Identifier: {
                    finish() {
                        const typeDefinitionId = this.text.trim();
                        const self = this.parent.parent; // ExtensionObject
                        self.typeDefinitionId = node_opcua_nodeid_1.resolveNodeId(typeDefinitionId);
                    }
                }
            }
        },
        Body: {
            parser: {
                Argument: argument_parser.Argument,
                EUInformation: EUInformation_parser.EUInformation,
                EnumValueType: enumValueType_parser.EnumValueType,
                Range: Range_parser.Range
            },
            startElement(elementName, attrs) {
                const self = this.parent; // ExtensionObject
                self.extensionObject = null;
                self.extensionObjectPojo = null;
                if (!this.parser.hasOwnProperty(elementName)) {
                    // treat it as a pojo
                    this.startPojo(elementName, attrs, (name, pojo) => {
                        self.extensionObjectPojo = pojo;
                        // istanbul ignore next
                        if (doDebug) {
                            debugLog("Found a pojo !!!!", elementName, name, pojo);
                        }
                    });
                }
            },
            finish() {
                const self = this.parent; // ExtensionObject
                switch (self.typeDefinitionId.toString()) {
                    case "i=7616": // EnumValueType
                    case "ns=0;i=7616": // EnumValueType
                        self.extensionObject = self.parser.Body.parser.EnumValueType.enumValueType;
                        node_opcua_assert_1.assert(_.isObject(self.extensionObject));
                        node_opcua_assert_1.assert(self.extensionObject instanceof node_opcua_extension_object_1.ExtensionObject);
                        break;
                    case "i=297": // Arguments
                    case "ns=0;i=297": // Arguments
                        self.extensionObject = self.parser.Body.parser.Argument.argument;
                        node_opcua_assert_1.assert(_.isObject(self.extensionObject));
                        node_opcua_assert_1.assert(self.extensionObject instanceof node_opcua_extension_object_1.ExtensionObject);
                        break;
                    case "i=888":
                    case "ns=0;i=888": // EUInformation
                        self.extensionObject = self.parser.Body.parser.EUInformation.euInformation;
                        node_opcua_assert_1.assert(_.isObject(self.extensionObject));
                        node_opcua_assert_1.assert(self.extensionObject instanceof node_opcua_extension_object_1.ExtensionObject);
                        break;
                    case "i=885": // Range
                    case "ns=0;i=885":
                        self.extensionObject = self.parser.Body.parser.Range.range;
                        node_opcua_assert_1.assert(_.isObject(self.extensionObject));
                        node_opcua_assert_1.assert(self.extensionObject instanceof node_opcua_extension_object_1.ExtensionObject);
                        break;
                    default: {
                        // this is a user defined Extension Object
                        debugLog("loadnodeset2: unsupported typeDefinitionId in ExtensionObject Default XML = " + self.typeDefinitionId.toString());
                        const typeDefinitionId = _translateNodeId(self.typeDefinitionId.toString()); // the "Default Binary" nodeId
                        const pojo = self.extensionObjectPojo;
                        const postTaskData = self.postTaskData;
                        const task = (addressSpace2) => __awaiter(this, void 0, void 0, function* () {
                            yield ensureDatatypeExtracted(addressSpace);
                            const dataTypeNode = findDataTypeNode(addressSpace2, typeDefinitionId);
                            // istanbul ignore next
                            if (!dataTypeNode) {
                                debugLog(" cannot find ", typeDefinitionId.toString());
                                return;
                            }
                            // at this time the bsd file containing object definition
                            // must have been found and object can be constructed
                            const userDefinedExtensionObject = addressSpace2.constructExtensionObject(dataTypeNode, pojo);
                            if (doDebug) {
                                debugLog("userDefinedExtensionObject", userDefinedExtensionObject.toString());
                            }
                            //
                            if (postTaskData) {
                                postTaskData.postponedExtensionObject = userDefinedExtensionObject;
                            }
                        });
                        postTasks.push(task);
                        self.extensionObjectPojo = null;
                        node_opcua_assert_1.assert(!self.extensionObject || self.extensionObject instanceof node_opcua_extension_object_1.ExtensionObject);
                        break;
                    }
                }
            }
        }
    };
    const extensionObject_parser = {
        ExtensionObject: {
            init() {
                this.typeDefinitionId = "";
                this.extensionObject = null;
                this.extensionObjectPojo = null;
            },
            parser: _extensionObject_inner_parser,
            finish() {
                /* empty */
            }
        }
    };
    function BasicType_parser(dataType, parseFunc) {
        const _parser = {};
        const r = {
            init(name, attrs) {
                this.value = 0;
            },
            finish() {
                this.value = parseFunc.call(this, this.text);
            }
        };
        _parser[dataType] = r;
        return _parser;
    }
    function ListOf(dataType, parseFunc) {
        return {
            init() {
                this.listData = [];
            },
            parser: BasicType_parser(dataType, parseFunc),
            finish() {
                this.parent.parent.obj.value = {
                    arrayType: node_opcua_variant_1.VariantArrayType.Array,
                    dataType: node_opcua_variant_1.DataType[dataType],
                    value: this.listData
                };
            },
            endElement(element) {
                this.listData.push(this.parser[dataType].value);
            }
        };
    }
    const state_Variant = {
        init: () => { },
        parser: {
            LocalizedText: _.extend(_.clone(localizedText_parser.LocalizedText), {
                finish() {
                    this.parent.parent.obj.value = {
                        dataType: node_opcua_variant_1.DataType.LocalizedText,
                        value: this.localizedText
                    };
                }
            }),
            String: {
                finish() {
                    this.parent.parent.obj.value = {
                        dataType: node_opcua_variant_1.DataType.String,
                        value: this.text
                    };
                }
            },
            Boolean: {
                finish() {
                    this.parent.parent.obj.value = {
                        dataType: node_opcua_variant_1.DataType.Boolean,
                        value: this.text.toLowerCase() === "true" ? true : false
                    };
                }
            },
            ByteString: {
                init() {
                    this.value = null;
                },
                finish() {
                    const base64text = this.text;
                    const byteString = Buffer.from(base64text, "base64");
                    this.parent.parent.obj.value = {
                        arrayType: node_opcua_variant_1.VariantArrayType.Scalar,
                        dataType: node_opcua_variant_1.DataType.ByteString,
                        value: byteString
                    };
                }
            },
            Float: {
                finish() {
                    this.parent.parent.obj.value = {
                        dataType: node_opcua_variant_1.DataType.Float,
                        value: parseFloat(this.text)
                    };
                }
            },
            Double: {
                finish() {
                    this.parent.parent.obj.value = {
                        dataType: node_opcua_variant_1.DataType.Double,
                        value: parseFloat(this.text)
                    };
                }
            },
            ListOfExtensionObject: {
                init() {
                    this.listData = [];
                },
                parser: extensionObject_parser,
                finish() {
                    this.parent.parent.obj.value = {
                        arrayType: node_opcua_variant_1.VariantArrayType.Array,
                        dataType: node_opcua_variant_1.DataType.ExtensionObject,
                        value: this.listData
                    };
                },
                startElement(elementName) {
                    /* empty */
                },
                endElement(elementName) {
                    this.listData.push(this.parser.ExtensionObject.extensionObject);
                    if (this.parser.ExtensionObject.extensionObject) {
                        // assert(element === "ExtensionObject");
                        // istanbul ignore next
                        if (!(this.parser.ExtensionObject.extensionObject instanceof node_opcua_extension_object_1.ExtensionObject)) {
                            throw new Error("expecting an extension object");
                        }
                    }
                }
            },
            ListOfLocalizedText: {
                init() {
                    this.listData = [];
                },
                parser: localizedText_parser,
                finish() {
                    this.parent.parent.obj.value = {
                        arrayType: node_opcua_variant_1.VariantArrayType.Array,
                        dataType: node_opcua_variant_1.DataType.LocalizedText,
                        value: this.listData
                    };
                },
                endElement() {
                    this.listData.push(this.parser.LocalizedText.localizedText);
                }
            },
            ListOfDouble: ListOf("Double", parseFloat),
            ListOfFloat: ListOf("Float", parseFloat),
            ListOfInt32: ListOf("Int32", parseInt),
            ListOfInt16: ListOf("Int16", parseInt),
            ListOfInt8: ListOf("Int8", parseInt),
            ListOfUint32: ListOf("Uint32", parseInt),
            ListOfUint16: ListOf("Uint16", parseInt),
            ListOfUint8: ListOf("Uint8", parseInt),
            ListOfString: ListOf("String", (value) => value),
            ExtensionObject: {
                init() {
                    this.typeDefinitionId = {};
                    this.extensionObject = null;
                    this.postTaskData = {};
                },
                parser: _extensionObject_inner_parser,
                finish() {
                    // istanbul ignore next
                    if (this.extensionObject && !(this.extensionObject instanceof node_opcua_extension_object_1.ExtensionObject)) {
                        throw new Error("expecting an extension object");
                    }
                    this.parent.parent.obj.value = {
                        dataType: node_opcua_variant_1.DataType.ExtensionObject,
                        value: this.extensionObject
                    };
                    // let's create the mechanism that postpone the creation of the
                    // extension object
                    const data = this.postTaskData;
                    data.variant = this.parent.parent.obj.value;
                    if (!data.variant) {
                        data.nodeId = this.parent.parent.obj.nodeId;
                        this.postTaskData = null;
                        const task = (addressSpace2) => __awaiter(this, void 0, void 0, function* () {
                            data.variant.value = data.postponedExtensionObject;
                            node_opcua_assert_1.assert(data.nodeId, "expecting a nodeid");
                            const node = addressSpace.findNode(data.nodeId);
                            if (node.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
                                const v = node;
                                v.setValueFromSource(data.variant);
                            }
                            if (node.nodeClass === node_opcua_data_model_1.NodeClass.VariableType) {
                                const v = node;
                                v.value.value = data.variant.value;
                            }
                        });
                        postTasks.push(task);
                    }
                }
            }
        }
    };
    const state_UAVariable = {
        init(name, attrs) {
            this.obj = {};
            this.obj.nodeClass = node_opcua_data_model_1.NodeClass.Variable;
            this.obj.browseName = convertQualifiedName(attrs.BrowseName);
            this.obj.parentNodeId = convertToNodeId(attrs.ParentNodeId);
            this.obj.dataType = convertToNodeId(attrs.DataType);
            this.obj.valueRank = ec.coerceInt32(attrs.ValueRank) || -1;
            this.obj.arrayDimensions = this.obj.valueRank === -1 ? null : stringToUInt32Array(attrs.ArrayDimensions);
            this.obj.minimumSamplingInterval =
                attrs.MinimumSamplingInterval ? parseInt(attrs.MinimumSamplingInterval, 10) : 0;
            this.obj.minimumSamplingInterval = parseInt(this.obj.minimumSamplingInterval, 10);
            this.obj.historizing = false;
            this.obj.nodeId = convertToNodeId(attrs.NodeId) || null;
            this.obj.accessLevel = convertAccessLevel(attrs.AccessLevel);
            this.obj.userAccessLevel = convertAccessLevel(attrs.UserAccessLevel);
        },
        finish() {
            const variable = _internal_createNode(this.obj);
        },
        parser: {
            DisplayName: {
                finish() {
                    this.parent.obj.displayName = this.text;
                }
            },
            Description: {
                finish() {
                    this.parent.obj.description = this.text;
                }
            },
            References: references_parser,
            Value: state_Variant
        }
    };
    const state_UAVariableType = {
        init(name, attrs) {
            this.obj = {};
            this.obj.isAbstract = ec.coerceBoolean(attrs.IsAbstract);
            this.obj.nodeClass = node_opcua_data_model_1.NodeClass.VariableType;
            this.obj.browseName = convertQualifiedName(attrs.BrowseName);
            this.obj.parentNodeId = attrs.ParentNodeId || null;
            this.obj.dataType = convertToNodeId(attrs.DataType) || null;
            this.obj.valueRank = ec.coerceInt32(attrs.ValueRank) || -1;
            this.obj.arrayDimensions = this.obj.valueRank === -1 ? null : stringToUInt32Array(attrs.ArrayDimensions);
            this.obj.minimumSamplingInterval =
                attrs.MinimumSamplingInterval ? parseInt(attrs.MinimumSamplingInterval, 10) : 0;
            this.obj.historizing = false;
            this.obj.nodeId = convertToNodeId(attrs.NodeId) || null;
        },
        finish() {
            try {
                _internal_createNode(this.obj);
            } /* istanbul ignore next */
            catch (err) {
                this.obj.addressSpace = null;
                // tslint:disable:no-console
                console.warn(" Cannot create object", JSON.stringify(this.obj, null, " "));
                throw err;
            }
        },
        parser: {
            DisplayName: {
                finish() {
                    this.parent.obj.displayName = this.text;
                }
            },
            Description: {
                finish() {
                    this.parent.obj.description = this.text;
                }
            },
            References: references_parser,
            Value: state_Variant
        }
    };
    const state_UAMethod = {
        init(name, attrs) {
            this.obj = {};
            this.obj.nodeClass = node_opcua_data_model_1.NodeClass.Method;
            // MethodDeclarationId
            // ParentNodeId
            this.obj.browseName = convertQualifiedName(attrs.BrowseName);
            this.obj.parentNodeId = attrs.ParentNodeId || null;
            this.obj.nodeId = convertToNodeId(attrs.NodeId) || null;
            this.obj.methodDeclarationId = attrs.MethodDeclarationId ? node_opcua_nodeid_1.resolveNodeId(attrs.MethodDeclarationId) : null;
        },
        finish() {
            _internal_createNode(this.obj);
        },
        parser: {
            DisplayName: {
                finish() {
                    this.parent.obj.displayName = this.text;
                }
            },
            References: references_parser
        }
    };
    const state_ModelTableEntry = new node_opcua_xml2json_1.ReaderState({
        init() {
            this._requiredModels = [];
        },
        parser: {
        // xx  "RequiredModel":  null
        },
        finish() {
            const modelUri = this.attrs.ModelUri; // //"http://opcfoundation.org/UA/"
            const version = this.attrs.Version; // 1.04
            const publicationDate = this.attrs.PublicationDate; // "2018-05-15T00:00:00Z" "
            // optional,
            const symbolicName = this.attrs.SymbolicName;
            const accessRestrictions = this.attrs.AccessRestrictions;
            const namespace = _register_namespace_uri_model({
                accessRestrictions,
                modelUri,
                publicationDate,
                requiredModels: this._requiredModels,
                symbolicName,
                version
            });
            this._requiredModels.push(namespace);
        }
    });
    // state_ModelTableEntry.parser["RequiredModel"] = state_ModelTableEntry;
    const state_0 = {
        parser: {
            Aliases: { parser: { Alias: state_Alias } },
            NamespaceUris: {
                init() {
                    //
                },
                parser: {
                    Uri: {
                        finish() {
                            _register_namespace_uri(this.text);
                        }
                    }
                }
            },
            Models: {
                init() {
                    //
                },
                parser: {
                    Model: state_ModelTableEntry
                },
                finish() {
                    //
                }
            },
            UADataType: state_UADataType,
            UAMethod: state_UAMethod,
            UAObject: state_UAObject,
            UAObjectType: state_UAObjectType,
            UAReferenceType: state_UAReferenceType,
            UAVariable: state_UAVariable,
            UAVariableType: state_UAVariableType
        }
    };
    if (!_.isArray(xmlFiles)) {
        xmlFiles = [xmlFiles];
    }
    const parser = new node_opcua_xml2json_1.Xml2Json(state_0);
    addressSpace1.suspendBackReference = true;
    async.mapSeries(xmlFiles, (xmlFile, callback1) => {
        // istanbul ignore next
        if (!fs.existsSync(xmlFile)) {
            throw new Error("generateAddressSpace : cannot file nodeset2 xml file at " + xmlFile);
        }
        debugLog(" parsing ", xmlFile);
        _reset_namespace_translation();
        parser.parse(xmlFile, callback1);
    }, (err) => {
        make_back_references(addressSpace1);
        // perform post task
        debugLog("Performing post loading tasks");
        function performPostLoadingTasks(tasks) {
            return __awaiter(this, void 0, void 0, function* () {
                for (const task of tasks) {
                    try {
                        yield task(addressSpace1);
                    }
                    catch (err) {
                        // istanbul ignore next
                        // tslint:disable:no-console
                        console.log(" Err  => ", err.message, "\n", err);
                    }
                }
            });
        }
        util_1.callbackify(performPostLoadingTasks)(postTasks, () => {
            postTasks = [];
            debugLog("Post loading task done");
            node_opcua_assert_1.assert(!addressSpace1.suspendBackReference);
            exports.ensureDatatypeExtractedWithCallback(addressSpace, () => {
                callback(err || undefined);
            });
        });
    });
}
exports.generateAddressSpace = generateAddressSpace;
// tslint:disable:no-var-requires
// tslint:disable:max-line-length
const thenify = require("thenify");
module.exports.generateAddressSpace = thenify.withCallback(module.exports.generateAddressSpace);
//# sourceMappingURL=load_nodeset2.js.map