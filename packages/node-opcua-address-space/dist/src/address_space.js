"use strict";
/**
 * @module node-opcua-address-space
 */
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_constants_1 = require("node-opcua-constants");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_object_registry_1 = require("node-opcua-object-registry");
const node_opcua_service_browse_1 = require("node-opcua-service-browse");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_types_1 = require("node-opcua-types");
const utils = require("node-opcua-utils");
const node_opcua_utils_1 = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const source_1 = require("../source");
const alarms_and_conditions_1 = require("./alarms_and_conditions");
const alarms_and_conditions_2 = require("./alarms_and_conditions");
const base_node_1 = require("./base_node");
const event_data_1 = require("./event_data");
const extension_object_array_node_1 = require("./extension_object_array_node");
const address_space_historical_data_node_1 = require("./historical_access/address_space_historical_data_node");
const namespace_1 = require("./namespace");
const namespace_2 = require("./namespace");
const reference_1 = require("./reference");
const ua_data_type_1 = require("./ua_data_type");
const ua_method_1 = require("./ua_method");
const ua_object_1 = require("./ua_object");
const ua_object_type_1 = require("./ua_object_type");
const ua_reference_type_1 = require("./ua_reference_type");
const doDebug = false;
// tslint:disable-next-line:no-var-requires
const Dequeue = require("dequeue");
const regexNumberColumnString = /^([0-9]+):(.*)/;
function _extract_namespace_and_browse_name_as_string(addressSpace, browseName, namespaceIndex) {
    node_opcua_assert_1.assert(!namespaceIndex || namespaceIndex >= 0);
    let result;
    if (namespaceIndex !== undefined && namespaceIndex > 0) {
        node_opcua_assert_1.assert(typeof browseName === "string", "expecting a string when namespaceIndex is specified");
        result = [addressSpace.getNamespace(namespaceIndex), browseName];
    }
    else if (typeof browseName === "string") {
        // split
        if (browseName.indexOf(":") >= 0) {
            const a = browseName.split(":");
            namespaceIndex = a.length === 2 ? parseInt(a[0], 10) : namespaceIndex;
            browseName = a.length === 2 ? a[1] : browseName;
        }
        result = [addressSpace.getNamespace(namespaceIndex || 0), browseName];
    }
    else if (browseName instanceof node_opcua_data_model_1.QualifiedName) {
        namespaceIndex = browseName.namespaceIndex;
        result = [addressSpace.getNamespace(namespaceIndex), browseName.name];
    }
    else if (typeof browseName === "number") {
        result = [addressSpace.getDefaultNamespace(), node_opcua_variant_1.DataType[browseName]];
    }
    /* istanbul ignore next */
    if (!result || !result[0]) {
        throw new Error(` Cannot find namespace associated with ${browseName} ${namespaceIndex}`);
    }
    return result;
}
/**
 * returns true if str matches a nodeID, e.g i=123 or ns=...
 * @method isNodeIdString
 * @param str
 * @type {boolean}
 */
function isNodeIdString(str) {
    if (typeof str !== "string") {
        return false;
    }
    return str.substring(0, 2) === "i=" || str.substring(0, 3) === "ns=";
}
/**
 * `AddressSpace` is a collection of UA nodes.
 *
 *     const addressSpace = AddressSpace.create();
 */
class AddressSpace {
    constructor() {
        /***
         * @internal
         * @private
         */
        this.suspendBackReference = false;
        this.isFrugal = false;
        this.historizingNodes = {};
        this._condition_refresh_in_progress = false;
        this.isNodeIdString = isNodeIdString;
        this._shutdownTask = [];
        this._modelChangeTransactionCounter = 0;
        this._modelChanges = [];
        this._private_namespaceIndex = 1;
        this._namespaceArray = [];
        this._constructNamespaceArray();
        AddressSpace.registry.register(this);
    }
    get rootFolder() {
        return this.findNode(this.resolveNodeId("RootFolder"));
    }
    static create() {
        return new AddressSpace();
    }
    /**
     * @internal
     */
    getDataTypeManager() {
        const addressSpacePriv = this;
        node_opcua_assert_1.assert(addressSpacePriv.$$extraDataTypeManager);
        return addressSpacePriv.$$extraDataTypeManager;
    }
    getNamespaceUri(namespaceIndex) {
        node_opcua_assert_1.assert(namespaceIndex >= 0 && namespaceIndex < this._namespaceArray.length);
        return this._namespaceArray[namespaceIndex].namespaceUri;
    }
    /***
     * @method getNamespace
     * @param {string|number} namespace index or namespace uri.
     * @return {NameSpace} the namespace
     */
    getNamespace(namespaceIndexOrName) {
        if (typeof namespaceIndexOrName === "number") {
            const namespaceIndex = namespaceIndexOrName;
            node_opcua_assert_1.assert(namespaceIndex >= 0 && namespaceIndex < this._namespaceArray.length, "invalid namespace index ( out of bound)");
            return this._namespaceArray[namespaceIndex];
        }
        else {
            const namespaceUri = namespaceIndexOrName;
            node_opcua_assert_1.assert(typeof namespaceUri === "string");
            const index = this.getNamespaceIndex(namespaceUri);
            return this._namespaceArray[index];
        }
    }
    /***
     * @method getDefaultNamespace
     * @return  the  default namespace (standard OPCUA namespace)
     */
    getDefaultNamespace() {
        return this.getNamespace(0);
    }
    /***
     * @method getOwnNamespace
     *
     * objects instances managed by the server will be created in this namespace.
     *
     * @return  address space own namespace
     */
    getOwnNamespace() {
        /* istanbul ignore next */
        if (this._private_namespaceIndex >= this._namespaceArray.length) {
            throw new Error("please create the private namespace");
        }
        return this.getNamespace(this._private_namespaceIndex);
    }
    /**
     * @method getNamespaceIndex
     * @param namespaceUri
     * @return the namespace index of a namespace given by its namespace uri
     *
     */
    getNamespaceIndex(namespaceUri) {
        node_opcua_assert_1.assert(typeof namespaceUri === "string");
        return this._namespaceArray.findIndex((ns) => ns.namespaceUri === namespaceUri);
    }
    /**
     * @method registerNamespace
     *
     * register a new namespace
     *
     * @param namespaceUri {string}
     * @returns {Namespace}
     */
    registerNamespace(namespaceUri) {
        let index = this._namespaceArray.findIndex((ns) => ns.namespaceUri === namespaceUri);
        if (index !== -1) {
            node_opcua_assert_1.assert(this._namespaceArray[index].addressSpace === this);
            return this._namespaceArray[index];
        }
        index = this._namespaceArray.length;
        this._namespaceArray.push(new namespace_1.UANamespace({
            addressSpace: this,
            index,
            namespaceUri,
            publicationDate: new Date(),
            version: "undefined"
        }));
        return this._namespaceArray[index];
    }
    /***
     * @method getNamespaceArray
     * @return {Namespace[]} the namespace array
     */
    getNamespaceArray() {
        return this._namespaceArray;
    }
    /**
     *
     * @method addAlias
     * @param alias {String} the alias name
     * @param nodeId {NodeId}
     * @internal
     */
    addAlias(alias, nodeId) {
        node_opcua_assert_1.assert(typeof alias === "string");
        node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_1.NodeId);
        this.getNamespace(nodeId.namespace).addAlias(alias, nodeId);
    }
    /**
     * find an node by node Id
     * @method findNode
     * @param nodeId   a nodeId or a string coerce-able to nodeID, representing the object to find.
     * @return {BaseNode|null}
     */
    findNode(nodeId) {
        nodeId = this.resolveNodeId(nodeId);
        node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_1.NodeId);
        if (nodeId.namespace < 0 || nodeId.namespace >= this._namespaceArray.length) {
            // namespace index is out of bound
            return null;
        }
        const namespace = this.getNamespace(nodeId.namespace);
        return namespace.findNode(nodeId);
    }
    findMethod(nodeId) {
        const node = this.findNode(nodeId);
        node_opcua_assert_1.assert(node instanceof ua_method_1.UAMethod);
        return node;
    }
    /**
     * resolved a string or a nodeId to a nodeID
     */
    resolveNodeId(nodeId) {
        if (typeof nodeId === "string") {
            const m = nodeId.match(regexNumberColumnString);
            if (m && m.length === 3) {
                const namespaceIndex = parseInt(m[1], 10);
                const aliasName = m[2];
                const namespace = this.getNamespace(namespaceIndex);
                // check if the string is a known alias
                const aliasNodeId = namespace.resolveAlias(aliasName);
                if (aliasNodeId !== null) {
                    return aliasNodeId;
                }
            }
        }
        return node_opcua_nodeid_1.resolveNodeId(nodeId);
    }
    /**
     *
     * @method findObjectType
     * @param objectType  {String|NodeId|QualifiedName}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {UAObjectType|null}
     *
     * @example
     *
     *     const objectType = addressSpace.findObjectType("ns=0;i=58");
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType("BaseObjectType");
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType(resolveNodeId("ns=0;i=58"));
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType("CustomObjectType",36);
     *     objectType.nodeId.namespace.should.eql(36);
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     *
     *     const objectType = addressSpace.findObjectType("36:CustomObjectType");
     *     objectType.nodeId.namespace.should.eql(36);
     *     objectType.browseName.toString().should.eql("BaseObjectType");
     */
    findObjectType(objectType, namespaceIndex) {
        if (objectType instanceof node_opcua_nodeid_1.NodeId) {
            return _find_by_node_id(this, objectType, namespaceIndex);
        }
        const [namespace, browseName] = _extract_namespace_and_browse_name_as_string(this, objectType, namespaceIndex);
        return namespace.findObjectType(browseName);
    }
    /**
     * @method findVariableType
     * @param variableType  {String|NodeId}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {UAObjectType|null}
     *
     * @example
     *
     *     const objectType = addressSpace.findVariableType("ns=0;i=62");
     *     objectType.browseName.toString().should.eql("BaseVariableType");
     *
     *     const objectType = addressSpace.findVariableType("BaseVariableType");
     *     objectType.browseName.toString().should.eql("BaseVariableType");
     *
     *     const objectType = addressSpace.findVariableType(resolveNodeId("ns=0;i=62"));
     *     objectType.browseName.toString().should.eql("BaseVariableType");
     */
    findVariableType(variableType, namespaceIndex) {
        if (variableType instanceof node_opcua_nodeid_1.NodeId) {
            return _find_by_node_id(this, variableType, namespaceIndex);
        }
        const [namespace, browseName] = _extract_namespace_and_browse_name_as_string(this, variableType, namespaceIndex);
        return namespace.findVariableType(browseName);
    }
    /**
     * Find the DataType node from a NodeId or a browseName
     * @method findDataType
     * @param dataType {String|NodeId}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {DataType|null}
     *
     *
     * @example
     *
     *      const dataDouble = addressSpace.findDataType("Double");
     *
     *      const dataDouble = addressSpace.findDataType(resolveNodeId("ns=0;i=3"));
     */
    findDataType(dataType, namespaceIndex) {
        // startingNode i=24  :
        // BaseDataType
        // +-> Boolean (i=1) {BooleanDataType (ns=2:9898)
        // +-> String (i=12)
        //     +->NumericRange
        //     +->Time
        // +-> DateTime
        // +-> Structure
        //       +-> Node
        //            +-> ObjectNode
        if (dataType instanceof node_opcua_nodeid_1.NodeId) {
            return _find_by_node_id(this, dataType, namespaceIndex);
        }
        if (typeof dataType === "number") {
            if (node_opcua_variant_1.DataType[dataType] !== undefined) {
                dataType = node_opcua_variant_1.DataType[dataType];
            }
            else {
                return this.findDataType(node_opcua_nodeid_1.resolveNodeId(dataType));
            }
        }
        const res = _extract_namespace_and_browse_name_as_string(this, dataType, namespaceIndex);
        const namespace = res[0];
        const browseName = res[1];
        return namespace.findDataType(browseName);
    }
    /**
     * @method findCorrespondingBasicDataType
     *
     * @example
     *
     *     const dataType = addressSpace.findDataType("ns=0;i=12");
     *     addressSpace.findCorrespondingBasicDataType(dataType).should.eql(DataType.String);
     *
     *     const dataType = addressSpace.findDataType("ServerStatusDataType"); // ServerStatus
     *     addressSpace.findCorrespondingBasicDataType(dataType).should.eql(DataType.ExtensionObject);
     *
     */
    findCorrespondingBasicDataType(dataTypeNode) {
        if (typeof dataTypeNode === "string") {
            dataTypeNode = this.resolveNodeId(dataTypeNode);
        }
        if (dataTypeNode instanceof node_opcua_nodeid_1.NodeId) {
            const _orig_dataTypeNode = dataTypeNode;
            dataTypeNode = this.findDataType(dataTypeNode);
            /* istanbul ignore next */
            if (!dataTypeNode) {
                throw Error("cannot find dataTypeNode " + _orig_dataTypeNode.toString());
            }
        }
        /* istanbul ignore next */
        if (!(dataTypeNode instanceof ua_data_type_1.UADataType)) {
            throw new Error("Expecting a UADataType");
        }
        dataTypeNode = dataTypeNode;
        /* istanbul ignore next */
        if (typeof dataTypeNode.nodeId.value !== "number") {
            throw new Error("Internal Errror");
        }
        const id = dataTypeNode.nodeId.value;
        node_opcua_assert_1.assert(_.isFinite(id));
        const enumerationType = this.findDataType("Enumeration");
        if (node_opcua_nodeid_1.sameNodeId(enumerationType.nodeId, dataTypeNode.nodeId)) {
            return node_opcua_variant_1.DataType.Int32;
        }
        if (dataTypeNode.nodeId.namespace === 0 && node_opcua_variant_1.DataType[id]) {
            return id;
        }
        return this.findCorrespondingBasicDataType(dataTypeNode.subtypeOfObj);
    }
    /**
     * find a ReferenceType by its inverse name.
     * @method findReferenceTypeFromInverseName
     * @param inverseName  the inverse name of the ReferenceType to find
     * @deprecated
     */
    findReferenceTypeFromInverseName(inverseName) {
        return this.getDefaultNamespace().findReferenceTypeFromInverseName(inverseName);
    }
    /**
     * @method findReferenceType
     * @param refType {String|NodeId}
     * @param [namespaceIndex=0 {Number}] an optional namespace index
     * @return {ReferenceType|null}
     *
     * refType could be
     *    a string representing a nodeid       : e.g.    'i=9004' or ns=1;i=6030
     *    a string representing a browse name  : e.g     'HasTypeDefinition'
     *      in this case it should be in the alias list
     *
     */
    findReferenceType(refType, namespaceIndex) {
        // startingNode ns=0;i=31 : References
        //  References i=31
        //  +->(hasSubtype) NonHierarchicalReferences
        //                  +->(hasSubtype) HasTypeDefinition
        //  +->(hasSubtype) HierarchicalReferences
        //                  +->(hasSubtype) HasChild/ChildOf
        //                                  +->(hasSubtype) Aggregates/AggregatedBy
        //                                                  +-> HasProperty/PropertyOf
        //                                                  +-> HasComponent/ComponentOf
        //                                                  +-> HasHistoricalConfiguration/HistoricalConfigurationOf
        //                                 +->(hasSubtype) HasSubtype/HasSupertype
        //                  +->(hasSubtype) Organizes/OrganizedBy
        //                  +->(hasSubtype) HasEventSource/EventSourceOf
        let node;
        if (isNodeIdString(refType) || typeof refType === "number") {
            refType = node_opcua_nodeid_1.resolveNodeId(refType);
        }
        if (refType instanceof node_opcua_nodeid_1.NodeId) {
            node = this.findNode(refType);
            /* istanbul ignore next */
            if (!(node && (node.nodeClass === node_opcua_data_model_1.NodeClass.ReferenceType))) {
                // throw new Error("cannot resolve referenceId "+ refType.toString());
                return null;
            }
        }
        else {
            node_opcua_assert_1.assert(_.isString(refType));
            node = this._findReferenceType(refType, namespaceIndex);
        }
        return node;
    }
    /**
     * returns the inverse name of the referenceType.
     *
     * @method inverseReferenceType
     * @param referenceType {String} : the reference type name
     * @return {String} the name of the inverse reference type.
     *
     * @example
     *
     *    ```javascript
     *    addressSpace.inverseReferenceType("OrganizedBy").should.eql("Organizes");
     *    addressSpace.inverseReferenceType("Organizes").should.eql("OrganizedBy");
     *    ```
     *
     */
    inverseReferenceType(referenceType) {
        node_opcua_assert_1.assert(typeof referenceType === "string");
        const n1 = this.findReferenceType(referenceType);
        const n2 = this.findReferenceTypeFromInverseName(referenceType);
        if (n1) {
            node_opcua_assert_1.assert(!n2);
            return n1.inverseName.text;
        }
        else {
            node_opcua_assert_1.assert(n2);
            return n2.browseName.toString();
        }
    }
    /**
     * find an EventType node in the address space
     * @method findEventType
     * @param eventTypeId {String|NodeId|UAObjectType} the eventType to find
     * @param namespaceIndex the namespace index of the event to find
     * @return {UAObjectType|null} the EventType found or null.
     *
     * note:
     *    - the method with throw an exception if a node is found
     *      that is not a BaseEventType or a subtype of it.
     *
     * @example
     *
     *     var evtType = addressSpace.findEventType("AuditEventType");
     *
     */
    findEventType(eventTypeId, namespaceIndex) {
        let eventType;
        if (eventTypeId instanceof base_node_1.BaseNode) {
            eventType = eventTypeId;
        }
        else {
            eventType = this.findObjectType(eventTypeId, namespaceIndex);
        }
        if (!eventType) {
            return null;
        }
        const baseEventType = this.findObjectType("BaseEventType");
        /* istanbul ignore next */
        if (!baseEventType) {
            throw new Error("expecting BaseEventType - please check you nodeset xml file!");
        }
        if (node_opcua_nodeid_1.sameNodeId(eventType.nodeId, baseEventType.nodeId)) {
            return eventType;
        }
        /* eventTypeNode should be isSupertypeOf("BaseEventType"); */
        /* istanbul ignore next */
        if (!eventType.isSupertypeOf(baseEventType)) {
            throw new Error("findEventType: event found is not subType of BaseEventType");
        }
        return eventType;
    }
    /**
     * EventId is generated by the Server to uniquely identify a particular Event Notification.
     * @method generateEventId
     * @return {Variant}  dataType: "ByteString"
     */
    generateEventId() {
        /*
         * OpcUA 1.02 part 5 : 6.4.2 BaseEventType
         * The Server is responsible to ensure that each Event has its unique EventId.
         * It may do this, for example, by putting GUIDs into the ByteString.
         * Clients can use the EventId to assist in minimizing or eliminating gaps and overlaps that may occur during
         * a redundancy fail-over. The EventId shall always be returned as value and the Server is not allowed to
         * return a StatusCode for the EventId indicating an error.
         *
         */
        const offset = 16;
        const self = this;
        if (!self._eventIdCounter) {
            self._eventIdCounter = require("crypto").randomBytes(20);
            self._eventIdCounter.writeInt32BE(0, offset);
        }
        self._eventIdCounter.writeInt32BE(self._eventIdCounter.readInt32BE(offset) + 1, offset);
        return new node_opcua_variant_1.Variant({
            dataType: "ByteString",
            value: Buffer.from(self._eventIdCounter)
        });
    }
    /*=
     * construct a simple javascript object with all the default properties of the event
     * @method constructEventData
     *
     * @return result.$eventDataSource {BaseNode} the event type node
     * @return result.eventId {NodeId} the
     * ...
     *
     *
     * eventTypeId can be a UAObjectType deriving from EventType
     * or an instance of a ConditionType
     *
     * @private
     */
    constructEventData(eventTypeId, data) {
        const addressSpace = this;
        data = data || {};
        // construct the reference dataStructure to store event Data
        let eventTypeNode = eventTypeId;
        if (eventTypeId instanceof ua_object_type_1.UAObjectType) {
            eventTypeNode = addressSpace.findEventType(eventTypeId);
        }
        /* istanbul ignore next */
        if (!eventTypeNode) {
            throw new Error(" cannot find EvenType for " + eventTypeId);
        }
        node_opcua_assert_1.assert(eventTypeNode instanceof ua_object_type_1.UAObjectType, "eventTypeId must represent a UAObjectType");
        // eventId
        node_opcua_assert_1.assert(data.hasOwnProperty, "eventId constructEventData : options object should not have eventId property");
        data.eventId = data.eventId || addressSpace.generateEventId();
        // eventType
        data.eventType = { dataType: node_opcua_variant_1.DataType.NodeId, value: eventTypeNode.nodeId };
        // sourceNode
        node_opcua_assert_1.assert(data.hasOwnProperty("sourceNode"), "expecting a source node to be defined");
        data.sourceNode = new node_opcua_variant_1.Variant(data.sourceNode);
        node_opcua_assert_1.assert(data.sourceNode.dataType === node_opcua_variant_1.DataType.NodeId);
        // sourceName
        const sourceNode = addressSpace.findNode(data.sourceNode.value);
        data.sourceName = data.sourceName || {
            dataType: node_opcua_variant_1.DataType.String,
            value: sourceNode.getDisplayName("en")
        };
        const nowUTC = (new Date());
        // time (UtcTime)
        // TODO
        data.time = data.time || { dataType: node_opcua_variant_1.DataType.DateTime, value: nowUTC };
        // receivedTime  (UtcTime)
        // TODO
        data.receiveTime = data.receiveTime || { dataType: node_opcua_variant_1.DataType.DateTime, value: nowUTC };
        // localTime  (UtcTime)
        // TODO
        data.localTime = data.localTime || { dataType: node_opcua_variant_1.DataType.DateTime, value: nowUTC };
        // message  (LocalizedText)
        data.message = data.message || { dataType: node_opcua_variant_1.DataType.LocalizedText, value: { text: "" } };
        // severity  (UInt16)
        data.severity = data.severity || { dataType: node_opcua_variant_1.DataType.UInt16, value: 0 };
        // xx // reminder : event type cannot be instantiated directly !
        // xx assert(eventTypeNode.isAbstract);
        const baseObjectType = addressSpace.findObjectType("BaseObjectType"); // i=58
        /* istanbul ignore next */
        if (!baseObjectType) {
            throw new Error("BaseObjectType must be defined in the address space");
        }
        const visitedProperties = {};
        function _process_var(self, prefix, node) {
            const lowerName = prefix + node_opcua_utils_1.lowerFirstLetter(node.browseName.name);
            // istanbul ignore next
            // xx if (doDebug) { debugLog("      " + lowerName.toString()); }
            visitedProperties[lowerName] = node;
            if (data.hasOwnProperty(lowerName)) {
                eventData.setValue(lowerName, node, data[lowerName]);
                // xx eventData[lowerName] = _coerceVariant(data[lowerName]);
            }
            else {
                // add a property , but with a null variant
                eventData.setValue(lowerName, node, { dataType: node_opcua_variant_1.DataType.Null });
                if (doDebug) {
                    if (node.modellingRule === "Mandatory") {
                        // tslint:disable:no-console
                        console.log(chalk_1.default.red("ERROR : AddressSpace#constructEventData(eventType,options) " +
                            "cannot find property ")
                            + self.browseName.toString() + " => " + chalk_1.default.cyan(lowerName));
                    }
                    else {
                        console.log(chalk_1.default.yellow("Warning : AddressSpace#constructEventData(eventType,options)" +
                            " cannot find property ")
                            + self.browseName.toString() + " => " + chalk_1.default.cyan(lowerName));
                    }
                }
            }
        }
        // verify that all elements of data are valid
        function verify_data_is_valid(data1) {
            Object.keys(data1).map((k) => {
                if (k === "$eventDataSource") {
                    return;
                }
                /* istanbul ignore next */
                if (!visitedProperties.hasOwnProperty(k)) {
                    throw new Error(" cannot find property '" + k + "' in [ "
                        + Object.keys(visitedProperties).join(", ") + "] when filling " +
                        eventTypeNode.browseName.toString());
                }
            });
        }
        function populate_data(self, eventData1) {
            if (node_opcua_nodeid_1.sameNodeId(baseObjectType.nodeId, self.nodeId)) {
                return; // nothing to do
            }
            const baseTypeNodeId = self.subtypeOf;
            /* istanbul ignore next */
            if (!baseTypeNodeId) {
                throw new Error("Object " + self.browseName.toString() +
                    " with nodeId " + self.nodeId + " has no Type");
            }
            const baseType = addressSpace.findNode(baseTypeNodeId);
            /* istanbul ignore next */
            if (!baseType) {
                throw new Error(chalk_1.default.red("Cannot find object with nodeId ") + baseTypeNodeId);
            }
            populate_data(baseType, eventData1);
            // get properties and components from base class
            const properties = self.getProperties();
            const components = self.getComponents();
            const children = [].concat(properties, components);
            // istanbul ignore next
            if (doDebug) {
                console.log(" " + chalk_1.default.bgWhite.cyan(self.browseName.toString()));
            }
            for (const node of children) {
                // only keep those that have a "HasModellingRule"
                if (!node.modellingRule) {
                    // xx console.log(" skipping node without modelling rule", node.browseName.toString());
                    continue;
                }
                // ignore also methods
                if (node.nodeClass === node_opcua_data_model_1.NodeClass.Method) {
                    // xx console.log(" skipping method ", node.browseName.toString());
                    continue;
                }
                _process_var(self, "", node);
                // also store value in index
                // xx eventData.__nodes[node.nodeId.toString()] = eventData[lowerName];
                const children2 = node.getAggregates();
                if (children2.length > 0) {
                    const lowerName = node_opcua_utils_1.lowerFirstLetter(node.browseName.name);
                    //  console.log(" Children to visit = ",lowerName,
                    //  children.map(function(a){ return a.browseName.toString();}).join(" "));
                    for (const child2 of children2) {
                        _process_var(self, lowerName + ".", child2);
                    }
                }
            }
        }
        const eventData = new event_data_1.EventData(eventTypeNode);
        // verify standard properties...
        populate_data(eventTypeNode, eventData);
        verify_data_is_valid(data);
        return eventData;
    }
    // - Browse --------------------------------------------------------------------------------------------------------
    /**
     * browse some path.
     *
     * @method browsePath
     * @param  {BrowsePath} browsePath
     * @return {BrowsePathResult}
     *
     * This service can be used translates one or more browse paths into NodeIds.
     * A browse path is constructed of a starting Node and a RelativePath. The specified starting Node
     * identifies the Node from which the RelativePath is based. The RelativePath contains a sequence of
     * ReferenceTypes and BrowseNames.
     *
     *   |StatusCode                    |                                                            |
     *   |------------------------------|:-----------------------------------------------------------|
     *   |BadNodeIdUnknown              |                                                            |
     *   |BadNodeIdInvalid              |                                                            |
     *   |BadNothingToDo                | - the relative path contains an empty list )               |
     *   |BadBrowseNameInvalid          | - target name is missing in relative path                  |
     *   |UncertainReferenceOutOfServer | - The path element has targets which are in another server.|
     *   |BadTooManyMatches             |                                                            |
     *   |BadQueryTooComplex            |                                                            |
     *   |BadNoMatch                    |                                                            |
     *
     *
     *
     */
    browsePath(browsePath) {
        node_opcua_assert_1.assert(browsePath instanceof node_opcua_types_1.BrowsePath);
        const startingNode = this.findNode(browsePath.startingNode);
        if (!startingNode) {
            return new node_opcua_types_1.BrowsePathResult({ statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdUnknown });
        }
        if (!browsePath.relativePath.elements || browsePath.relativePath.elements.length === 0) {
            return new node_opcua_types_1.BrowsePathResult({
                statusCode: node_opcua_status_code_1.StatusCodes.BadNothingToDo,
                targets: []
            });
        }
        const elements_length = browsePath.relativePath.elements.length;
        // -------------------------------------------------------------------------------------------------------
        // verify standard RelativePath construction
        //   from OPCUA 1.03 - PArt 3 - 7.6 RelativePath:
        //   TargetName  The BrowseName of the target node.
        //               The final element may have an empty targetName. In this situation all targets of the
        //               references identified by the referenceTypeId are the targets of the RelativePath.
        //               The targetName shall be specified for all other elements.
        //               The current path cannot be followed any further if no targets with the specified
        //               BrowseName exist.
        //   Let's detect null targetName which are not in last position and return BadBrowseNameInvalid if not
        //
        const empty_targetName_not_in_lastPos = browsePath.relativePath.elements.reduce((prev, e, index) => {
            const is_last = ((index + 1) === elements_length);
            const isBad = (!is_last && (!e.targetName || e.targetName.isEmpty()));
            return prev + ((!is_last && (!e.targetName || e.targetName.isEmpty())) ? 1 : 0);
        }, 0);
        if (empty_targetName_not_in_lastPos) {
            return new node_opcua_types_1.BrowsePathResult({ statusCode: node_opcua_status_code_1.StatusCodes.BadBrowseNameInvalid });
        }
        // from OPCUA 1.03 - PArt 3 - 5.8.4 TranslateBrowsePathToNodeIds
        // TranslateBrowsePathToNodeIds further restrict RelativePath targetName rules:
        // The last element in the relativePath shall always have a targetName specified.
        const last_el = browsePath.relativePath.elements[elements_length - 1];
        if (!last_el.targetName || !last_el.targetName.name || last_el.targetName.name.length === 0) {
            return new node_opcua_types_1.BrowsePathResult({ statusCode: node_opcua_status_code_1.StatusCodes.BadBrowseNameInvalid });
        }
        const res = [];
        const explore_element = (curNodeObject, elements, index) => {
            const element = elements[index];
            node_opcua_assert_1.assert(element instanceof node_opcua_types_1.RelativePathElement);
            const is_last = ((index + 1) === elements.length);
            const nodeIds = curNodeObject.browseNodeByTargetName(element, is_last);
            const targets = nodeIds.map((nodeId) => {
                return {
                    remainingPathIndex: elements.length - index,
                    targetId: nodeId
                };
            });
            if (!is_last) {
                // explorer
                for (const target of targets) {
                    const node = this.findNode(target.targetId);
                    if (!node) {
                        continue;
                    }
                    explore_element(node, elements, index + 1);
                }
            }
            else {
                for (const target of targets) {
                    res.push({
                        remainingPathIndex: 0xFFFFFFFF,
                        targetId: node_opcua_nodeid_1.coerceExpandedNodeId(target.targetId)
                    });
                }
            }
        };
        explore_element(startingNode, browsePath.relativePath.elements, 0);
        if (res.length === 0) {
            return new node_opcua_types_1.BrowsePathResult({ statusCode: node_opcua_status_code_1.StatusCodes.BadNoMatch });
        }
        return new node_opcua_types_1.BrowsePathResult({
            statusCode: node_opcua_status_code_1.StatusCodes.Good,
            targets: res
        });
    }
    // - Extension Object ----------------------------------------------------------------------------------------------
    getExtensionObjectConstructor(dataType) {
        node_opcua_assert_1.assert(dataType, "expecting a dataType");
        if (dataType instanceof node_opcua_nodeid_1.NodeId) {
            const tmp = this.findNode(dataType);
            /* istanbul ignore next */
            if (!tmp) {
                throw new Error("getExtensionObjectConstructor: cannot resolve dataType " + dataType);
            }
            dataType = tmp;
        }
        /* istanbul ignore next */
        if (!(dataType instanceof ua_data_type_1.UADataType)) {
            // may be dataType was the NodeId of the "Binary Encoding" node
            throw new Error("getExtensionObjectConstructor: dataType has unexpected type" + dataType);
        }
        extension_object_array_node_1.prepareDataType(this, dataType);
        const Constructor = dataType._extensionObjectConstructor;
        return Constructor;
    }
    /**
     * @param dataType
     * @param [options]
     * @return the constructed extension object
     *
     *
     * @example
     *
     *             // example 1
     *             var extObj = addressSpace.constructExtensionObject("BuildInfo",{ productName: "PRODUCTNAME"});
     *
     *             // example 2
     *             serverStatusDataType.nodeClass.should.eql(NodeClass.DataType);
     *             serverStatusDataType.browseName.toString().should.eql("ServerStatusDataType");
     *             var serverStatus  = addressSpace.constructExtensionObject(serverStatusDataType);
     *             serverStatus.constructor.name.should.eql("ServerStatusDataType");
     */
    constructExtensionObject(dataType, options) {
        const Constructor = this.getExtensionObjectConstructor(dataType);
        return new Constructor(options);
    }
    /**
     * cleanup all resources maintained by this addressSpace.
     * @method dispose
     */
    dispose() {
        this._namespaceArray.map((namespace) => namespace.dispose());
        AddressSpace.registry.unregister(this);
        /* istanbul ignore next */
        if (this._shutdownTask && this._shutdownTask.length > 0) {
            throw new Error("AddressSpace#dispose : shutdown has not been called");
        }
    }
    /**
     * register a function that will be called when the server will perform its shut down.
     * @method registerShutdownTask
     */
    registerShutdownTask(task) {
        this._shutdownTask = this._shutdownTask || [];
        node_opcua_assert_1.assert(_.isFunction(task));
        this._shutdownTask.push(task);
    }
    shutdown() {
        if (!this._shutdownTask) {
            return;
        }
        // perform registerShutdownTask
        this._shutdownTask.forEach((task) => {
            task.call(this);
        });
        this._shutdownTask = [];
    }
    /**
     *
     * @method browseSingleNode
     * @param nodeId {NodeId|String} : the nodeid of the element to browse
     * @param browseDescription
     * @param browseDescription.browseDirection {BrowseDirection} :
     * @param browseDescription.referenceTypeId {String|NodeId}
     * @param [session]
     * @return {BrowseResult}
     */
    browseSingleNode(nodeId, browseDescription, context) {
        browseDescription = browseDescription || new node_opcua_types_1.BrowseDescription();
        browseDescription.browseDirection =
            source_1.adjustBrowseDirection(browseDescription.browseDirection, node_opcua_data_model_1.BrowseDirection.Forward);
        /* istanbul ignore next */
        if (typeof nodeId === "number") {
            throw new Error("Not Implemented");
        }
        if (typeof nodeId === "string") {
            const node = this.findNode(this.resolveNodeId(nodeId));
            if (node) {
                nodeId = node.nodeId;
            }
        }
        const browseResult = {
            continuationPoint: undefined,
            references: null,
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
        if (browseDescription.browseDirection === node_opcua_data_model_1.BrowseDirection.Invalid) {
            browseResult.statusCode = node_opcua_status_code_1.StatusCodes.BadBrowseDirectionInvalid;
            return new node_opcua_service_browse_1.BrowseResult(browseResult);
        }
        // check if referenceTypeId is correct
        if (browseDescription.referenceTypeId instanceof node_opcua_nodeid_1.NodeId) {
            if (browseDescription.referenceTypeId.value === 0) {
                browseDescription.referenceTypeId = null;
            }
            else {
                const rf = this.findNode(browseDescription.referenceTypeId);
                if (!rf || !(rf instanceof ua_reference_type_1.UAReferenceType)) {
                    browseResult.statusCode = node_opcua_status_code_1.StatusCodes.BadReferenceTypeIdInvalid;
                    return new node_opcua_service_browse_1.BrowseResult(browseResult);
                }
            }
        }
        const obj = this.findNode(nodeId);
        if (!obj) {
            // Object Not Found
            browseResult.statusCode = node_opcua_status_code_1.StatusCodes.BadNodeIdUnknown;
            // xx console.log("xxxxxx browsing ",nodeId.toString() , " not found" );
        }
        else {
            browseResult.statusCode = node_opcua_status_code_1.StatusCodes.Good;
            browseResult.references = obj.browseNode(browseDescription, context);
        }
        return new node_opcua_service_browse_1.BrowseResult(browseResult);
    }
    /**
     * @param folder
     * @private
     */
    _coerceFolder(folder) {
        folder = this._coerceNode(folder);
        /* istanbul ignore next */
        if (folder && !_isFolder(this, folder)) {
            throw new Error("Parent folder must be of FolderType " + folder.typeDefinition.toString());
        }
        return folder;
    }
    /**
     *
     * @param view
     * @param modelChange
     * @private
     */
    _collectModelChange(view, modelChange) {
        // xx console.log("in _collectModelChange", modelChange.verb, verbFlags.get(modelChange.verb).toString());
        this._modelChanges.push(modelChange);
    }
    /**
     *
     * walk up the hierarchy of objects until a view is found
     * objects may belong to multiples views.
     * Note: this method doesn't return the main view => Server object.
     * @method extractRootViews
     * @param node {BaseNode}
     * @return {BaseNode[]}
     */
    /**
     *
     * @param node
     * @private
     */
    extractRootViews(node) {
        const addressSpace = this;
        node_opcua_assert_1.assert(node.nodeClass === node_opcua_data_model_1.NodeClass.Object || node.nodeClass === node_opcua_data_model_1.NodeClass.Variable);
        const visitedMap = {};
        const q = new Dequeue();
        q.push(node);
        const objectsFolder = addressSpace.rootFolder.objects;
        node_opcua_assert_1.assert(objectsFolder instanceof ua_object_1.UAObject);
        const results = [];
        while (q.length) {
            node = q.shift();
            const references = node.findReferencesEx("HierarchicalReferences", node_opcua_data_model_1.BrowseDirection.Inverse);
            const parentNodes = references.map((r) => reference_1.Reference.resolveReferenceNode(addressSpace, r));
            for (const parent of parentNodes) {
                if (node_opcua_nodeid_1.sameNodeId(parent.nodeId, objectsFolder.nodeId)) {
                    continue; // nothing to do
                }
                if (parent.nodeClass === node_opcua_data_model_1.NodeClass.View) {
                    results.push(parent);
                }
                else {
                    const key = parent.nodeId.toString();
                    if (visitedMap.hasOwnProperty(key)) {
                        continue;
                    }
                    visitedMap[key] = parent;
                    q.push(parent);
                }
            }
        }
        return results;
    }
    /**
     *
     * @param func
     * @private
     */
    modelChangeTransaction(func) {
        const addressSpace = this;
        this._modelChangeTransactionCounter = this._modelChangeTransactionCounter || 0;
        function beginModelChange() {
            /* jshint validthis:true */
            node_opcua_assert_1.assert(this);
            this._modelChanges = this._modelChanges || [];
            node_opcua_assert_1.assert(this._modelChangeTransactionCounter >= 0);
            this._modelChangeTransactionCounter += 1;
        }
        function endModelChange() {
            /* jshint validthis:true */
            this._modelChangeTransactionCounter -= 1;
            if (this._modelChangeTransactionCounter === 0) {
                if (this._modelChanges.length === 0) {
                    return; // nothing to do
                }
                // xx console.log( "xx dealing with ",this._modelChanges.length);
                // increase version number of participating nodes
                const nodeIds = _.uniq(this._modelChanges.map((c) => c.affected));
                const nodes = nodeIds.map((nodeId) => addressSpace.findNode(nodeId));
                nodes.forEach(_increase_version_number);
                // raise events
                if (this.rootFolder.objects.server) {
                    const eventTypeNode = addressSpace.findEventType("GeneralModelChangeEventType");
                    if (eventTypeNode) {
                        // xx console.log("xx raising event on server object");
                        addressSpace.rootFolder.objects.server.raiseEvent(eventTypeNode, {
                            // Part 5 - 6.4.32 GeneralModelChangeEventType
                            changes: { dataType: "ExtensionObject", value: this._modelChanges }
                        });
                    }
                }
                this._modelChanges = [];
                // _notifyModelChange(this);
            }
        }
        beginModelChange.call(this);
        try {
            func();
        }
        catch (err) {
            throw err;
        }
        finally {
            endModelChange.call(this);
        }
    }
    /**
     * normalize the ReferenceType field of the Reference Object
     * @param params.referenceType  {String|nodeId}
     * @param params.isForward  {Boolean} default value: true;
     * @return {Object} a new reference object  with the normalized name { referenceType: <value>, isForward: <flag>}
     */
    normalizeReferenceType(params) {
        if (params instanceof reference_1.Reference) {
            // a reference has already been normalized
            return params;
        }
        // ----------------------------------------------- handle is forward
        node_opcua_assert_1.assert(params.isForward === undefined || typeof params.isForward === "boolean");
        params.isForward = utils.isNullOrUndefined(params.isForward) ? true : !!params.isForward;
        // referenceType = Organizes   , isForward = true =>   referenceType = Organizes , isForward = true
        // referenceType = Organizes   , isForward = false =>  referenceType = Organizes , isForward = false
        // referenceType = OrganizedBy , isForward = true =>   referenceType = Organizes , isForward = **false**
        // referenceType = OrganizedBy , isForward = false =>  referenceType = Organizes , isForward =  **true**
        // ----------------------------------------------- handle referenceType
        if (params.referenceType instanceof ua_reference_type_1.UAReferenceType) {
            params.referenceType = params.referenceType;
            params.referenceType = params.referenceType.nodeId;
        }
        else if (typeof params.referenceType === "string") {
            const inv = this.findReferenceTypeFromInverseName(params.referenceType);
            if (inv) {
                params.referenceType = inv.nodeId;
                params._referenceType = inv;
                params.isForward = !params.isForward;
            }
            else {
                params.referenceType = node_opcua_nodeid_1.resolveNodeId(params.referenceType);
                const refType = this.findReferenceType(params.referenceType);
                if (refType) {
                    params._referenceType = refType;
                }
            }
        }
        node_opcua_assert_1.assert(params.referenceType instanceof node_opcua_nodeid_1.NodeId);
        // ----------- now resolve target NodeId;
        if (params.nodeId instanceof base_node_1.BaseNode) {
            node_opcua_assert_1.assert(!params.hasOwnProperty("node"));
            params.node = params.nodeId;
            params.nodeId = params.node.nodeId;
        }
        else {
            let _nodeId = params.nodeId;
            node_opcua_assert_1.assert(!!_nodeId, "missing 'nodeId' in reference");
            if (_nodeId && _nodeId.nodeId) {
                _nodeId = _nodeId.nodeId;
            }
            _nodeId = node_opcua_nodeid_1.resolveNodeId(_nodeId);
            /* istanbul ignore next */
            if (!(_nodeId instanceof node_opcua_nodeid_1.NodeId) || _nodeId.isEmpty()) {
                // tslint:disable:no-console
                console.log("xx =>", JSON.stringify(params, null, " "));
                throw new Error(" Invalid reference nodeId " + _nodeId.toString());
            }
            params.nodeId = _nodeId;
        }
        return new reference_1.Reference(params);
    }
    /**
     *
     * @param references
     */
    normalizeReferenceTypes(references) {
        if (!references || references.length === 0) {
            return [];
        }
        references = references;
        node_opcua_assert_1.assert(_.isArray(references));
        return references.map((el) => this.normalizeReferenceType(el));
    }
    // -- Historycall Node  -----------------------------------------------------------------------------------------
    /**
     *
     * @param node
     * @param options
     */
    installHistoricalDataNode(node, options) {
        address_space_historical_data_node_1.AddressSpace_installHistoricalDataNode.call(this, node, options);
    }
    // -- Alarms & Conditions  -----------------------------------------------------------------------------------------
    /**
     *
     */
    installAlarmsAndConditionsService() {
        alarms_and_conditions_2.UAConditionBase.install_condition_refresh_handle(this);
        alarms_and_conditions_1.UAAcknowledgeableConditionBase.install_method_handle_on_type(this);
    }
    // -- internal stuff -----------------------------------------------------------------------------------------------
    _coerceNode(node) {
        function hasTypeDefinition(node1) {
            return node1.nodeClass === node_opcua_data_model_1.NodeClass.Variable ||
                node1.nodeClass === node_opcua_data_model_1.NodeClass.Object ||
                node1.nodeClass === node_opcua_data_model_1.NodeClass.Method;
        }
        // coerce to BaseNode object
        if (node instanceof base_node_1.BaseNode) {
            return node;
        }
        // it's a node id like
        // coerce parent folder to an object
        const returnValue = this.findNode(node_opcua_nodeid_1.resolveNodeId(node));
        /*
         if (!hasTypeDefinition(node as BaseNode)) {
             node = this.findNode(node.nodeId) || node;
             if (!node || !hasTypeDefinition(node)) {
                 return null;
             }
         }
         */
        return returnValue;
    }
    _coerce_DataType(dataType) {
        if (dataType instanceof node_opcua_nodeid_1.NodeId) {
            // xx assert(self.findDataType(dataType));
            return dataType;
        }
        return this._coerce_Type(dataType, node_opcua_constants_1.DataTypeIds, "DataTypeIds", AddressSpace.prototype.findDataType);
    }
    _coerceTypeDefinition(typeDefinition) {
        if (typeof typeDefinition === "string") {
            // coerce parent folder to an node
            const typeDefinitionNode = this.findNode(typeDefinition);
            typeDefinition = typeDefinitionNode.nodeId;
        }
        // xx console.log("typeDefinition = ",typeDefinition);
        node_opcua_assert_1.assert(typeDefinition instanceof node_opcua_nodeid_1.NodeId);
        return typeDefinition;
    }
    _coerceType(baseType, topMostBaseType, nodeClass) {
        node_opcua_assert_1.assert(typeof topMostBaseType === "string");
        const topMostBaseTypeNode = this.findNode(topMostBaseType);
        /* istanbul ignore next */
        if (!topMostBaseTypeNode) {
            throw new Error("Cannot find topMostBaseTypeNode " + topMostBaseType.toString());
        }
        node_opcua_assert_1.assert(topMostBaseTypeNode instanceof base_node_1.BaseNode);
        node_opcua_assert_1.assert(topMostBaseTypeNode.nodeClass === nodeClass);
        if (!baseType) {
            return topMostBaseTypeNode;
        }
        node_opcua_assert_1.assert(typeof baseType === "string" || baseType instanceof base_node_1.BaseNode);
        let baseTypeNode;
        if (baseType instanceof base_node_1.BaseNode) {
            baseTypeNode = baseType;
        }
        else {
            baseTypeNode = this.findNode(baseType);
        }
        /* istanbul ignore next*/
        if (!baseTypeNode) {
            throw new Error("Cannot find ObjectType or VariableType for " + baseType.toString());
        }
        /* istanbul ignore next */
        if (!baseTypeNode.isSupertypeOf) {
            throw new Error("Cannot find ObjectType or VariableType for " + baseType.toString());
        }
        /* istanbul ignore next */
        if (!baseTypeNode.isSupertypeOf(topMostBaseTypeNode)) {
            throw new Error("wrong type ");
        }
        return baseTypeNode;
    }
    _coerce_VariableTypeIds(dataType) {
        return this._coerce_Type(dataType, node_opcua_constants_1.VariableTypeIds, "VariableTypeIds", AddressSpace.prototype.findVariableType);
    }
    _register(node) {
        node_opcua_assert_1.assert(node.nodeId instanceof node_opcua_nodeid_1.NodeId);
        const namespace = this.getNamespace(node.nodeId.namespace);
        namespace._register(node);
    }
    deleteNode(nodeOrNodeId) {
        _getNamespace(this, nodeOrNodeId).deleteNode(nodeOrNodeId);
    }
    _coerce_Type(dataType, typeMap, typeMapName, finderMethod) {
        if (dataType instanceof base_node_1.BaseNode) {
            dataType = dataType.nodeId;
        }
        node_opcua_assert_1.assert(_.isObject(typeMap));
        let nodeId;
        if (typeof dataType === "string") {
            const namespace0 = this.getDefaultNamespace();
            // resolve dataType
            nodeId = namespace0.resolveAlias(dataType);
            if (!nodeId) {
                // dataType was not found in the aliases database
                if (typeMap[dataType]) {
                    nodeId = node_opcua_nodeid_1.makeNodeId(typeMap[dataType], 0);
                    return nodeId;
                }
                else {
                    nodeId = node_opcua_nodeid_1.resolveNodeId(dataType);
                }
            }
        }
        else if (typeof dataType === "number") {
            nodeId = node_opcua_nodeid_1.makeNodeId(dataType, 0);
        }
        else {
            nodeId = node_opcua_nodeid_1.resolveNodeId(dataType);
        }
        /* istanbul ignore next */
        if (nodeId == null || !(nodeId instanceof node_opcua_nodeid_1.NodeId)) {
            throw new Error("Expecting valid nodeId ");
        }
        const el = finderMethod.call(this, nodeId);
        if (!el) {
            // verify that node Id exists in standard type map typeMap
            const find = _.filter(typeMap, (a) => a === nodeId.value);
            /* istanbul ignore next */
            if (find.length !== 1) {
                throw new Error(" cannot find " + dataType.toString() +
                    " in typeMap " + typeMapName + " L = " + find.length);
            }
        }
        return nodeId;
    }
    _constructNamespaceArray() {
        if (this._namespaceArray.length === 0) {
            this.registerNamespace("http://opcfoundation.org/UA/");
        }
    }
    _findReferenceType(refType, namespaceIndex) {
        if (refType instanceof node_opcua_nodeid_1.NodeId) {
            return _find_by_node_id(this, refType, namespaceIndex);
        }
        const [namespace, browseName] = _extract_namespace_and_browse_name_as_string(this, refType, namespaceIndex);
        return namespace.findReferenceType(browseName);
    }
    _build_new_NodeId() {
        /* istanbul ignore next */
        if (this._namespaceArray.length <= 1) {
            throw new Error("Please create a private namespace");
        }
        const privateNamespace = this.getOwnNamespace();
        return privateNamespace._build_new_NodeId();
    }
    _resolveRequestedNamespace(options) {
        if (!options.nodeId) {
            return this.getOwnNamespace();
        }
        if (typeof options.nodeId === "string") {
            if (options.nodeId.match(/^(i|s|g|b)=/)) {
                options.nodeId = this.getOwnNamespace()._construct_nodeId(options);
            }
        }
        options.nodeId = node_opcua_nodeid_1.resolveNodeId(options.nodeId);
        return this.getNamespace(options.nodeId.namespace);
    }
}
exports.AddressSpace = AddressSpace;
AddressSpace.isNonEmptyQualifiedName = namespace_2.isNonEmptyQualifiedName;
AddressSpace.registry = new node_opcua_object_registry_1.ObjectRegistry();
function _getNamespace(addressSpace, nodeOrNodId) {
    const nodeId = (nodeOrNodId instanceof base_node_1.BaseNode) ? nodeOrNodId.nodeId : nodeOrNodId;
    return addressSpace.getNamespace(nodeId.namespace);
}
function _find_by_node_id(addressSpace, nodeId, namespaceIndex) {
    node_opcua_assert_1.assert(nodeId instanceof node_opcua_nodeid_1.NodeId);
    const obj = addressSpace.findNode(nodeId);
    return obj;
}
/**
 * return true if nodeId is a Folder
 * @method _isFolder
 * @param addressSpace
 * @param folder
 * @return {Boolean}
 * @private
 */
function _isFolder(addressSpace, folder) {
    const folderType = addressSpace.findObjectType("FolderType");
    node_opcua_assert_1.assert(folder instanceof base_node_1.BaseNode);
    node_opcua_assert_1.assert(folder.typeDefinitionObj);
    return folder.typeDefinitionObj.isSupertypeOf(folderType);
}
function _increase_version_number(node) {
    if (node && node.nodeVersion) {
        const previousValue = parseInt(node.nodeVersion.readValue().value.value, 10);
        node.nodeVersion.setValueFromSource({ dataType: "String", value: (previousValue + 1).toString() });
        // xx console.log("xxx increasing version number of node ", node.browseName.toString(),previousValue);
    }
}
/*
// xx require("./address_space_add_event_type").install(AddressSpace);
// xx require("./address_space_browse").install(AddressSpace);
if (false) {

    require("./address_space_construct_extension_object").install(AddressSpace);
    require("./ua_two_state_variable").install(AddressSpace);

// State Machines
    require("./state_machine/address_space_state_machine").install(AddressSpace);

// DI
    require("./address_space_add_enumeration_type").install(AddressSpace);

    require("./data_access/address_space_add_AnalogItem").install(AddressSpace);
    require("./data_access/address_space_add_MultiStateDiscrete").install(AddressSpace);
    require("./data_access/address_space_add_TwoStateDiscrete").install(AddressSpace);
    require("./data_access/address_space_add_MultiStateValueDiscrete").install(AddressSpace);
    require("./data_access/address_space_add_YArrayItem").install(AddressSpace);

    require("./historical_access/address_space_historical_data_node").install(AddressSpace);

//
// Alarms & Conditions
//
    require("./alarms_and_conditions/install").install(AddressSpace);

}
*/
//# sourceMappingURL=address_space.js.map