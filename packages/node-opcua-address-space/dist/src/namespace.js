"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_access_1 = require("node-opcua-data-access");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_model_3 = require("node-opcua-data-model");
const node_opcua_data_model_4 = require("node-opcua-data-model");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_nodeid_2 = require("node-opcua-nodeid");
const node_opcua_nodeid_3 = require("node-opcua-nodeid");
const node_opcua_nodeid_4 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_types_1 = require("node-opcua-types");
const utils = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const coerce_enum_value_1 = require("../source/helpers/coerce_enum_value");
const address_space_change_event_tools_1 = require("./address_space_change_event_tools");
const ua_acknowledgeable_condition_base_1 = require("./alarms_and_conditions/ua_acknowledgeable_condition_base");
const ua_alarm_condition_base_1 = require("./alarms_and_conditions/ua_alarm_condition_base");
const ua_condition_base_1 = require("./alarms_and_conditions/ua_condition_base");
const ua_discrete_alarm_1 = require("./alarms_and_conditions/ua_discrete_alarm");
const ua_exclusive_deviation_alarm_1 = require("./alarms_and_conditions/ua_exclusive_deviation_alarm");
const ua_exclusive_limit_alarm_1 = require("./alarms_and_conditions/ua_exclusive_limit_alarm");
const ua_limit_alarm_1 = require("./alarms_and_conditions/ua_limit_alarm");
const ua_non_exclusive_deviation_alarm_1 = require("./alarms_and_conditions/ua_non_exclusive_deviation_alarm");
const ua_non_exclusive_limit_alarm_1 = require("./alarms_and_conditions/ua_non_exclusive_limit_alarm");
const ua_off_normal_alarm_1 = require("./alarms_and_conditions/ua_off_normal_alarm");
const base_node_1 = require("./base_node");
const ua_data_item_1 = require("./data_access/ua_data_item");
const ua_multistate_discrete_1 = require("./data_access/ua_multistate_discrete");
const ua_mutlistate_value_discrete_1 = require("./data_access/ua_mutlistate_value_discrete");
const namespace_private_1 = require("./namespace_private");
const ua_data_type_1 = require("./ua_data_type");
const ua_method_1 = require("./ua_method");
const ua_object_1 = require("./ua_object");
const ua_object_type_1 = require("./ua_object_type");
const ua_reference_type_1 = require("./ua_reference_type");
const ua_two_state_variable_1 = require("./ua_two_state_variable");
const ua_variable_1 = require("./ua_variable");
const ua_variable_type_1 = require("./ua_variable_type");
const ua_view_1 = require("./ua_view");
const doDebug = false;
const regExp1 = /^(s|i|b|g)=/;
const regExpNamespaceDotBrowseName = /^[0-9]+:(.*)/;
const hasPropertyRefId = node_opcua_nodeid_3.resolveNodeId("HasProperty");
const hasComponentRefId = node_opcua_nodeid_3.resolveNodeId("HasComponent");
exports.NamespaceOptions = {
    nodeIdNameSeparator: "-"
};
/**
 *
 * @constructor
 * @params options {Object}
 * @params options.namespaceUri {string}
 * @params options.addressSpace {AddressSpace}
 * @params options.index {number}
 * @params options.version="" {string}
 * @params options.publicationDate="" {Date}
 *
 */
class UANamespace {
    constructor(options) {
        this.version = 0;
        this.publicationDate = new Date(1900, 0, 1);
        node_opcua_assert_1.assert(typeof options.namespaceUri === "string");
        node_opcua_assert_1.assert(typeof options.index === "number");
        this.namespaceUri = options.namespaceUri;
        this.addressSpace = options.addressSpace;
        if (!this.addressSpace) {
            throw new Error("Must specify a valid address space");
        }
        this.index = options.index;
        this._nodeid_index = {};
        this._internal_id_counter = 1000;
        this._aliases = {};
        this._objectTypeMap = {};
        this._variableTypeMap = {};
        this._referenceTypeMap = {};
        this._referenceTypeMapInv = {};
        this._dataTypeMap = {};
    }
    getDefaultNamespace() {
        return (this.index === 0)
            ? this
            : this.addressSpace.getDefaultNamespace();
    }
    dispose() {
        _.forEach(this._nodeid_index, (node) => {
            node.dispose();
        });
        this._nodeid_index = {};
        this.addressSpace = {};
        this._aliases = {};
        this._objectTypeMap = {};
        this._variableTypeMap = {};
        this._referenceTypeMap = {};
        this._referenceTypeMapInv = {};
        this._dataTypeMap = {};
    }
    findNode(nodeId) {
        if (typeof nodeId === "string") {
            if (nodeId.match(regExp1)) {
                nodeId = "ns=" + this.index + ";" + nodeId;
            }
        }
        nodeId = node_opcua_nodeid_3.resolveNodeId(nodeId);
        node_opcua_assert_1.assert(nodeId.namespace === this.index);
        return this._nodeid_index[nodeId.toString()];
    }
    /**
     *
     * @param objectTypeName {String}
     * @return {UAObjectType|null}
     */
    findObjectType(objectTypeName) {
        node_opcua_assert_1.assert(typeof objectTypeName === "string");
        const objectType = this._objectTypeMap[objectTypeName];
        return objectType ? objectType : null;
    }
    /**
     *
     * @param variableTypeName {String}
     * @returns {UAVariableType|null}
     */
    findVariableType(variableTypeName) {
        node_opcua_assert_1.assert(typeof variableTypeName === "string");
        const variableType = this._variableTypeMap[variableTypeName];
        return variableType ? variableType : null;
    }
    /**
     *
     * @param dataTypeName {String}
     * @returns {UADataType|null}
     */
    findDataType(dataTypeName) {
        node_opcua_assert_1.assert(typeof dataTypeName === "string");
        node_opcua_assert_1.assert(this._dataTypeMap, "internal error : _dataTypeMap is missing");
        const dataType = this._dataTypeMap[dataTypeName];
        return dataType ? dataType : null;
    }
    /**
     *
     * @param referenceTypeName {String}
     * @returns  {ReferenceType|null}
     */
    findReferenceType(referenceTypeName) {
        node_opcua_assert_1.assert(typeof referenceTypeName === "string");
        const referenceType = this._referenceTypeMap[referenceTypeName];
        return referenceType ? referenceType : null;
    }
    /**
     * find a ReferenceType by its inverse name.
     * @method findReferenceTypeFromInverseName
     * @param inverseName {String} the inverse name of the ReferenceType to find
     * @return {ReferenceType}
     */
    findReferenceTypeFromInverseName(inverseName) {
        node_opcua_assert_1.assert(typeof inverseName === "string");
        const node = this._referenceTypeMapInv[inverseName];
        node_opcua_assert_1.assert(!node || (node.nodeClass === node_opcua_data_model_4.NodeClass.ReferenceType && node.inverseName.text === inverseName));
        return node ? node : null;
    }
    /**
     *
     * @method addAlias
     * @param alias_name {String} the alias name
     * @param nodeId {NodeId} NodeId must belong to this namespace
     */
    addAlias(alias_name, nodeId) {
        node_opcua_assert_1.assert(typeof alias_name === "string");
        node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_4.NodeId);
        node_opcua_assert_1.assert(nodeId.namespace === this.index);
        this._aliases[alias_name] = nodeId;
    }
    resolveAlias(name) {
        return this._aliases[name] || null;
    }
    /**
     * add a new Object type to the address space
     * @method addObjectType
     * @param options
     * @param options.browseName {String} the object type name
     * @param [options.displayName] {String|LocalizedText} the display name
     * @param [options.subtypeOf="BaseObjectType"] {String|NodeId|BaseNode} the base class
     * @param [options.nodeId] {String|NodeId} an optional nodeId for this objectType,
     *                                         if not provided a new nodeId will be created
     * @param [options.isAbstract = false] {Boolean}
     * @param [options.eventNotifier = 0] {Integer}
     * @param [options.postInstantiateFunc = null] {Function}
     *
     */
    addObjectType(options) {
        node_opcua_assert_1.assert(!options.hasOwnProperty("dataType"), "an objectType should not have a dataType");
        node_opcua_assert_1.assert(!options.hasOwnProperty("valueRank"), "an objectType should not have a valueRank");
        node_opcua_assert_1.assert(!options.hasOwnProperty("arrayDimensions"), "an objectType should not have a arrayDimensions");
        return this._addObjectOrVariableType(options, "BaseObjectType", node_opcua_data_model_4.NodeClass.ObjectType);
    }
    /**
     * add a new Variable type to the address space
     * @method addVariableType
     * @param options
     * @param options.browseName {String} the object type name
     * @param [options.displayName] {String|LocalizedText} the display name
     * @param [options.subtypeOf="BaseVariableType"] {String|NodeId|BaseNode} the base class
     * @param [options.nodeId] {String|NodeId} an optional nodeId for this objectType,
     *                                             if not provided a new nodeId will be created
     * @param [options.isAbstract = false] {Boolean}
     * @param options.dataType {String|NodeId} the variable DataType
     * @param [options.valueRank = -1]
     * @param [options.arrayDimensions = null] { Array<Int>>
     *
     */
    addVariableType(options) {
        node_opcua_assert_1.assert(!options.hasOwnProperty("arrayDimension"), "Do you mean ArrayDimensions ?");
        // dataType
        options.dataType = options.dataType || "Int32";
        options.dataType = this.addressSpace._coerce_DataType(options.dataType);
        // valueRank
        options.valueRank = utils.isNullOrUndefined(options.valueRank) ? -1 : options.valueRank;
        node_opcua_assert_1.assert(_.isFinite(options.valueRank));
        node_opcua_assert_1.assert(typeof options.valueRank === "number");
        // arrayDimensions
        options.arrayDimensions = options.arrayDimensions || [];
        node_opcua_assert_1.assert(_.isArray(options.arrayDimensions) || options.arrayDimensions === null);
        const variableType = this._addObjectOrVariableType(options, "BaseVariableType", node_opcua_data_model_4.NodeClass.VariableType);
        variableType.dataType = options.dataType;
        variableType.valueRank = options.valueRank || 0;
        variableType.arrayDimensions = options.arrayDimensions;
        return variableType;
    }
    /**
     * add a variable as a component of the parent node
     *
     * @method addVariable
     * @param options
     * @param options.browseName       the variable name
     * @param options.dataType        the variable datatype ( "Double", "UInt8" etc...)
     * @param [options.typeDefinition="BaseDataVariableType"]
     * @param [options.modellingRule=null] the Modelling rule : "Optional" , "Mandatory"
     * @param [options.valueRank= -1]    the valueRank
     * @param [options.arrayDimensions]
     * @return UAVariable
     */
    addVariable(options) {
        node_opcua_assert_1.assert(arguments.length === 1, "Invalid arguments AddressSpace#addVariable now takes only one argument.");
        if (options.hasOwnProperty("propertyOf") && options.propertyOf) {
            node_opcua_assert_1.assert(!options.typeDefinition || options.typeDefinition === "PropertyType");
            options.typeDefinition = options.typeDefinition || "PropertyType";
        }
        else {
            node_opcua_assert_1.assert(!options.typeDefinition || options.typeDefinition !== "PropertyType");
        }
        return this._addVariable(options);
    }
    addView(options) {
        node_opcua_assert_1.assert(arguments.length === 1, "Namespace#addView expecting a single argument");
        node_opcua_assert_1.assert(options);
        node_opcua_assert_1.assert(options.hasOwnProperty("browseName"));
        node_opcua_assert_1.assert(options.hasOwnProperty("organizedBy"));
        const browseName = options.browseName;
        node_opcua_assert_1.assert(typeof browseName === "string");
        const addressSpace = this.addressSpace;
        const baseDataVariableTypeId = addressSpace.findVariableType("BaseDataVariableType").nodeId;
        // ------------------------------------------ TypeDefinition
        const typeDefinition = options.typeDefinition || baseDataVariableTypeId;
        options.references = options.references || [];
        options.references.push({
            isForward: true,
            nodeId: typeDefinition,
            referenceType: "HasTypeDefinition"
        });
        // xx assert(this.FolderTypeId && this.BaseObjectTypeId); // is default address space generated.?
        const createOptions = options;
        node_opcua_assert_1.assert(!createOptions.nodeClass);
        createOptions.nodeClass = node_opcua_data_model_4.NodeClass.View;
        const view = this.createNode(createOptions);
        node_opcua_assert_1.assert(view.nodeId instanceof node_opcua_nodeid_4.NodeId);
        node_opcua_assert_1.assert(view.nodeClass === node_opcua_data_model_4.NodeClass.View);
        return view;
    }
    addObject(options1) {
        const options = options1;
        node_opcua_assert_1.assert(!options.nodeClass || options.nodeClass === node_opcua_data_model_4.NodeClass.Object);
        options.nodeClass = node_opcua_data_model_4.NodeClass.Object;
        const typeDefinition = options.typeDefinition || "BaseObjectType";
        options.references = options.references || [];
        options.references.push({ referenceType: "HasTypeDefinition", isForward: true, nodeId: typeDefinition });
        options.eventNotifier = +options.eventNotifier;
        const obj = this.createNode(options);
        node_opcua_assert_1.assert(obj instanceof ua_object_1.UAObject);
        node_opcua_assert_1.assert(obj.nodeClass === node_opcua_data_model_4.NodeClass.Object);
        return obj;
    }
    /**
     *
     * @method addFolder
     * @param parentFolder
     * @param options {String|Object}
     * @param options.browseName {String} the name of the folder
     * @param [options.nodeId] {NodeId}. An optional nodeId for this object
     *
     * @return {BaseNode}
     */
    addFolder(parentFolder, options) {
        if (typeof options === "string") {
            options = { browseName: options };
        }
        const addressSpace = this.addressSpace;
        node_opcua_assert_1.assert(!options.typeDefinition, "addFolder does not expect typeDefinition to be defined ");
        const typeDefinition = addressSpace._coerceTypeDefinition("FolderType");
        parentFolder = addressSpace._coerceFolder(parentFolder);
        options.nodeClass = node_opcua_data_model_4.NodeClass.Object;
        options.references = [
            { referenceType: "HasTypeDefinition", isForward: true, nodeId: typeDefinition },
            { referenceType: "Organizes", isForward: false, nodeId: parentFolder.nodeId }
        ];
        const node = this.createNode(options);
        return node;
    }
    /**
     * @method addReferenceType
     * @param options
     * @param options.isAbstract
     * @param options.browseName
     * @param options.inverseName
     */
    addReferenceType(options) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        const options1 = options;
        options1.nodeClass = node_opcua_data_model_4.NodeClass.ReferenceType;
        options1.references = options1.references || [];
        if (options.subtypeOf) {
            const subtypeOfNodeId = addressSpace._coerceType(options.subtypeOf, "References", node_opcua_data_model_4.NodeClass.ReferenceType);
            node_opcua_assert_1.assert(subtypeOfNodeId);
            // tslint:disable:no-console
            console.log(chalk_1.default.cyan(subtypeOfNodeId.toString()));
            options1.references.push({
                isForward: false,
                nodeId: subtypeOfNodeId,
                referenceType: "HasSubtype"
            });
        }
        const node = namespace._createNode(options1);
        node.propagate_back_references();
        return node;
    }
    /**
     */
    addMultiStateDiscrete(options) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        node_opcua_assert_1.assert(options.hasOwnProperty("enumStrings"));
        node_opcua_assert_1.assert(!options.hasOwnProperty("ValuePrecision"));
        const multiStateDiscreteType = addressSpace.findVariableType("MultiStateDiscreteType");
        if (!multiStateDiscreteType) {
            throw new Error("Cannot find MultiStateDiscreteType");
        }
        // todo : if options.typeDefinition is specified, check that type is SubTypeOf MultiStateDiscreteType
        options.value = (options.value === undefined) ? 0 : options.value;
        const variable = namespace.addVariable(_.extend(options, {
            dataType: "UInteger",
            typeDefinition: multiStateDiscreteType.nodeId,
            value: new node_opcua_variant_1.Variant({
                dataType: node_opcua_variant_1.DataType.UInt32,
                value: options.value
            }),
            valueRank: -2
        }));
        Object.setPrototypeOf(variable, ua_multistate_discrete_1.UAMultiStateDiscrete.prototype);
        ua_data_item_1.add_dataItem_stuff(variable, options);
        const enumStrings = options.enumStrings.map((value) => {
            return node_opcua_data_model_1.coerceLocalizedText(value);
        });
        const enumStringsNode = namespace.addVariable({
            accessLevel: "CurrentRead",
            browseName: { name: "EnumStrings", namespaceIndex: 0 },
            dataType: "LocalizedText",
            minimumSamplingInterval: 0,
            modellingRule: options.modellingRule ? "Mandatory" : undefined,
            propertyOf: variable,
            typeDefinition: "PropertyType",
            userAccessLevel: "CurrentRead",
            value: new node_opcua_variant_1.Variant({
                arrayType: node_opcua_variant_1.VariantArrayType.Array,
                dataType: node_opcua_variant_1.DataType.LocalizedText,
                value: enumStrings
            })
        });
        const handler = variable.handle_semantic_changed.bind(variable);
        enumStringsNode.on("value_changed", handler);
        variable.install_extra_properties();
        node_opcua_assert_1.assert(variable.enumStrings.browseName.toString() === "EnumStrings");
        return variable;
    }
    /**
     * @method createDataType
     * @param options
     * @param options.isAbstract
     * @param options.browseName {BrowseName}
     * @param options.superType {NodeId}
     * @param [options.nodeId]
     * @param [options.displayName]
     * @param [options.description]
     *
     */
    createDataType(options) {
        node_opcua_assert_1.assert(options.hasOwnProperty("isAbstract"));
        node_opcua_assert_1.assert(!options.hasOwnProperty("nodeClass"));
        node_opcua_assert_1.assert(options.hasOwnProperty("browseName"), "must provide a browseName");
        const options1 = options;
        options1.nodeClass = node_opcua_data_model_4.NodeClass.DataType;
        options1.references = options.references || [];
        if (options1.references.length === 0) {
            if (!options1.superType) {
                throw new Error("must provide a superType");
            }
            options1.superType = this.addressSpace.findDataType(options1.superType);
            if (!options1.superType) {
                throw new Error("cannot find superType");
            }
            options1.references.push({
                isForward: false,
                nodeId: options1.superType.nodeId,
                referenceType: "HasSubtype"
            });
        }
        const node = this._createNode(options);
        return node;
    }
    /**
     * @method createNode
     * @param options
     * @param options.nodeClass
     * @param [options.nodeVersion {String} = "0" ] install nodeVersion
     * @param [options.modellingRule {String} = null]
     * @internal
     */
    createNode(options) {
        let node = null;
        const addressSpace = this.addressSpace;
        addressSpace.modelChangeTransaction(() => {
            node_opcua_assert_1.assert(isNonEmptyQualifiedName(options.browseName));
            // xx assert(options.hasOwnProperty("browseName") && options.browseName.length > 0);
            node_opcua_assert_1.assert(options.hasOwnProperty("nodeClass"));
            options.references = addressSpace.normalizeReferenceTypes(options.references);
            const references = _copy_references(options.references);
            _handle_hierarchy_parent(addressSpace, references, options);
            _handle_event_hierarchy_parent(addressSpace, references, options);
            namespace_private_1.UANamespace_process_modelling_rule(references, options.modellingRule);
            options.references = references;
            node = this._createNode(options);
            node_opcua_assert_1.assert(node.nodeId instanceof node_opcua_nodeid_4.NodeId);
            node.propagate_back_references();
            node.install_extra_properties();
            _handle_node_version(node, options);
            address_space_change_event_tools_1._handle_model_change_event(node);
        });
        return node;
    }
    /**
     * remove the specified Node from the address space
     *
     * @method deleteNode
     * @param  nodeOrNodeId
     *
     *
     */
    deleteNode(nodeOrNodeId) {
        let node = null;
        let nodeId = node_opcua_nodeid_4.NodeId.nullNodeId;
        if (nodeOrNodeId instanceof node_opcua_nodeid_4.NodeId) {
            nodeId = nodeOrNodeId;
            node = this.findNode(nodeId);
            // istanbul ignore next
            if (!node) {
                throw new Error(" deleteNode : cannot find node with nodeId" + nodeId.toString());
            }
        }
        else if (nodeOrNodeId instanceof base_node_1.BaseNode) {
            node = nodeOrNodeId;
            nodeId = node.nodeId;
        }
        if (nodeId.namespace !== this.index) {
            throw new Error("this node doesn't belong to this namespace");
        }
        const addressSpace = this.addressSpace;
        addressSpace.modelChangeTransaction(() => {
            if (!node) {
                throw new Error("this node doesn't belong to this namespace");
            }
            // notify parent that node is being removed
            const hierarchicalReferences = node.findReferencesEx("HierarchicalReferences", node_opcua_data_model_3.BrowseDirection.Inverse);
            for (const ref of hierarchicalReferences) {
                const parent = addressSpace.findNode(ref.nodeId);
                node_opcua_assert_1.assert(parent);
                parent._on_child_removed(node);
            }
            function deleteNodePointedByReference(ref) {
                const o = addressSpace.findNode(ref.nodeId);
                addressSpace.deleteNode(o.nodeId);
            }
            // recursively delete all nodes below in the hierarchy of nodes
            // TODO : a better idea would be to extract any references of type "HasChild"
            const components = node.findReferences("HasComponent", true);
            const properties = node.findReferences("HasProperty", true);
            // TODO: shall we delete nodes pointed by "Organizes" links here ?
            const subfolders = node.findReferences("Organizes", true);
            const rf = [].concat(components, properties, subfolders);
            rf.forEach(deleteNodePointedByReference);
            address_space_change_event_tools_1._handle_delete_node_model_change_event(node);
            node.unpropagate_back_references();
            // delete nodes from global index
            const namespace = addressSpace.getNamespace(node.nodeId.namespace);
            node_opcua_assert_1.assert(namespace === this);
            namespace._deleteNode(node);
        });
    }
    /**
     * @internals
     */
    getStandardsNodeIds() {
        const standardNodeIds = {
            objectTypeIds: {},
            referenceTypeIds: {},
        };
        for (const referenceType of _.values(this._referenceTypeMap)) {
            standardNodeIds.referenceTypeIds[referenceType.browseName.name] = referenceType.nodeId.toString();
        }
        for (const objectType of _.values(this._objectTypeMap)) {
            standardNodeIds.objectTypeIds[objectType.browseName.name] = objectType.nodeId.toString();
        }
        return standardNodeIds;
    }
    // - Events --------------------------------------------------------------------------------------
    /**
     * add a new event type to the address space
     * @method addEventType
     * @param options
     * @param options.browseName {String} the eventType name
     * @param [options.subtypeOf ="BaseEventType"]
     * @param [options.isAbstract = true]
     * @return {UAObjectType} : the object type
     *
     * @example
     *
     *      var evtType = namespace.addEventType({
     *          browseName: "MyAuditEventType",
     *          subtypeOf:  "AuditEventType"
     *      });
     *      var myConditionType = namespace.addEventType({
     *          browseName: "MyConditionType",
     *          subtypeOf:  "ConditionType",
     *          isAbstract: false
     *      });
     *
     */
    addEventType(options) {
        options.subtypeOf = options.subtypeOf || "BaseEventType";
        // are eventType always abstract ?? No => Condition can be instantiated!
        // but, by default is abstract is true
        options.isAbstract = options.hasOwnProperty("isAbstract") ? !!options.isAbstract : true;
        return this.addObjectType(options);
    }
    // ---------------------------------------------------------------------------------------------------
    /**
     * @method addDataItem
     * @param options
     * @param options.browseName {String}
     * @param options.definition {String}
     * @param [options.valuePrecision {Double |null} =null]
     * @param options.dataType {NodeId} // todo :check
     * @param options.value
     * @param options.componentOf
     * @return {UAVariable}
     */
    addDataItem(options) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        const dataType = options.dataType || "Number";
        const dataItemType = addressSpace.findVariableType("DataItemType");
        if (!dataItemType) {
            throw new Error("Cannot find DataItemType");
        }
        const variable = namespace.addVariable(_.extend(options, {
            dataType,
            typeDefinition: dataItemType.nodeId
        }));
        ua_data_item_1.add_dataItem_stuff(variable, options);
        variable.install_extra_properties();
        return variable;
    }
    /**
     *
     * @method addAnalogDataItem
     *
     * AnalogDataItem DataItems that represent continuously-variable physical quantities ( e.g., length, temperature),
     * incontrast to the digital representation of data in discrete  items
     * NOTE Typical examples are the values provided by temperature sensors or pressure sensors. OPC UA defines a
     * specific UAVariableType to identify an AnalogItem. Properties describe the possible ranges of  AnalogItems.
     *
     *
     * @example:
     *
     *
     *   namespace.add_analog_dataItem({
     *      componentOf: parentObject,
     *      browseName: "TemperatureSensor",
     *
     *      definition: "(tempA -25) + tempB",
     *      valuePrecision: 0.5,
     *      //-
     *      instrumentRange: { low: 100 , high: 200}, // optional
     *      engineeringUnitsRange: { low: 100 , high: 200}, // mandatory
     *      engineeringUnits: standardUnits.degree_celsius,, // optional
     *
     *      // access level
     *      accessLevel: 1
     *      minimumSamplingInterval: 10,
     *
     *   });
     *
     * @param options
     * @param options.browseName {String}
     * @param options.definition {String}
     * @param [options.valuePrecision {Double |null} =null]
     * @param options.instrumentRange
     * @param options.instrumentRange.low {Double}
     * @param options.instrumentRange.high {Double}
     * @param options.engineeringUnitsRange.low {Double}
     * @param options.engineeringUnitsRange.high {Double}
     * @param options.engineeringUnits {String}
     * @param options.dataType {NodeId} // todo :check
     * @param [options.accessLevel {AccessLevelFlag} = "CurrentRead | CurrentWrite"]
     * @param [options.userAccessLevel {AccessLevelFlag} = "CurrentRead | CurrentWrite"]
     * @param options.value
     * @param [options.modellingRule]
     * @return {UAVariable}
     */
    addAnalogDataItem(options) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        node_opcua_assert_1.assert(options.hasOwnProperty("engineeringUnitsRange"), "expecting engineeringUnitsRange");
        const dataType = options.dataType || "Number";
        const analogItemType = addressSpace.findVariableType("AnalogItemType");
        if (!analogItemType) {
            throw new Error("expecting AnalogItemType to be defined , check nodeset xml file");
        }
        let clone_options = _.clone(options);
        clone_options = _.extend(clone_options, {
            dataType,
            typeDefinition: analogItemType.nodeId
        });
        const variable = namespace.addVariable(clone_options);
        // var variable = namespace.addVariable({
        //    componentOf:     options.componentOf,
        //    organizedBy:     options.organizedBy,
        //    browseName:      options.browseName,
        //    nodeId:          options.nodeId,
        //    value:           options.value,
        //    accessLevel:     options.accessLevel,
        //    userAccessLevel: options.userAccessLevel,
        //    modellingRule:   options.modellingRule
        //
        //    typeDefinition: analogItemType.nodeId,
        //    dataType:       dataType,
        // });
        ua_data_item_1.add_dataItem_stuff(variable, options);
        // mandatory (EURange in the specs)
        // OPC Unified Architecture, Part 8  6  Release 1.02
        // EURange  defines the value range likely to be obtained in normal operation. It is intended for such
        // use as automatically scaling a bar graph display
        // Sensor or instrument failure or deactivation can result in a return ed item value which is actually
        // outside  of  this range. Client software must be prepared to deal with this   possibility. Similarly a client
        // may attempt to write a value that is outside  of  this range back to the server. The exact behaviour
        // (accept, reject, clamp, etc.) in this case is server - dependent. However ,   in general servers  shall  be
        // prepared to handle this.
        //     Example:    EURange ::= {-200.0,1400.0}
        const euRange = namespace.addVariable({
            browseName: { name: "EURange", namespaceIndex: 0 },
            dataType: "Range",
            minimumSamplingInterval: 0,
            modellingRule: options.modellingRule,
            propertyOf: variable,
            typeDefinition: "PropertyType",
            value: new node_opcua_variant_1.Variant({
                dataType: node_opcua_variant_1.DataType.ExtensionObject, value: new node_opcua_types_1.Range(options.engineeringUnitsRange)
            })
        });
        const handler = variable.handle_semantic_changed.bind(variable);
        euRange.on("value_changed", handler);
        if (options.hasOwnProperty("instrumentRange")) {
            const instrumentRange = namespace.addVariable({
                accessLevel: "CurrentRead | CurrentWrite",
                browseName: { name: "InstrumentRange", namespaceIndex: 0 },
                dataType: "Range",
                minimumSamplingInterval: 0,
                modellingRule: options.modellingRule ? "Mandatory" : undefined,
                propertyOf: variable,
                typeDefinition: "PropertyType",
                value: new node_opcua_variant_1.Variant({
                    dataType: node_opcua_variant_1.DataType.ExtensionObject, value: new node_opcua_types_1.Range(options.instrumentRange)
                })
            });
            instrumentRange.on("value_changed", handler);
        }
        if (options.hasOwnProperty("engineeringUnits")) {
            const engineeringUnits = new node_opcua_types_1.EUInformation(options.engineeringUnits);
            node_opcua_assert_1.assert(engineeringUnits instanceof node_opcua_types_1.EUInformation, "expecting engineering units");
            // EngineeringUnits  specifies the units for the   DataItem‟s value (e.g., DEGC, hertz, seconds).   The
            // EUInformation   type is specified in   5.6.3.
            const eu = namespace.addVariable({
                accessLevel: "CurrentRead",
                browseName: { name: "EngineeringUnits", namespaceIndex: 0 },
                dataType: "EUInformation",
                minimumSamplingInterval: 0,
                modellingRule: options.modellingRule ? "Mandatory" : undefined,
                propertyOf: variable,
                typeDefinition: "PropertyType",
                value: new node_opcua_variant_1.Variant({
                    dataType: node_opcua_variant_1.DataType.ExtensionObject, value: engineeringUnits
                })
            });
            eu.on("value_changed", handler);
        }
        variable.install_extra_properties();
        return variable;
    }
    /**
     *
     * @method addMultiStateValueDiscrete
     * @param options {Object}
     * @param options.browseName {String}
     * @param [options.nodeId  {NodeId}]
     * @param [options.value {UInt32} = 0 }
     * @param options.enumValues { EnumValueType[]| {Key,Value} }
     * @return {Object|UAVariable}
     *
     * @example
     *
     *
     *      namespace.addMultiStateValueDiscrete({
     *          componentOf:parentObj,
     *          browseName: "myVar",
     *          enumValues: {
     *              "Red":    0xFF0000,
     *              "Green":  0x00FF00,
     *              "Blue":   0x0000FF
     *          }
     *      });
     *      addMultiStateValueDiscrete(parentObj,{
     *          browseName: "myVar",
     *          enumValues: [
     *              {
     *                 value: 0xFF0000,
     *                 displayName: "Red",
     *                 description: " The color Red"
     *              },
     *              {
     *                 value: 0x00FF000,
     *                 displayName: "Green",
     *                 description: " The color Green"
     *              },
     *              {
     *                 value: 0x0000FF,
     *                 displayName: "Blue",
     *                 description: " The color Blue"
     *              }
     *
     *          ]
     *      });
     */
    addMultiStateValueDiscrete(options) {
        node_opcua_assert_1.assert(options.hasOwnProperty("enumValues"));
        node_opcua_assert_1.assert(!options.hasOwnProperty("ValuePrecision"));
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        const multiStateValueDiscreteType = addressSpace.findVariableType("MultiStateValueDiscreteType");
        if (!multiStateValueDiscreteType) {
            throw new Error("expecting MultiStateValueDiscreteType to be defined , check nodeset xml file");
        }
        // todo : if options.typeDefinition is specified, check that type is SubTypeOf MultiStateDiscreteType
        // EnumValueType
        //   value: Int64, displayName: LocalizedText, Description: LocalizedText
        const enumValues = coerce_enum_value_1.coerceEnumValues(options.enumValues);
        if (options.value === undefined && enumValues[0]) {
            options.value = enumValues[0].value; // Int64
        }
        let cloned_options = _.clone(options);
        cloned_options = _.extend(cloned_options, {
            dataType: "Number",
            typeDefinition: multiStateValueDiscreteType.nodeId,
            // valueRank:
            // note : OPCUA Spec 1.03 specifies -1:Scalar (part 8 page 8) but nodeset file specifies -2:Any
            value: new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.UInt32, value: options.value }),
            valueRank: -1 // -1 : Scalar
        });
        const variable = namespace.addVariable(cloned_options);
        ua_data_item_1.add_dataItem_stuff(variable, options);
        namespace.addVariable({
            accessLevel: "CurrentRead",
            browseName: { name: "EnumValues", namespaceIndex: 0 },
            dataType: "EnumValueType",
            minimumSamplingInterval: 0,
            modellingRule: options.modellingRule ? "Mandatory" : undefined,
            propertyOf: variable,
            typeDefinition: "PropertyType",
            userAccessLevel: "CurrentRead",
            value: new node_opcua_variant_1.Variant({
                arrayType: node_opcua_variant_1.VariantArrayType.Array,
                dataType: node_opcua_variant_1.DataType.ExtensionObject,
                value: enumValues
            })
        });
        namespace.addVariable({
            accessLevel: "CurrentRead",
            browseName: { name: "ValueAsText", namespaceIndex: 0 },
            dataType: "LocalizedText",
            minimumSamplingInterval: 0,
            modellingRule: options.modellingRule ? "Mandatory" : undefined,
            propertyOf: variable,
            typeDefinition: "PropertyType",
            userAccessLevel: "CurrentRead",
        });
        // install additional helpers methods
        variable.install_extra_properties();
        ua_mutlistate_value_discrete_1.promoteToMultiStateValueDiscrete(variable);
        node_opcua_assert_1.assert(variable.enumValues.browseName.toString() === "EnumValues");
        node_opcua_assert_1.assert(variable.valueAsText.browseName.toString() === "ValueAsText");
        return variable;
    }
    // -
    /**
     *
     * @method addYArrayItem
     * @param options
     * @param options.componentOf {NodeId}
     * @param options.browseName {String}
     * @param options.title {String}
     * @param [options.instrumentRange]
     * @param [options.instrumentRange.low] {Double}
     * @param [options.instrumentRange.high] {Double}
     * @param options.engineeringUnitsRange.low {Double}
     * @param options.engineeringUnitsRange.high {Double}
     * @param options.engineeringUnits {String}
     * @param [options.nodeId = {NodeId}]
     * @param options.accessLevel
     * @param options.userAccessLevel
     * @param options.title {String}
     * @param options.axisScaleType {AxisScaleEnumeration}
     *
     * @param options.xAxisDefinition {AxisInformation}
     * @param options.xAxisDefinition.engineeringUnits  EURange
     * @param options.xAxisDefinition.range
     * @param options.xAxisDefinition.range.low
     * @param options.xAxisDefinition.range.high
     * @param options.xAxisDefinition.title  {LocalizedText}
     * @param options.xAxisDefinition.axisScaleType {AxisScaleEnumeration}
     * @param options.xAxisDefinition.axisSteps = <null>  {Array<Double>}
     * @param options.value
     */
    addYArrayItem(options) {
        node_opcua_assert_1.assert(options.hasOwnProperty("engineeringUnitsRange"), "expecting engineeringUnitsRange");
        node_opcua_assert_1.assert(options.hasOwnProperty("axisScaleType"), "expecting axisScaleType");
        node_opcua_assert_1.assert(_.isObject(options.xAxisDefinition), "expecting a xAxisDefinition");
        const addressSpace = this.addressSpace;
        const YArrayItemType = addressSpace.findVariableType("YArrayItemType");
        if (!YArrayItemType) {
            throw new Error("expecting YArrayItemType to be defined , check nodeset xml file");
        }
        const dataType = options.dataType || "Float";
        const optionals = [];
        if (options.hasOwnProperty("instrumentRange")) {
            optionals.push("InstrumentRange");
        }
        const variable = YArrayItemType.instantiate({
            browseName: options.browseName,
            componentOf: options.componentOf,
            dataType,
            optionals
        });
        function coerceAxisScale(value) {
            const ret = node_opcua_data_access_1.AxisScaleEnumeration[value];
            node_opcua_assert_1.assert(!utils.isNullOrUndefined(ret));
            return ret;
        }
        variable.setValueFromSource(options.value, node_opcua_status_code_1.StatusCodes.Good);
        variable.euRange.setValueFromSource(new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.ExtensionObject, value: new node_opcua_types_1.Range(options.engineeringUnitsRange)
        }));
        if (options.hasOwnProperty("instrumentRange")) {
            variable.instrumentRange.setValueFromSource(new node_opcua_variant_1.Variant({
                dataType: node_opcua_variant_1.DataType.ExtensionObject, value: new node_opcua_types_1.Range(options.instrumentRange)
            }));
        }
        variable.title.setValueFromSource(new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.LocalizedText, value: node_opcua_data_model_1.coerceLocalizedText(options.title || "")
        }));
        // Linear/Log/Ln
        variable.axisScaleType.setValueFromSource(new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.Int32, value: coerceAxisScale(options.axisScaleType)
        }));
        variable.xAxisDefinition.setValueFromSource(new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.ExtensionObject, value: new node_opcua_types_1.AxisInformation(options.xAxisDefinition)
        }));
        return variable;
    }
    // - Methods ----------------------------------------------------------------------------------------------------
    /**
     * @method addMethod
     * @param parentObject {Object}
     * @param options {Object}
     * @param [options.nodeId=null] {NodeId} the object nodeid.
     * @param [options.browseName=""] {String} the object browse name.
     * @param [options.description=""] {String} the object description.
     * @param options.inputArguments  {Array<Argument>}
     * @param options.outputArguments {Array<Argument>}
     * @return {Object}
     */
    addMethod(parentObject, options) {
        const addressSpace = this.addressSpace;
        node_opcua_assert_1.assert(_.isObject(parentObject) && parentObject instanceof base_node_1.BaseNode, "expecting a valid parent object");
        node_opcua_assert_1.assert(options.hasOwnProperty("browseName"));
        node_opcua_assert_1.assert(!options.hasOwnProperty("inputArguments") || _.isArray(options.inputArguments));
        node_opcua_assert_1.assert(!options.hasOwnProperty("outputArguments") || _.isArray(options.outputArguments));
        options.componentOf = parentObject;
        const method = this._addMethod(options);
        const propertyTypeId = addressSpace._coerce_VariableTypeIds("PropertyType");
        const nodeId_ArgumentDataType = "Argument"; // makeNodeId(DataTypeIds.Argument);
        if (options.inputArguments) {
            const _inputArgs = new node_opcua_variant_1.Variant({
                arrayType: node_opcua_variant_1.VariantArrayType.Array,
                dataType: node_opcua_variant_1.DataType.ExtensionObject,
                value: options.inputArguments.map((opt) => new node_opcua_types_1.Argument(opt))
            });
            const inputArguments = this.addVariable({
                accessLevel: "CurrentRead",
                arrayDimensions: [_inputArgs.value.length],
                browseName: { name: "InputArguments", namespaceIndex: 0 },
                dataType: nodeId_ArgumentDataType,
                description: "the definition of the input argument of method " +
                    parentObject.browseName.toString() + "." + method.browseName.toString(),
                minimumSamplingInterval: -1,
                modellingRule: "Mandatory",
                propertyOf: method,
                typeDefinition: "PropertyType",
                value: _inputArgs,
                valueRank: 1
            });
            inputArguments.setValueFromSource(_inputArgs);
            node_opcua_assert_1.assert(inputArguments.typeDefinition.toString() === propertyTypeId.toString());
            // xx console.log("xxxx propertyTypeId = ", propertyTypeId, outputArguments.hasTypeDefinition);
            node_opcua_assert_1.assert(_.isArray(inputArguments.arrayDimensions));
        }
        if (options.outputArguments) {
            const _ouputArgs = new node_opcua_variant_1.Variant({
                arrayType: node_opcua_variant_1.VariantArrayType.Array,
                dataType: node_opcua_variant_1.DataType.ExtensionObject,
                value: options.outputArguments.map((opts) => new node_opcua_types_1.Argument(opts))
            });
            const outputArguments = this.addVariable({
                accessLevel: "CurrentRead",
                arrayDimensions: [_ouputArgs.value.length],
                browseName: { name: "OutputArguments", namespaceIndex: 0 },
                dataType: nodeId_ArgumentDataType,
                description: "the definition of the output arguments of method " +
                    parentObject.browseName.toString() + "." + method.browseName.toString(),
                minimumSamplingInterval: -1,
                modellingRule: "Mandatory",
                propertyOf: method,
                typeDefinition: "PropertyType",
                value: _ouputArgs,
                valueRank: 1
            });
            outputArguments.setValueFromSource(_ouputArgs);
            node_opcua_assert_1.assert(outputArguments.typeDefinition.toString() === propertyTypeId.toString());
            node_opcua_assert_1.assert(_.isArray(outputArguments.arrayDimensions));
        }
        // verifying post-conditions
        parentObject.install_extra_properties();
        return method;
    }
    // - Enumeration ------------------------------------------------------------------------------------------------
    /**
     *
     * @method addEnumerationType
     * @param options
     * @param options.browseName  {String}
     * @param options.enumeration {Array}
     * @param options.enumeration[].displayName {String|LocalizedText}
     * @param options.enumeration[].value       {Number}
     * @param options.enumeration[].description {String|LocalizedText|null}
     */
    addEnumerationType(options) {
        // Release 1.03 OPC Unified Architecture, Part 3 - page 34
        // Enumeration DataTypes are DataTypes that represent discrete sets of named values.
        // Enumerations are always encoded as Int32 on the wire as defined in Part 6. Enumeration
        // DataTypes inherit directly or indirectly from the DataType Enumeration defined in 8.14.
        // Enumerations have no encodings exposed in the AddressSpace. To expose the human readable
        // representation of an enumerated value the DataType Node may have the EnumString
        // Property that contains an array of LocalizedText. The Integer representation of the enumeration
        // value points to a position within that array. EnumValues Property can be used instead of the
        // EnumStrings to support integer representation of enumerations that are not zero-based or have
        // gaps. It contains an array of a Structured DataType containing the integer representation as
        // well as the human-readable representation. An example of an enumeration DataType containing
        // a sparse list of Integers is NodeClass which is defined in 8.30.
        // OPC Unified Architecture, Part 3  Release 1.03 page 35
        // Table 11 – DataType NodeClass
        // EnumStrings O LocalizedText[] The EnumStrings Property only applies for Enumeration DataTypes.
        //                               It shall not be applied for other DataTypes. If the EnumValues
        //                               Property is provided, the EnumStrings Property shall not be provided.
        //                               Each entry of the array of LocalizedText in this Property represents
        //                               the human-readable representation of an enumerated value. The
        //                               Integer representation of the enumeration value points to a position
        //                               of the array.
        // EnumValues O EnumValueType[]  The EnumValues Property only applies for Enumeration DataTypes.
        //                               It shall not be applied for other DataTypes. If the EnumStrings
        //                               Property is provided, the EnumValues Property shall not be provided.
        //                               Using the EnumValues Property it is possible to represent.
        //                               Enumerations with integers that are not zero-based or have gaps
        //                               (e.g. 1, 2, 4, 8, 16).
        //                               Each entry of the array of EnumValueType in this Property
        //                               represents one enumeration value with its integer notation, humanreadable
        //                                representation and help information.
        // The Property EnumStrings contains human-readable representations of enumeration values and is
        // only applied to Enumeration DataTypes. Instead of the EnumStrings Property an Enumeration
        // DataType can also use the EnumValues Property to represent Enumerations with integer values that are not
        // zero-based or containing gaps. There are no additional Properties defined for DataTypes in this standard.
        // Additional parts of this series of standards may define additional Properties for DataTypes.
        // 8.40 EnumValueType
        // This Structured DataType is used to represent a human-readable representation of an
        // Enumeration. Its elements are described inTable 27. When this type is used in an array representing
        // human-readable representations of an enumeration, each Value shall be unique in that array.
        // Table 27 – EnumValueType Definition
        // Name               Type            Description
        // EnumValueType structure
        // Value              Int64           The Integer representation of an Enumeration.
        // DisplayName        LocalizedText   A human-readable representation of the Value of the Enumeration.
        // Description        LocalizedText   A localized description of the enumeration value. This field can
        //                                    contain an empty string if no description is available.
        // Note that the EnumValueType has been defined with a Int64 Value to meet a variety of usages.
        // When it is used to define the string representation of an Enumeration DataType, the value range
        // is limited to Int32, because the Enumeration DataType is a subtype of Int32. Part 8 specifies
        // other usages where the actual value might be between 8 and 64 Bit.
        const self = this;
        node_opcua_assert_1.assert(_.isString(options.browseName));
        node_opcua_assert_1.assert(_.isArray(options.enumeration));
        const addressSpace = self.addressSpace;
        let definition;
        const enumerationType = addressSpace.findDataType("Enumeration");
        node_opcua_assert_1.assert(enumerationType.nodeId instanceof node_opcua_nodeid_4.NodeId);
        node_opcua_assert_1.assert(enumerationType instanceof ua_data_type_1.UADataType);
        const references = [
            { referenceType: "HasSubtype", isForward: false, nodeId: enumerationType.nodeId }
        ];
        const opts = {
            browseName: options.browseName,
            definition,
            description: options.description || null,
            displayName: options.displayName || null,
            isAbstract: false,
            nodeClass: node_opcua_data_model_4.NodeClass.DataType,
            references
        };
        const enumType = self._createNode(opts); //  as UAEnumeration;
        enumType.propagate_back_references();
        if (_.isString(options.enumeration[0])) {
            // enumeration is a array of string
            definition = options.enumeration.map((str, index) => node_opcua_data_model_1.coerceLocalizedText(str));
            const value = new node_opcua_variant_1.Variant({
                arrayType: node_opcua_variant_1.VariantArrayType.Array,
                dataType: node_opcua_variant_1.DataType.LocalizedText,
                value: definition
            });
            const enumStrings = self.addVariable({
                browseName: { name: "EnumStrings", namespaceIndex: 0 },
                dataType: "LocalizedText",
                description: "",
                modellingRule: "Mandatory",
                propertyOf: enumType,
                value,
                valueRank: 1
            });
            node_opcua_assert_1.assert(enumStrings.browseName.toString() === "EnumStrings");
        }
        else {
            // construct the definition object
            definition = options.enumeration.map((enumItem) => {
                return new node_opcua_types_1.EnumValueType({
                    description: node_opcua_data_model_1.coerceLocalizedText(enumItem.description),
                    displayName: node_opcua_data_model_1.coerceLocalizedText(enumItem.displayName),
                    value: [0, enumItem.value]
                });
            });
            const value = new node_opcua_variant_1.Variant({
                arrayType: node_opcua_variant_1.VariantArrayType.Array,
                dataType: node_opcua_variant_1.DataType.ExtensionObject,
                value: definition
            });
            const enumValues = self.addVariable({
                browseName: { name: "EnumValues", namespaceIndex: 0 },
                dataType: "EnumValueType",
                description: undefined,
                modellingRule: "Mandatory",
                propertyOf: enumType,
                value,
                valueRank: 1
            });
            node_opcua_assert_1.assert(enumValues.browseName.toString() === "EnumValues");
        }
        // now create the string value property
        // <UAVariable NodeId="i=7612" BrowseName="EnumStrings"
        //               ParentNodeId="i=852" DataType="LocalizedText" ValueRank="1">
        // <DisplayName>EnumStrings</DisplayName>
        // <References>
        //   <Reference ReferenceType="HasTypeDefinition">i=68</Reference>
        //   <Reference ReferenceType="HasModellingRule">i=78</Reference>
        //    <Reference ReferenceType="HasProperty" IsForward="false">i=852</Reference>
        // </References>
        // <Value>
        //    <ListOfLocalizedText xmlns="http://opcfoundation.org/UA/2008/02/Types.xsd">
        //      <LocalizedText><Locale></Locale><Text>Running</Text></LocalizedText>
        //      <LocalizedText><Locale></Locale><Text>Failed</Text>
        //    </ListOfLocalizedText>
        // </Value>
        // </UAVariable>
        return enumType;
    }
    // -------------------------------------------------------------------------
    // State and Transition
    // -------------------------------------------------------------------------
    toNodeset2XML() {
        return "";
    }
    // -------------------------------------------------------------------------
    // State and Transition
    // -------------------------------------------------------------------------
    /**
     * @class AddressSpace
     * @method addState
     * @param component
     * @param stateName   {string}
     * @param stateNumber {number}
     * @param isInitialState {boolean}
     * @return {UAObject} {StateType|InitialStateType}
     */
    addState(component, stateName, stateNumber, isInitialState) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        isInitialState = !!isInitialState;
        node_opcua_assert_1.assert(component instanceof ua_object_type_1.UAObjectType);
        node_opcua_assert_1.assert(_.isString(stateName));
        node_opcua_assert_1.assert(_.isBoolean(isInitialState));
        const initialStateType = addressSpace.findObjectType("InitialStateType");
        const stateType = addressSpace.findObjectType("StateType");
        let state;
        if (isInitialState) {
            state = initialStateType.instantiate({
                browseName: stateName,
                componentOf: component
            });
        }
        else {
            state = stateType.instantiate({
                browseName: stateName,
                componentOf: component
            });
        }
        // ensure state number is unique
        state.stateNumber.setValueFromSource({
            dataType: node_opcua_variant_1.DataType.UInt32,
            value: stateNumber
        });
        return state;
    }
    /**
     */
    addTransition(component, fromState, toState, transitionNumber) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        node_opcua_assert_1.assert(component instanceof ua_object_type_1.UAObjectType);
        node_opcua_assert_1.assert(_.isString(fromState));
        node_opcua_assert_1.assert(_.isString(toState));
        node_opcua_assert_1.assert(_.isFinite(transitionNumber));
        const fromStateNode = component.getComponentByName(fromState, component.nodeId.namespace);
        // istanbul ignore next
        if (!fromStateNode) {
            throw new Error("Cannot find state with name " + fromState);
        }
        node_opcua_assert_1.assert(fromStateNode.browseName.name.toString() === fromState);
        const toStateNode = component.getComponentByName(toState);
        // istanbul ignore next
        if (!toStateNode) {
            throw new Error("Cannot find state with name " + toState);
        }
        node_opcua_assert_1.assert(toStateNode.browseName.name.toString() === toState);
        const transitionType = addressSpace.findObjectType("TransitionType");
        if (!transitionType) {
            throw new Error("Cannot find TransitionType");
        }
        const transition = transitionType.instantiate({
            browseName: fromState + "To" + toState + "Transition",
            componentOf: component
        });
        transition.addReference({
            isForward: true,
            nodeId: toStateNode.nodeId,
            referenceType: "ToState"
        });
        transition.addReference({
            isForward: true,
            nodeId: fromStateNode.nodeId,
            referenceType: "FromState"
        });
        transition.transitionNumber.setValueFromSource({
            dataType: node_opcua_variant_1.DataType.UInt32, value: transitionNumber
        });
        return transition;
    }
    addTwoStateVariable(options) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        const twoStateVariableType = addressSpace.findVariableType("TwoStateVariableType");
        if (!twoStateVariableType) {
            throw new Error("cannot find TwoStateVariableType");
        }
        options.optionals = options.optionals || [];
        if (options.trueState) {
            options.optionals.push("TrueState");
        }
        if (options.falseState) {
            options.optionals.push("FalseState");
        }
        // we want event based change...
        options.minimumSamplingInterval = 0;
        const node = twoStateVariableType.instantiate({
            browseName: options.browseName,
            nodeId: options.nodeId,
            description: options.description,
            componentOf: options.componentOf,
            organizedBy: options.organizedBy,
            modellingRule: options.modellingRule,
            minimumSamplingInterval: options.minimumSamplingInterval,
            optionals: options.optionals
        });
        ua_two_state_variable_1._install_TwoStateVariable_machinery(node, options);
        return node;
    }
    /**
     * @method addTwoStateDiscrete
     * @param options {Object}
     * @param options.browseName {String}
     * @param [options.nodeId  {NodeId}]
     * @param [options.value {Boolean} }
     * @param [options.trueState {String} = "ON" }
     * @param [options.falseState {String}= "OFF" }
     * @return {Object|UAVariable}
     */
    addTwoStateDiscrete(options) {
        const namespace = this;
        const addressSpace = namespace.addressSpace;
        node_opcua_assert_1.assert(!options.hasOwnProperty("ValuePrecision"));
        const twoStateDiscreteType = addressSpace.findVariableType("TwoStateDiscreteType");
        if (!twoStateDiscreteType) {
            throw new Error("expecting TwoStateDiscreteType to be defined , check nodeset xml file");
        }
        // todo : if options.typeDefinition is specified,
        const variable = namespace.addVariable({
            accessLevel: options.accessLevel,
            browseName: options.browseName,
            componentOf: options.componentOf,
            dataType: "Boolean",
            nodeId: options.nodeId,
            typeDefinition: twoStateDiscreteType.nodeId,
            userAccessLevel: options.userAccessLevel,
            value: new node_opcua_variant_1.Variant({ dataType: node_opcua_variant_1.DataType.Boolean, value: !!options.value })
        });
        const handler = variable.handle_semantic_changed.bind(variable);
        ua_data_item_1.add_dataItem_stuff(variable, options);
        const trueStateNode = namespace.addVariable({
            browseName: { name: "TrueState", namespaceIndex: 0 },
            dataType: "LocalizedText",
            minimumSamplingInterval: 0,
            propertyOf: variable,
            typeDefinition: "PropertyType",
            value: new node_opcua_variant_1.Variant({
                dataType: node_opcua_variant_1.DataType.LocalizedText, value: node_opcua_data_model_1.coerceLocalizedText(options.trueState || "ON")
            })
        });
        trueStateNode.on("value_changed", handler);
        const falseStateNode = namespace.addVariable({
            browseName: { name: "FalseState", namespaceIndex: 0 },
            dataType: "LocalizedText",
            minimumSamplingInterval: 0,
            propertyOf: variable,
            typeDefinition: "PropertyType",
            value: new node_opcua_variant_1.Variant({
                dataType: node_opcua_variant_1.DataType.LocalizedText, value: node_opcua_data_model_1.coerceLocalizedText(options.falseState || "OFF")
            })
        });
        falseStateNode.on("value_changed", handler);
        variable.install_extra_properties();
        return variable;
    }
    // --- Alarms & Conditions -------------------------------------------------
    instantiateCondition(conditionTypeId, options, data) {
        return ua_condition_base_1.UAConditionBase.instantiate(this, conditionTypeId, options, data);
    }
    instantiateAcknowledgeableCondition(conditionTypeId, options, data) {
        // @ts-ignore
        return ua_acknowledgeable_condition_base_1.UAAcknowledgeableConditionBase.instantiate(this, conditionTypeId, options, data);
    }
    instantiateAlarmCondition(alarmConditionTypeId, options, data) {
        return ua_alarm_condition_base_1.UAAlarmConditionBase.instantiate(this, alarmConditionTypeId, options, data);
    }
    instantiateLimitAlarm(limitAlarmTypeId, options, data) {
        return ua_limit_alarm_1.UALimitAlarm.instantiate(this, limitAlarmTypeId, options, data);
    }
    instantiateExclusiveLimitAlarm(exclusiveLimitAlarmTypeId, options, data) {
        return ua_exclusive_limit_alarm_1.UAExclusiveLimitAlarm.instantiate(this, exclusiveLimitAlarmTypeId, options, data);
    }
    instantiateExclusiveDeviationAlarm(options, data) {
        return ua_exclusive_deviation_alarm_1.UAExclusiveDeviationAlarm.instantiate(this, "ExclusiveDeviationAlarmType", options, data);
    }
    instantiateNonExclusiveLimitAlarm(nonExclusiveLimitAlarmTypeId, options, data) {
        return ua_non_exclusive_limit_alarm_1.UANonExclusiveLimitAlarm.instantiate(this, nonExclusiveLimitAlarmTypeId, options, data);
    }
    instantiateNonExclusiveDeviationAlarm(options, data) {
        return ua_non_exclusive_deviation_alarm_1.UANonExclusiveDeviationAlarm.instantiate(this, "NonExclusiveDeviationAlarmType", options, data);
    }
    instantiateDiscreteAlarm(discreteAlarmType, options, data) {
        return ua_discrete_alarm_1.UADiscreteAlarm.instantiate(this, discreteAlarmType, options, data);
    }
    instantiateOffNormalAlarm(options, data) {
        return ua_off_normal_alarm_1.UAOffNormalAlarm.instantiate(this, "OffNormalAlarmType", options, data);
    }
    // --- internal stuff
    _construct_nodeId(options) {
        const addressSpace = this.addressSpace;
        let nodeId = options.nodeId;
        if (!nodeId) {
            for (const ref of options.references) {
                ref._referenceType = addressSpace.findReferenceType(ref.referenceType);
                /* istanbul ignore next */
                if (!ref._referenceType) {
                    throw new Error("Cannot find referenceType " + JSON.stringify(ref));
                }
                ref.referenceType = ref._referenceType.nodeId;
            }
            // find HasComponent, or has Property reverse
            const parentRef = _identifyParentInReference(options.references);
            if (parentRef) {
                node_opcua_assert_1.assert(parentRef.nodeId instanceof node_opcua_nodeid_4.NodeId);
                node_opcua_assert_1.assert(options.browseName instanceof node_opcua_data_model_2.QualifiedName);
                nodeId = __combineNodeId(parentRef.nodeId, options.browseName);
            }
        }
        else if (typeof nodeId === "string") {
            if (nodeId.match(regExp1)) {
                nodeId = "ns=" + this.index + ";" + nodeId;
            }
        }
        nodeId = nodeId || this._build_new_NodeId();
        if (nodeId instanceof node_opcua_nodeid_4.NodeId) {
            return nodeId;
        }
        nodeId = node_opcua_nodeid_3.resolveNodeId(nodeId);
        node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_4.NodeId);
        return nodeId;
    }
    _build_new_NodeId() {
        let nodeId;
        do {
            nodeId = node_opcua_nodeid_1.makeNodeId(this._internal_id_counter, this.index);
            this._internal_id_counter += 1;
        } while (this._nodeid_index.hasOwnProperty(nodeId.toString()));
        return nodeId;
    }
    _register(node) {
        node_opcua_assert_1.assert(node instanceof base_node_1.BaseNode, "Expecting a instance of BaseNode in _register");
        node_opcua_assert_1.assert(node.nodeId instanceof node_opcua_nodeid_4.NodeId, "Expecting a NodeId");
        if (node.nodeId.namespace !== this.index) {
            throw new Error("node must belongs to this namespace");
        }
        node_opcua_assert_1.assert(node.nodeId.namespace === this.index, "node must belongs to this namespace");
        node_opcua_assert_1.assert(node.hasOwnProperty("browseName"), "Node must have a browseName");
        // assert(node.browseName.namespaceIndex === this.index,"browseName must belongs to this namespace");
        const indexName = node.nodeId.toString();
        if (this._nodeid_index.hasOwnProperty(indexName)) {
            throw new Error("nodeId " + node.nodeId.displayText() + " already registered " + node.nodeId.toString()
                + "\n" +
                " in namespace " + this.namespaceUri + " index = " + this.index
                + "\n" +
                " browseName = " + node.browseName.toString());
        }
        this._nodeid_index[indexName] = node;
        if (node.nodeClass === node_opcua_data_model_4.NodeClass.ObjectType) {
            this._registerObjectType(node);
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.VariableType) {
            this._registerVariableType(node);
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.ReferenceType) {
            this._registerReferenceType(node);
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.DataType) {
            this._registerDataType(node);
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.Object) {
            //
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.Variable) {
            //
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.Method) {
            //
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.View) {
            //
        }
        else {
            // tslint:disable-next-line:no-console
            console.log("Invalid class Name", node.nodeClass);
            throw new Error("Invalid class name specified");
        }
    }
    /**
     * @method _createNode
     * @internal
     * @param options
     *
     * @param [options.nodeId==null]      {NodeId}
     * @param options.nodeClass  {NodeClass}
     * @param options.browseName {String|QualifiedName} the node browseName
     *    the browseName can be either a string : "Hello"
     *                                 a string with a namespace : "1:Hello"
     *                                 a QualifiedName : new QualifiedName({name:"Hello", namespaceIndex:1});
     * @param [options.displayName] {String|LocalizedText} the node display name
     * @param [options.description] {String|LocalizedText} the node description
     *
     * @return {BaseNode}
     */
    _createNode(options) {
        node_opcua_assert_1.assert(options.nodeClass !== undefined, " options.nodeClass must be specified");
        node_opcua_assert_1.assert(options.browseName, "options.browseName must be specified");
        // xx assert(options.browseName instanceof QualifiedName
        // ? (options.browseName.namespaceIndex === this.index): true,
        // "Expecting browseName to have the same namepsaceIndex as the namespace");
        options.description = node_opcua_data_model_1.coerceLocalizedText(options.description);
        // browseName adjustment
        if (typeof options.browseName === "string") {
            const match = options.browseName.match(regExpNamespaceDotBrowseName);
            if (match) {
                const correctedName = match[1];
                // the application is using an old scheme
                console.log(chalk_1.default.green("Warning : since node-opcua 0.4.2 " +
                    "namespace index should not be prepended to the browse name anymore"));
                console.log("   ", options.browseName, " will be replaced with ", correctedName);
                console.log(" Please update your code");
                const indexVerif = parseInt(match[0], 10);
                if (indexVerif !== this.index) {
                    console.log(chalk_1.default.red.bold("Error: namespace index used at the front of the browseName " +
                        indexVerif + " do not match the index of the current namespace (" + this.index + ")"));
                    console.log(" Please fix your code so that the created node is inserted in the correct namespace," +
                        " please refer to the NodeOPCUA documentation");
                }
            }
            options.browseName = new node_opcua_data_model_2.QualifiedName({ name: options.browseName, namespaceIndex: this.index });
        }
        else if (!(options.browseName instanceof node_opcua_data_model_2.QualifiedName)) {
            options.browseName = new node_opcua_data_model_2.QualifiedName(options.browseName);
        }
        node_opcua_assert_1.assert(options.browseName instanceof node_opcua_data_model_2.QualifiedName, "Expecting options.browseName to be instanceof  QualifiedName ");
        // ------------- set display name
        if (!options.displayName) {
            node_opcua_assert_1.assert(typeof (options.browseName.name) === "string");
            options.displayName = options.browseName.name;
        }
        // --- nodeId adjustment
        options.nodeId = this._construct_nodeId(options);
        node_opcua_debug_1.dumpIf(!options.nodeId, options); // missing node Id
        node_opcua_assert_1.assert(options.nodeId instanceof node_opcua_nodeid_4.NodeId);
        // assert(options.browseName.namespaceIndex === this.index,"Expecting browseName to have
        // the same namepsaceIndex as the namespace");
        const Constructor = _constructors_map[node_opcua_data_model_4.NodeClass[options.nodeClass]];
        if (!Constructor) {
            throw new Error(" missing constructor for NodeClass " + node_opcua_data_model_4.NodeClass[options.nodeClass]);
        }
        options.addressSpace = this.addressSpace;
        const node = new Constructor(options);
        node_opcua_assert_1.assert(node.nodeId);
        node_opcua_assert_1.assert(node.nodeId instanceof node_opcua_nodeid_4.NodeId);
        this._register(node);
        // object shall now be registered
        if (doDebug) {
            node_opcua_assert_1.assert(_.isObject(this.findNode(node.nodeId)));
        }
        return node;
    }
    _deleteNode(node) {
        node_opcua_assert_1.assert(node instanceof base_node_1.BaseNode);
        const indexName = node.nodeId.toString();
        // istanbul ignore next
        if (!this._nodeid_index.hasOwnProperty(indexName)) {
            throw new Error("deleteNode : nodeId " +
                node.nodeId.displayText() + " is not registered " + node.nodeId.toString());
        }
        if (node.nodeClass === node_opcua_data_model_4.NodeClass.ObjectType) {
            this._unregisterObjectType(node);
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.Object) {
            // etc...
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.Variable) {
            // etc...
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.Method) {
            // etc...
        }
        else if (node.nodeClass === node_opcua_data_model_4.NodeClass.View) {
            // etc...
        }
        else {
            // tslint:disable:no-console
            console.log("Invalid class Name", node.nodeClass);
            throw new Error("Invalid class name specified");
        }
        node_opcua_assert_1.assert(this._nodeid_index[indexName] === node);
        delete this._nodeid_index[indexName];
        node.dispose();
    }
    // --- Private stuff
    _addObjectOrVariableType(options1, topMostBaseType, nodeClass) {
        const addressSpace = this.addressSpace;
        node_opcua_assert_1.assert(typeof topMostBaseType === "string");
        node_opcua_assert_1.assert(nodeClass === node_opcua_data_model_4.NodeClass.ObjectType || nodeClass === node_opcua_data_model_4.NodeClass.VariableType);
        const options = options1;
        node_opcua_assert_1.assert(!options.nodeClass);
        node_opcua_assert_1.assert(options.browseName);
        node_opcua_assert_1.assert(typeof options.browseName === "string");
        if (options.hasOwnProperty("references")) {
            throw new Error("options.references should not be provided, use options.subtypeOf instead");
        }
        const references = [];
        function process_subtypeOf_options(options2, references1) {
            // check common misspelling mistake
            node_opcua_assert_1.assert(!options2.subTypeOf, "misspell error : it should be 'subtypeOf' instead");
            if (options2.hasOwnProperty("hasTypeDefinition")) {
                throw new Error("hasTypeDefinition option is invalid. Do you mean typeDefinition instead ?");
            }
            node_opcua_assert_1.assert(!options2.typeDefinition, " do you mean subtypeOf ?");
            const subtypeOfNodeId = addressSpace._coerceType(options2.subtypeOf, topMostBaseType, nodeClass);
            node_opcua_assert_1.assert(subtypeOfNodeId);
            references1.push({
                isForward: false,
                nodeId: subtypeOfNodeId,
                referenceType: "HasSubtype"
            });
        }
        process_subtypeOf_options.call(this, options, references);
        const objectType = this._createNode({
            browseName: options.browseName,
            displayName: options.displayName,
            eventNotifier: +options.eventNotifier,
            isAbstract: !!options.isAbstract,
            nodeClass,
            nodeId: options.nodeId,
            references
        });
        objectType.propagate_back_references();
        objectType.install_extra_properties();
        objectType.installPostInstallFunc(options.postInstantiateFunc);
        return objectType;
    }
    // private  _adjust_options(options: any) {
    //     const ns = this.addressSpace.getNamespaceIndex(this.namespaceUri);
    //     if (!options.nodeId) {
    //         const id = this._getNextAvailableId();
    //         options.nodeId = new NodeId(NodeId.NodeIdType.NUMERIC, id, ns);
    //     }
    //     options.nodeId = NodeId.coerce(options.nodeId);
    //     if (typeof options.browseName === "string") {
    //         options.browseName = new QualifiedName({
    //             name: options.browseName,
    //             namespaceIndex: ns
    //         });
    //     }
    //     return options;
    // }
    _registerObjectType(node) {
        node_opcua_assert_1.assert(this.index === node.nodeId.namespace);
        const key = node.browseName.name;
        node_opcua_assert_1.assert(!this._objectTypeMap[key], " UAObjectType already declared");
        this._objectTypeMap[key] = node;
    }
    _registerVariableType(node) {
        node_opcua_assert_1.assert(this.index === node.nodeId.namespace);
        const key = node.browseName.name;
        node_opcua_assert_1.assert(!this._variableTypeMap[key], " UAVariableType already declared");
        this._variableTypeMap[key] = node;
    }
    _registerReferenceType(node) {
        node_opcua_assert_1.assert(this.index === node.nodeId.namespace);
        node_opcua_assert_1.assert(node.browseName instanceof node_opcua_data_model_2.QualifiedName);
        if (!node.inverseName) {
            // Inverse name is not required anymore in 1.0.4
            // xx console.log("Warning : node has no inverse Name ",
            // node.nodeId.toString(), node.browseName.toString());
            node.inverseName = node_opcua_data_model_4.LocalizedText.coerce({ text: node.browseName.name });
        }
        const key = node.browseName.name;
        this._referenceTypeMap[key] = node;
        this._referenceTypeMapInv[node.inverseName.text] = node;
    }
    _registerDataType(node) {
        node_opcua_assert_1.assert(this.index === node.nodeId.namespace);
        const key = node.browseName.name;
        node_opcua_assert_1.assert(node.browseName instanceof node_opcua_data_model_2.QualifiedName);
        node_opcua_assert_1.assert(!this._dataTypeMap[key], " DataType already declared");
        this._dataTypeMap[key] = node;
    }
    _unregisterObjectType(node) {
        //
    }
    /**
     * @private
     */
    _addVariable(options) {
        const addressSpace = this.addressSpace;
        const baseDataVariableType = addressSpace.findVariableType("BaseDataVariableType");
        if (!baseDataVariableType) {
            throw new Error("cannot find BaseDataVariableType");
        }
        const baseDataVariableTypeId = baseDataVariableType.nodeId;
        node_opcua_assert_1.assert(options.hasOwnProperty("browseName"), "options.browseName must be provided");
        node_opcua_assert_1.assert(options.hasOwnProperty("dataType"), "options.dataType must be provided");
        options.historizing = !!options.historizing;
        // xx assert(this.FolderTypeId && this.BaseObjectTypeId); // is default address space generated.?
        // istanbul ignore next
        if (options.hasOwnProperty("hasTypeDefinition")) {
            throw new Error("hasTypeDefinition option is invalid. Do you mean typeDefinition instead ?");
        }
        // ------------------------------------------ TypeDefinition
        let typeDefinition = options.typeDefinition || baseDataVariableTypeId;
        typeDefinition = addressSpace._coerce_VariableTypeIds(typeDefinition);
        node_opcua_assert_1.assert(typeDefinition instanceof node_opcua_nodeid_4.NodeId);
        // ------------------------------------------ DataType
        options.dataType = addressSpace._coerce_DataType(options.dataType);
        options.valueRank = utils.isNullOrUndefined(options.valueRank) ? -1 : options.valueRank;
        node_opcua_assert_1.assert(_.isFinite(options.valueRank));
        node_opcua_assert_1.assert(typeof options.valueRank === "number");
        options.arrayDimensions = options.arrayDimensions || null;
        node_opcua_assert_1.assert(_.isArray(options.arrayDimensions) || options.arrayDimensions === null);
        // -----------------------------------------------------
        options.minimumSamplingInterval = +options.minimumSamplingInterval || 0;
        let references = options.references || [];
        references = [].concat(references, [
            {
                isForward: true,
                nodeId: typeDefinition,
                referenceType: "HasTypeDefinition"
            }
        ]);
        node_opcua_assert_1.assert(!options.nodeClass || options.nodeClass === node_opcua_data_model_4.NodeClass.Variable);
        options.nodeClass = node_opcua_data_model_4.NodeClass.Variable;
        options.references = references;
        const variable = this.createNode(options);
        node_opcua_assert_1.assert(variable instanceof ua_variable_1.UAVariable);
        return variable;
    }
    /**
     * @private
     */
    _addMethod(options) {
        const addressSpace = this.addressSpace;
        node_opcua_assert_1.assert(isNonEmptyQualifiedName(options.browseName));
        const references = [];
        node_opcua_assert_1.assert(isNonEmptyQualifiedName(options.browseName));
        _handle_hierarchy_parent(addressSpace, references, options);
        namespace_private_1.UANamespace_process_modelling_rule(references, options.modellingRule);
        const method = this._createNode({
            browseName: options.browseName,
            description: options.description || "",
            displayName: options.displayName,
            eventNotifier: +options.eventNotifier,
            isAbstract: false,
            nodeClass: node_opcua_data_model_4.NodeClass.Method,
            nodeId: options.nodeId,
            references
        });
        node_opcua_assert_1.assert(method.nodeId !== null);
        method.propagate_back_references();
        node_opcua_assert_1.assert(!method.typeDefinition);
        return method;
    }
}
exports.UANamespace = UANamespace;
UANamespace._handle_hierarchy_parent = _handle_hierarchy_parent;
UANamespace.isNonEmptyQualifiedName = isNonEmptyQualifiedName;
function _identifyParentInReference(references) {
    node_opcua_assert_1.assert(_.isArray(references));
    const candidates = references.filter((ref) => {
        return ref.isForward === false &&
            (node_opcua_nodeid_2.sameNodeId(ref.referenceType, hasComponentRefId) || node_opcua_nodeid_2.sameNodeId(ref.referenceType, hasPropertyRefId));
    });
    node_opcua_assert_1.assert(candidates.length <= 1);
    return candidates[0];
}
const _constructors_map = {
    DataType: ua_data_type_1.UADataType,
    Method: ua_method_1.UAMethod,
    Object: ua_object_1.UAObject,
    ObjectType: ua_object_type_1.UAObjectType,
    ReferenceType: ua_reference_type_1.UAReferenceType,
    Variable: ua_variable_1.UAVariable,
    VariableType: ua_variable_type_1.UAVariableType,
    View: ua_view_1.UAView
};
function __combineNodeId(parentNodeId, name) {
    let nodeId = null;
    if (parentNodeId.identifierType === node_opcua_nodeid_4.NodeId.NodeIdType.STRING) {
        const childName = parentNodeId.value + exports.NamespaceOptions.nodeIdNameSeparator + name.toString();
        nodeId = new node_opcua_nodeid_4.NodeId(node_opcua_nodeid_4.NodeId.NodeIdType.STRING, childName, parentNodeId.namespace);
    }
    return nodeId;
}
/**
 * @method _coerce_parent
 * convert a 'string' , NodeId or Object into a valid and existing object
 * @param addressSpace  {AddressSpace}
 * @param value
 * @param coerceFunc
 * @private
 */
function _coerce_parent(addressSpace, value, coerceFunc) {
    node_opcua_assert_1.assert(_.isFunction(coerceFunc));
    if (value) {
        if (typeof value === "string") {
            value = coerceFunc.call(addressSpace, value);
        }
        if (value instanceof node_opcua_nodeid_4.NodeId) {
            value = addressSpace.findNode(value);
        }
    }
    node_opcua_assert_1.assert(!value || value instanceof base_node_1.BaseNode);
    return value;
}
function _handle_event_hierarchy_parent(addressSpace, references, options) {
    options.eventSourceOf = _coerce_parent(addressSpace, options.eventSourceOf, addressSpace._coerceNode);
    options.notifierOf = _coerce_parent(addressSpace, options.notifierOf, addressSpace._coerceNode);
    if (options.eventSourceOf) {
        node_opcua_assert_1.assert(!options.notifierOf, "notifierOf shall not be provided with eventSourceOf ");
        references.push({
            isForward: false,
            nodeId: options.eventSourceOf.nodeId,
            referenceType: "HasEventSource"
        });
    }
    else if (options.notifierOf) {
        node_opcua_assert_1.assert(!options.eventSourceOf, "eventSourceOf shall not be provided with notifierOf ");
        references.push({
            isForward: false,
            nodeId: options.notifierOf.nodeId,
            referenceType: "HasNotifier"
        });
    }
}
function _handle_hierarchy_parent(addressSpace, references, options) {
    options.componentOf = _coerce_parent(addressSpace, options.componentOf, addressSpace._coerceNode);
    options.propertyOf = _coerce_parent(addressSpace, options.propertyOf, addressSpace._coerceNode);
    options.organizedBy = _coerce_parent(addressSpace, options.organizedBy, addressSpace._coerceFolder);
    if (options.componentOf) {
        node_opcua_assert_1.assert(!options.propertyOf);
        node_opcua_assert_1.assert(!options.organizedBy);
        node_opcua_assert_1.assert(addressSpace.rootFolder.objects, "addressSpace must have a rootFolder.objects folder");
        node_opcua_assert_1.assert(options.componentOf.nodeId !== addressSpace.rootFolder.objects.nodeId, "Only Organizes References are used to relate Objects to the 'Objects' standard Object.");
        references.push({
            isForward: false,
            nodeId: options.componentOf.nodeId,
            referenceType: "HasComponent"
        });
    }
    if (options.propertyOf) {
        node_opcua_assert_1.assert(!options.componentOf);
        node_opcua_assert_1.assert(!options.organizedBy);
        node_opcua_assert_1.assert(options.propertyOf.nodeId !== addressSpace.rootFolder.objects.nodeId, "Only Organizes References are used to relate Objects to the 'Objects' standard Object.");
        references.push({
            isForward: false,
            nodeId: options.propertyOf.nodeId,
            referenceType: "HasProperty"
        });
    }
    if (options.organizedBy) {
        node_opcua_assert_1.assert(!options.propertyOf);
        node_opcua_assert_1.assert(!options.componentOf);
        references.push({
            isForward: false,
            nodeId: options.organizedBy.nodeId,
            referenceType: "Organizes"
        });
    }
}
exports._handle_hierarchy_parent = _handle_hierarchy_parent;
function _copy_reference(reference) {
    node_opcua_assert_1.assert(reference.hasOwnProperty("referenceType"));
    node_opcua_assert_1.assert(reference.hasOwnProperty("isForward"));
    node_opcua_assert_1.assert(reference.hasOwnProperty("nodeId"));
    node_opcua_assert_1.assert(reference.nodeId instanceof node_opcua_nodeid_4.NodeId);
    return {
        isForward: reference.isForward,
        nodeId: reference.nodeId,
        referenceType: reference.referenceType
    };
}
function _copy_references(references) {
    references = references || [];
    return references.map(_copy_reference);
}
function isNonEmptyQualifiedName(browseName) {
    if (!browseName) {
        return false;
    }
    if (typeof browseName === "string") {
        return browseName.length >= 0;
    }
    if (!(browseName instanceof node_opcua_data_model_2.QualifiedName)) {
        browseName = new node_opcua_data_model_2.QualifiedName(browseName);
    }
    node_opcua_assert_1.assert(browseName instanceof node_opcua_data_model_2.QualifiedName);
    return browseName.name.length > 0;
}
exports.isNonEmptyQualifiedName = isNonEmptyQualifiedName;
function _handle_node_version(node, options) {
    node_opcua_assert_1.assert(options);
    if (options.nodeVersion) {
        node_opcua_assert_1.assert(node.nodeClass === node_opcua_data_model_4.NodeClass.Variable || node.nodeClass === node_opcua_data_model_4.NodeClass.Object);
        const nodeVersion = node.addressSpace.getOwnNamespace().addVariable({
            browseName: "NodeVersion",
            dataType: "String",
            propertyOf: node
        });
        const initialValue = _.isString(options.nodeVersion) ? options.nodeVersion : "0";
        // xx console.log(" init value =",initialValue);
        nodeVersion.setValueFromSource({ dataType: "String", value: initialValue });
    }
}
//# sourceMappingURL=namespace.js.map