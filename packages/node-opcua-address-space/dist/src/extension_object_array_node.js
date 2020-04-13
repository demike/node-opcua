"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.Private
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const util = require("util");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
// import {     getEnumeration,getConstructor, hasConstructor } from "node-opcua-factory";
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_utils_1 = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const node_opcua_variant_3 = require("node-opcua-variant");
const node_opcua_extension_object_1 = require("node-opcua-extension-object");
const ua_variable_1 = require("./ua_variable");
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
function makeStructure(dataTypeFactory, dataType, bForce) {
    bForce = !!bForce;
    const addressSpace = dataType.addressSpace;
    // istanbul ignore next
    if (!dataType.binaryEncodingNodeId) {
        throw new Error("DataType with name " + dataType.browseName.toString() +
            " has no binaryEncoding node\nplease check your nodeset file");
    }
    // if binaryEncodingNodeId is in the standard factory => no need to overwrite
    if (!bForce && (dataTypeFactory.hasConstructor(dataType.binaryEncodingNodeId) || dataType.binaryEncodingNodeId.namespace === 0)) {
        return dataTypeFactory.getConstructor(dataType.binaryEncodingNodeId);
    }
    // istanbul ignore next
    if (doDebug) {
        debugLog("buildConstructorFromDefinition => ", dataType.browseName.toString());
    }
    // etc ..... please fix me
    const namespaceUri = addressSpace.getNamespaceUri(dataType.nodeId.namespace);
    return buildConstructorFromDefinition(addressSpace, dataType);
}
function _extensionobject_construct(options) {
    options = options || {};
    const dataType = this.constructor.dataType;
    const obj = this;
    for (const field of dataType.definition) {
        const fieldName = field.$$name$$;
        obj[fieldName] = field.$$initialize$$(options[fieldName]);
    }
}
global._extensionobject_construct = _extensionobject_construct;
function initialize_Structure(field, options) {
    return new field.$$Constructor$$(options);
}
function _extensionobject_encode(stream) {
    node_opcua_factory_1.BaseUAObject.prototype.encode.call(this, stream);
    const definition = this.constructor.dataType.definition;
    for (const field of definition) {
        const fieldName = field.$$name$$;
        field.$$func_encode$$.call(this[fieldName], stream);
    }
}
function struct_encode(stream) {
    this.encode(stream);
}
function struct_decode(stream) {
    this.decode(stream);
    return this;
}
function _extensionobject_decode(stream) {
    const definition = this.constructor.definition;
    node_opcua_assert_1.assert(definition, "expected a definition for this class ");
    for (const field of definition) {
        const fieldName = field.$$name$$;
        this[fieldName] = field.$$func_decode$$.call(this[fieldName], stream);
    }
}
function initialize_array(func, options) {
    options = options || [];
    const result = options.map((element) => func(element));
    return result;
}
function encode_array(fun_encode_element, arr, stream) {
    stream.writeUInt32(arr.length);
    for (const el of arr) {
        fun_encode_element(el, stream);
    }
}
function decode_array(fun_decode_element, arr, stream) {
    const n = stream.readUInt32();
    if (n === 0xFFFFFFFF) {
        return null;
    }
    const result = [];
    for (let i = 0; i < n; i++) {
        result.push(fun_decode_element(stream));
    }
    return result;
}
function buildConstructorFromDefinition(addressSpace, dataType) {
    if (doDebug) {
        debugLog("buildConstructorFromDefinition nodeId=", dataType.nodeId.toString(), dataType.browseName.toString());
    }
    const extraDataTypeManager = addressSpace.getDataTypeManager();
    const dataTypeFactory = extraDataTypeManager.getDataTypeFactory(dataType.nodeId.namespace);
    node_opcua_assert_1.assert(dataType.definition && _.isArray(dataType.definition));
    const enumeration = addressSpace.findDataType("Enumeration");
    const className = dataType.browseName.name.replace("DataType", "");
    node_opcua_assert_1.assert(enumeration, "Enumeration Type not found: please check your nodeset file");
    const structure = addressSpace.findDataType("Structure");
    node_opcua_assert_1.assert(structure, "Structure Type not found: please check your nodeset file");
    const Constructor = new Function("options", "_extensionobject_construct.apply(this,arguments);");
    node_opcua_assert_1.assert(_.isFunction(Constructor));
    Object.defineProperty(Constructor, "name", { value: className });
    Constructor.definition = dataType.definition;
    Constructor.dataType = dataType;
    util.inherits(Constructor, node_opcua_extension_object_1.ExtensionObject);
    Constructor.prototype.encode = _extensionobject_encode;
    Constructor.prototype.decode = _extensionobject_decode;
    for (const field of dataType.definition) {
        if (field.valueRank === 1) {
            field.$$name$$ = node_opcua_utils_1.lowerFirstLetter(field.name.replace("ListOf", ""));
        }
        else {
            field.$$name$$ = node_opcua_utils_1.lowerFirstLetter(field.name);
        }
        const dataTypeId = node_opcua_nodeid_1.resolveNodeId(field.dataType);
        const fieldDataType = addressSpace.findDataType(dataTypeId);
        if (!fieldDataType) {
            debugLog(field);
            throw new Error(" cannot find description for object " + dataTypeId +
                " => " + field.dataType + ". Check that this node exists in the nodeset.xml file");
        }
        // check if  dataType is an enumeration or a structure or  a basic type
        field.$$dataTypeId$$ = dataTypeId;
        field.$$dataType$$ = fieldDataType;
        field.$$isEnum$$ = false;
        field.$$isStructure$$ = false;
        if (fieldDataType.isSupertypeOf(enumeration)) {
            field.$$isEnum$$ = true;
            // todo repair
            // makeEnumeration(fieldDataType);
        }
        else if (fieldDataType.isSupertypeOf(structure)) {
            field.$$isStructure$$ = true;
            const FieldConstructor = makeStructure(dataTypeFactory, fieldDataType);
            node_opcua_assert_1.assert(_.isFunction(FieldConstructor));
            // xx field
            field.$$func_encode$$ = struct_encode;
            field.$$func_decode$$ = struct_decode;
            field.$$Constructor$$ = FieldConstructor;
            field.$$initialize$$ = initialize_Structure.bind(null, field);
        }
        else {
            const stuff = node_opcua_factory_1.findBuiltInType(fieldDataType.browseName.name);
            field.$$func_encode$$ = stuff.encode;
            field.$$func_decode$$ = stuff.decode;
            node_opcua_assert_1.assert(_.isFunction(field.$$func_encode$$));
            node_opcua_assert_1.assert(_.isFunction(field.$$func_decode$$));
            field.schema = stuff;
            field.$$initialize$$ = node_opcua_factory_1.initialize_field.bind(null, field);
        }
        if (field.valueRank === 1) {
            field.$$initialize$$ = initialize_array.bind(null, field.$$initialize$$);
            field.$$func_encode$$ = encode_array.bind(null, field.$$func_encode$$);
            field.$$func_decode$$ = decode_array.bind(null, field.$$func_decode$$);
        }
    }
    // reconstruct _schema form
    const fields = [];
    for (const field of dataType.definition) {
        const data = {
            fieldType: field.$$dataType$$.browseName.name,
            isArray: (field.valueRank === 1),
            name: field.$$name$$
        };
        if (field.$$isEnum$$) {
            data.category = node_opcua_factory_1.FieldCategory.enumeration;
        }
        else if (field.$$isStructure$$) {
            data.category = node_opcua_factory_1.FieldCategory.complex;
            data.fieldTypeConstructor = field.$$Constructor$$;
        }
        else {
            data.category = node_opcua_factory_1.FieldCategory.basic;
        }
        fields.push(data);
    }
    Constructor.prototype.schema = {
        fields,
        id: -1,
        name: className
    };
    return Constructor;
}
/*
 * define a complex Variable containing a array of extension objects
 * each element of the array is also accessible as a component variable.
 *
 */
function getExtObjArrayNodeValue() {
    return new node_opcua_variant_1.Variant({
        arrayType: node_opcua_variant_3.VariantArrayType.Array,
        dataType: node_opcua_variant_2.DataType.ExtensionObject,
        value: this.$$extensionObjectArray
    });
}
function removeElementByIndex(uaArrayVariableNode, elementIndex) {
    const _array = uaArrayVariableNode.$$extensionObjectArray;
    node_opcua_assert_1.assert(_.isNumber(elementIndex));
    const addressSpace = uaArrayVariableNode.addressSpace;
    const extObj = _array[elementIndex];
    const browseName = uaArrayVariableNode.$$getElementBrowseName(extObj);
    // remove element from global array (inefficient)
    uaArrayVariableNode.$$extensionObjectArray.splice(elementIndex, 1);
    // remove matching component
    const node = uaArrayVariableNode.getComponentByName(browseName);
    if (!node) {
        throw new Error(" cannot find component ");
    }
    const hasComponent = uaArrayVariableNode.addressSpace.findReferenceType("HasComponent");
    // remove the hasComponent reference toward node
    uaArrayVariableNode.removeReference({
        isForward: true,
        nodeId: node.nodeId,
        referenceType: hasComponent.nodeId
    });
    // now check if node has still some parent
    const parents = node.findReferencesEx("HasChild", node_opcua_data_model_1.BrowseDirection.Inverse);
    if (parents.length === 0) {
        addressSpace.deleteNode(node.nodeId);
    }
}
/**
 * @method prepareDataType
 * @private
 * @param dataType
 */
function prepareDataType(addressSpace, dataType) {
    if (!dataType._extensionObjectConstructor) {
        const extraDataTypeManager = addressSpace.getDataTypeManager();
        const dataTypeFactory = extraDataTypeManager.getDataTypeFactory(dataType.nodeId.namespace);
        if (doDebug) {
            debugLog("prepareDataType ", dataType.nodeId.toString(), dataType.browseName.toString());
        }
        dataType._extensionObjectConstructor = makeStructure(dataTypeFactory, dataType);
        if (!dataType._extensionObjectConstructor) {
            // tslint:disable:no-console
            console.warn("AddressSpace#constructExtensionObject : cannot make structure for " + dataType.toString());
        }
    }
}
exports.prepareDataType = prepareDataType;
/**
 *
 * create a node Variable that contains a array of ExtensionObject of a given type
 * @method createExtObjArrayNode
 * @param parentFolder
 * @param options
 * @param options.browseName
 * @param options.complexVariableType
 * @param options.variableType        the type of Extension objects stored in the array.
 * @param options.indexPropertyName
 * @return {Object|UAVariable}
 */
function createExtObjArrayNode(parentFolder, options) {
    node_opcua_assert_1.assert(typeof options.variableType === "string");
    node_opcua_assert_1.assert(typeof options.indexPropertyName === "string");
    const addressSpace = parentFolder.addressSpace;
    const namespace = parentFolder.namespace;
    const complexVariableType = addressSpace.findVariableType(options.complexVariableType);
    if (!complexVariableType) {
        throw new Error("cannot find complex variable type");
    }
    node_opcua_assert_1.assert(!complexVariableType.nodeId.isEmpty());
    const variableType = addressSpace.findVariableType(options.variableType);
    if (!variableType) {
        throw new Error("cannot find variable Type");
    }
    node_opcua_assert_1.assert(!variableType.nodeId.isEmpty());
    const structure = addressSpace.findDataType("Structure");
    node_opcua_assert_1.assert(structure, "Structure Type not found: please check your nodeset file");
    const dataType = addressSpace.findDataType(variableType.dataType);
    if (!dataType) {
        throw new Error("cannot find Data Type");
    }
    node_opcua_assert_1.assert(dataType.isSupertypeOf(structure), "expecting a structure (= ExtensionObject) here ");
    const inner_options = {
        componentOf: parentFolder,
        browseName: options.browseName,
        dataType: dataType.nodeId,
        typeDefinition: complexVariableType.nodeId,
        value: { dataType: node_opcua_variant_2.DataType.ExtensionObject, value: [], arrayType: node_opcua_variant_3.VariantArrayType.Array },
        valueRank: 1
    };
    const uaArrayVariableNode = namespace.addVariable(inner_options);
    bindExtObjArrayNode(uaArrayVariableNode, options.variableType, options.indexPropertyName);
    return uaArrayVariableNode;
}
exports.createExtObjArrayNode = createExtObjArrayNode;
/**
 * @method bindExtObjArrayNode
 * @param uaArrayVariableNode
 * @param variableTypeNodeId
 * @param indexPropertyName
 * @return
 */
function bindExtObjArrayNode(uaArrayVariableNode, variableTypeNodeId, indexPropertyName) {
    const addressSpace = uaArrayVariableNode.addressSpace;
    const variableType = addressSpace.findVariableType(variableTypeNodeId);
    if (!variableType) {
        throw new Error("Cannot find VariableType " + variableTypeNodeId.toString());
    }
    node_opcua_assert_1.assert(!variableType.nodeId.isEmpty());
    let structure = addressSpace.findDataType("Structure");
    node_opcua_assert_1.assert(structure, "Structure Type not found: please check your nodeset file");
    let dataType = addressSpace.findDataType(variableType.dataType);
    if (!dataType) {
        throw new Error("Cannot find DataType " + variableType.dataType.toString());
    }
    node_opcua_assert_1.assert(dataType.isSupertypeOf(structure), "expecting a structure (= ExtensionObject) here ");
    node_opcua_assert_1.assert(!uaArrayVariableNode.$$variableType, "uaArrayVariableNode has already been bound !");
    uaArrayVariableNode.$$variableType = variableType;
    structure = addressSpace.findDataType("Structure");
    node_opcua_assert_1.assert(structure, "Structure Type not found: please check your nodeset file");
    // verify that an object with same doesn't already exist
    dataType = addressSpace.findDataType(variableType.dataType);
    node_opcua_assert_1.assert(dataType.isSupertypeOf(structure), "expecting a structure (= ExtensionObject) here ");
    uaArrayVariableNode.$$dataType = dataType;
    uaArrayVariableNode.$$extensionObjectArray = [];
    uaArrayVariableNode.$$indexPropertyName = indexPropertyName;
    prepareDataType(addressSpace, dataType);
    uaArrayVariableNode.$$getElementBrowseName = function (extObj) {
        const indexPropertyName1 = this.$$indexPropertyName;
        if (!extObj.hasOwnProperty(indexPropertyName1)) {
            console.log(" extension object do not have ", indexPropertyName1, extObj);
        }
        // assert(extObj.constructor === addressSpace.constructExtensionObject(dataType));
        node_opcua_assert_1.assert(extObj.hasOwnProperty(indexPropertyName1));
        const browseName = extObj[indexPropertyName1].toString();
        return browseName;
    };
    const options = {
        get: getExtObjArrayNodeValue,
        set: undefined // readonly
    };
    // bind the readonly
    uaArrayVariableNode.bindVariable(options, true);
    return uaArrayVariableNode;
}
exports.bindExtObjArrayNode = bindExtObjArrayNode;
/**
 * @method addElement
 * add a new element in a ExtensionObject Array variable
 * @param options {Object}   data used to construct the underlying ExtensionObject
 * @param uaArrayVariableNode {UAVariable}
 * @return {UAVariable}
 *
 * @method addElement
 * add a new element in a ExtensionObject Array variable
 * @param nodeVariable a variable already exposing an extension objects
 * @param uaArrayVariableNode {UAVariable}
 * @return {UAVariable}
 *
 * @method addElement
 * add a new element in a ExtensionObject Array variable
 * @param constructor  constructor of the extension object to create
 * @param uaArrayVariableNode {UAVariable}
 * @return {UAVariable}
 */
function addElement(options /* ExtensionObjectConstructor | ExtensionObject | UAVariable*/, uaArrayVariableNode) {
    node_opcua_assert_1.assert(uaArrayVariableNode, " must provide an UAVariable containing the array");
    // verify that arr has been created correctly
    node_opcua_assert_1.assert(!!uaArrayVariableNode.$$variableType && !!uaArrayVariableNode.$$dataType, "did you create the array Node with createExtObjArrayNode ?");
    node_opcua_assert_1.assert(uaArrayVariableNode.$$dataType.nodeClass === node_opcua_data_model_1.NodeClass.DataType);
    node_opcua_assert_1.assert(uaArrayVariableNode.$$dataType._extensionObjectConstructor instanceof Function);
    const addressSpace = uaArrayVariableNode.addressSpace;
    let extensionObject;
    let elVar = null;
    let browseName;
    if (options instanceof ua_variable_1.UAVariable) {
        elVar = options;
        extensionObject = elVar.$extensionObject; // get shared extension object
        node_opcua_assert_1.assert(extensionObject instanceof uaArrayVariableNode.$$dataType._extensionObjectConstructor, "the provided variable must expose a Extension Object of the expected type ");
        // add a reference
        uaArrayVariableNode.addReference({
            isForward: true,
            nodeId: elVar.nodeId,
            referenceType: "HasComponent"
        });
        // xx elVar.bindExtensionObject();
    }
    else {
        if (options instanceof uaArrayVariableNode.$$dataType._extensionObjectConstructor) {
            // extension object has already been created
            extensionObject = options;
        }
        else {
            extensionObject = addressSpace.constructExtensionObject(uaArrayVariableNode.$$dataType, options);
        }
        browseName = uaArrayVariableNode.$$getElementBrowseName(extensionObject);
        elVar = uaArrayVariableNode.$$variableType.instantiate({
            browseName,
            componentOf: uaArrayVariableNode.nodeId,
            value: { dataType: node_opcua_variant_2.DataType.ExtensionObject, value: extensionObject }
        });
        elVar.bindExtensionObject();
        elVar.$extensionObject = extensionObject;
    }
    // also add the value inside
    uaArrayVariableNode.$$extensionObjectArray.push(extensionObject);
    return elVar;
}
exports.addElement = addElement;
/**
 *
 * @method removeElement
 * @param uaArrayVariableNode {UAVariable}
 * @param element {number}   index of element to remove in array
 *
 *
 * @method removeElement
 * @param uaArrayVariableNode {UAVariable}
 * @param element {UAVariable}   node of element to remove in array
 *
 * @method removeElement
 * @param uaArrayVariableNode {UAVariable}
 * @param element {ExtensionObject}   extension object of the node of element to remove in array
 *
 */
function removeElement(uaArrayVariableNode, element /* number | UAVariable | (a any) => boolean | ExtensionObject */) {
    node_opcua_assert_1.assert(element, "element must exist");
    const _array = uaArrayVariableNode.$$extensionObjectArray;
    if (_array.length === 0) {
        throw new Error(" cannot remove an element from an empty array ");
    }
    let elementIndex = -1;
    if (_.isNumber(element)) {
        // find element by index
        elementIndex = element;
        node_opcua_assert_1.assert(elementIndex >= 0 && elementIndex < _array.length);
    }
    else if (element && element.nodeClass) {
        // find element by name
        const browseNameToFind = element.browseName.name.toString();
        elementIndex = _array.findIndex((obj, i) => {
            const browseName = uaArrayVariableNode.$$getElementBrowseName(obj).toString();
            return (browseName === browseNameToFind);
        });
    }
    else if (_.isFunction(element)) {
        // find element by functor
        elementIndex = _array.findIndex(element);
    }
    else {
        // find element by inner extension object
        node_opcua_assert_1.assert(_array[0].constructor.name === element.constructor.name, "element must match");
        elementIndex = _array.findIndex((x) => x === element);
    }
    if (elementIndex < 0) {
        throw new Error(" cannot find element matching " + element.toString());
    }
    return removeElementByIndex(uaArrayVariableNode, elementIndex);
}
exports.removeElement = removeElement;
//# sourceMappingURL=extension_object_array_node.js.map