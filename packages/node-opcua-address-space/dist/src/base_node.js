"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const chalk_1 = require("chalk");
const events_1 = require("events");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const utils = require("node-opcua-utils");
const node_opcua_utils_1 = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const source_1 = require("../source");
const cetools = require("./address_space_change_event_tools");
const base_node_private_1 = require("./base_node_private");
const reference_1 = require("./reference");
// tslint:disable:no-var-requires
// tslint:disable:no-bitwise
// tslint:disable:no-console
require("object.values");
const doDebug = false;
function defaultBrowseFilterFunc(context) {
    return true;
}
function _get_QualifiedBrowseName(browseName) {
    return node_opcua_data_model_1.coerceQualifiedName(browseName);
}
function _is_valid_BrowseDirection(browseDirection) {
    return browseDirection === node_opcua_data_model_1.BrowseDirection.Forward ||
        browseDirection === node_opcua_data_model_1.BrowseDirection.Inverse ||
        browseDirection === node_opcua_data_model_1.BrowseDirection.Both;
}
function makeAttributeEventName(attributeId) {
    const attributeName = node_opcua_data_model_1.attributeNameById[attributeId];
    return attributeName + "_changed";
}
exports.makeAttributeEventName = makeAttributeEventName;
/**
 * Base class for all Node classes
 *
 * BaseNode is the base class for all the OPCUA objects in the address space
 * It provides attributes and a set of references to other nodes.
 * see:
 * {{#crossLink "UAObject"}}{{/crossLink}},
 * {{#crossLink "UAVariable"}}{{/crossLink}},
 * {{#crossLink "Reference"}}{{/crossLink}},
 * {{#crossLink "UAMethod"}}{{/crossLink}},
 * {{#crossLink "UAView"}}{{/crossLink}},
 * {{#crossLink "UAObjecType"}}{{/crossLink}},
 * {{#crossLink "UADataType"}}{{/crossLink}},
 * {{#crossLink "UAVariableType"}}{{/crossLink}},
 *
 *
 */
class BaseNode extends events_1.EventEmitter {
    /**
     * @internal
     * @param options
     */
    constructor(options) {
        super();
        this.nodeClass = node_opcua_data_model_1.NodeClass.Unspecified;
        const _private = base_node_private_1.BaseNode_initPrivate(this);
        node_opcua_assert_1.assert(this.nodeClass === node_opcua_data_model_1.NodeClass.Unspecified, "must not be specify a nodeClass");
        node_opcua_assert_1.assert(options.addressSpace); // expecting an address space
        node_opcua_assert_1.assert(options.browseName instanceof node_opcua_data_model_1.QualifiedName, "Expecting a valid QualifiedName");
        node_opcua_assert_1.assert(options.nodeId instanceof node_opcua_nodeid_1.NodeId, "Expecting a valid NodeId");
        options.references = options.references || [];
        _private.__address_space = options.addressSpace;
        this.nodeId = node_opcua_nodeid_1.resolveNodeId(options.nodeId);
        // QualifiedName
        /**
         * the node browseName
         * @property browseName
         * @type QualifiedName
         * @static
         */
        this.browseName = _get_QualifiedBrowseName(options.browseName);
        // re-use browseName as displayName if displayName is missing
        options.displayName = options.displayName || this.browseName.name.toString();
        if (options.description === undefined) {
            options.description = null;
        }
        this._setDisplayName(options.displayName);
        this._setDescription(options.description);
        // user defined filter function for browsing
        const _browseFilter = options.browseFilter || defaultBrowseFilterFunc;
        node_opcua_assert_1.assert(_.isFunction(_browseFilter));
        _private._browseFilter = _browseFilter;
        // normalize reference type
        // this will convert any referenceType expressed with its inverseName into
        // its normal name and fix the isForward flag accordingly.
        // ( e.g "ComponentOf" isForward:true => "HasComponent", isForward:false)
        for (const reference of options.references) {
            this.__addReference(reference);
        }
    }
    get addressSpace() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private) {
            throw new Error("Internal error , cannot extract private data from " +
                this.browseName.toString());
        }
        return _private.__address_space;
    }
    get displayName() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        return _private._displayName;
    }
    set displayName(value) {
        this._setDisplayName(value);
        /**
         * fires when the displayName is changed.
         * @event DisplayName_changed
         * @param dataValue {DataValue}
         */
        this._notifyAttributeChange(node_opcua_data_model_1.AttributeIds.DisplayName);
    }
    get description() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        return _private._description;
    }
    set description(value) {
        this._setDescription(value);
        /**
         * fires when the description attribute is changed.
         * @event Description_changed
         * @param dataValue {DataValue}
         */
        this._notifyAttributeChange(node_opcua_data_model_1.AttributeIds.Description);
    }
    /**
     * returns the nodeId of this node's Type Definition
     */
    get typeDefinition() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache.typeDefinition) {
            const has_type_definition_ref = this.findReference("HasTypeDefinition", true);
            _private._cache.typeDefinition = has_type_definition_ref ? has_type_definition_ref.nodeId : null;
        }
        return _private._cache.typeDefinition;
    }
    /**
     * returns the nodeId of this node's Type Definition
     */
    get typeDefinitionObj() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (undefined === _private._cache.typeDefinitionObj) {
            const nodeId = this.typeDefinition;
            _private._cache.typeDefinitionObj = nodeId ? this.addressSpace.findNode(nodeId) : null;
        }
        return _private._cache.typeDefinitionObj;
    }
    get parentNodeId() {
        const parent = this.parent;
        return parent ? parent.nodeId : undefined;
    }
    /**
     * namespace index
     */
    get namespaceIndex() {
        return this.nodeId.namespace;
    }
    /**
     * namespace uri
     */
    get namespaceUri() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache.namespaceUri) {
            _private._cache.namespaceUri = this.addressSpace.getNamespaceUri(this.namespaceIndex);
        }
        return _private._cache.namespaceUri;
    }
    /**
     * the parent node
     */
    get parent() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (_private._parent === undefined) {
            // never been set before
            _private._parent = _setup_parent_item.call(this, _private._referenceIdx);
        }
        return _private._parent || null;
    }
    /**
     * @property modellingRule
     * @type {String|undefined}
     */
    get modellingRule() {
        const node = this;
        const r = node.findReferencesAsObject("HasModellingRule");
        if (!r || r.length === 0) {
            return null; /// "? modellingRule missing ?"; // consider "Mandatory"
        }
        const r0 = r[0];
        return r0.browseName.toString();
    }
    static makeAttributeEventName(attributeId) {
        return makeAttributeEventName(attributeId);
    }
    static _getCache(baseNode) {
        const _private = base_node_private_1.BaseNode_getPrivate(baseNode);
        return _private._cache;
    }
    getDisplayName(locale) {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        return _private._displayName[0].text;
    }
    get namespace() {
        return this.addressSpace.getNamespace(this.nodeId.namespace);
    }
    // ---------------------------------------------------------------------------------------------------
    // Finders
    // ---------------------------------------------------------------------------------------------------
    findReferencesEx(strReference, browseDirection) {
        browseDirection = browseDirection !== undefined ? browseDirection : node_opcua_data_model_1.BrowseDirection.Forward;
        node_opcua_assert_1.assert(_is_valid_BrowseDirection(browseDirection));
        node_opcua_assert_1.assert(browseDirection !== node_opcua_data_model_1.BrowseDirection.Both);
        let referenceType = null;
        if (typeof strReference === "string") {
            // xx strReference = strReference.browseName.toString();
            referenceType = this.addressSpace.findReferenceType(strReference);
            if (!referenceType) {
                throw new Error("Cannot resolve referenceType : " + strReference);
            }
        }
        else {
            referenceType = strReference;
        }
        if (!referenceType) {
            // note: when loading nodeset2.xml files, reference type may not exit yet
            // throw new Error("expecting valid reference name " + strReference);
            return [];
        }
        node_opcua_assert_1.assert(referenceType.nodeId instanceof node_opcua_nodeid_1.NodeId);
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        const hash = "_refEx_" + referenceType.nodeId.toString() + browseDirection.toString();
        if (_private._cache[hash]) {
            return _private._cache[hash];
        }
        // find a map of all types that derive from the provided reference type
        const keys = base_node_private_1.getSubtypeIndex.call(referenceType);
        const isForward = (browseDirection === node_opcua_data_model_1.BrowseDirection.Forward);
        const references = [];
        function process(referenceIdx) {
            const referenceTypes = _.values(referenceIdx);
            for (const ref of referenceTypes) {
                const h = ref.referenceType.toString();
                if (ref.isForward === isForward && keys[h]) {
                    node_opcua_assert_1.assert(ref._referenceType.browseName.toString());
                    references.push(ref);
                }
            }
        }
        process(_private._referenceIdx);
        process(_private._back_referenceIdx);
        _private._cache[hash] = references;
        return references;
    }
    // public findReferencesExDescription(
    //   strReference: string,
    //   browseDirection: BrowseDirection
    // ): any {
    //     const refs = this.findReferencesEx(strReference, browseDirection);
    //     const addressSpace = this.addressSpace;
    //     return refs.map((ref: Reference) => _makeReferenceDescription(addressSpace, ref, 0x3F));
    // }
    /**
     * @method findReferences
     * @param   referenceType {String|NodeId|ReferenceType} the referenceType as a string.
     * @param  [isForward]  default=true
     * @return an array with references
     */
    findReferences(referenceType, isForward) {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        isForward = utils.isNullOrUndefined(isForward) ? true : !!isForward;
        node_opcua_assert_1.assert(_.isBoolean(isForward));
        const referenceTypeNode = this._coerceReferenceType(referenceType);
        const hash = "_ref_" + referenceTypeNode.nodeId.toString() + isForward.toString();
        if (_private._cache[hash]) {
            return _private._cache[hash];
        }
        // istanbul ignore next
        if (doDebug && !(this.addressSpace.findReferenceType(referenceTypeNode))) {
            throw new Error("expecting valid reference name " + referenceType);
        }
        const result = [];
        _.forEach(_private._referenceIdx, (ref) => {
            if (ref.isForward === isForward) {
                if (node_opcua_nodeid_1.sameNodeId(ref.referenceType, referenceTypeNode.nodeId)) {
                    result.push(ref);
                }
            }
        });
        _.forEach(_private._back_referenceIdx, (ref) => {
            if (ref.isForward === isForward) {
                if (node_opcua_nodeid_1.sameNodeId(ref.referenceType, referenceTypeNode.nodeId)) {
                    result.push(ref);
                }
            }
        });
        _private._cache[hash] = result;
        return result;
    }
    /**
     * @method findReference
     * @param strReference the referenceType as a string.
     * @param [isForward]
     * @return {Reference}
     */
    findReference(strReference, isForward) {
        const refs = this.findReferences(strReference, isForward);
        // yy if (optionalSymbolicName) {
        // yy     // search reference that matches symbolic name
        // yy     refs = refs.filter((ref: Reference) => ref.symbolicName === optionalSymbolicName);
        // yy }
        node_opcua_assert_1.assert(refs.length === 1 || refs.length === 0, "findReference: expecting only one or zero element here");
        return refs.length === 0 ? null : refs[0];
    }
    findReferencesExAsObject(strReference, browseDirection) {
        const references = this.findReferencesEx(strReference, browseDirection);
        return _asObject(references, this.addressSpace);
    }
    findReferencesAsObject(strReference, isForward) {
        const references = this.findReferences(strReference, isForward);
        return _asObject(references, this.addressSpace);
    }
    /**
     * return an array with the Aggregates of this object.
     */
    getAggregates() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache._aggregates) {
            _private._cache._aggregates = this.findReferencesExAsObject("Aggregates", node_opcua_data_model_1.BrowseDirection.Forward);
        }
        return _private._cache._aggregates;
    }
    /**
     * return an array with the components of this object.
     */
    getComponents() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache._components) {
            _private._cache._components = this.findReferencesExAsObject("HasComponent", node_opcua_data_model_1.BrowseDirection.Forward);
        }
        return _private._cache._components;
    }
    /**
     *  return a array with the properties of this object.
     */
    getProperties() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache._properties) {
            _private._cache._properties = this.findReferencesExAsObject("HasProperty", node_opcua_data_model_1.BrowseDirection.Forward);
        }
        return _private._cache._properties;
    }
    /**
     * return a array with the notifiers of this object.
     */
    getNotifiers() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache._notifiers) {
            _private._cache._notifiers = this.findReferencesAsObject("HasNotifier", true);
        }
        return _private._cache._notifiers;
    }
    /**
     * return a array with the event source of this object.
     */
    getEventSources() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache._eventSources) {
            _private._cache._eventSources = this.findReferencesAsObject("HasEventSource", true);
        }
        return _private._cache._eventSources;
    }
    /**
     * return a array of the objects for which this node is an EventSource
     */
    getEventSourceOfs() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache._eventSources) {
            _private._cache._eventSources = this.findReferencesAsObject("HasEventSource", false);
        }
        return _private._cache._eventSources;
    }
    /**
     * retrieve a component by name
     */
    getComponentByName(browseName, namespaceIndex) {
        const components = this.getComponents();
        const select = _filter_by_browse_name(components, browseName, namespaceIndex);
        node_opcua_assert_1.assert(select.length <= 1, "BaseNode#getComponentByName found duplicated reference");
        if (select.length === 1) {
            const component = select[0];
            if (component.nodeClass === node_opcua_data_model_1.NodeClass.Method) {
                console.log("please use getMethodByName to retrieve a method");
                return null;
            }
            node_opcua_assert_1.assert(component.nodeClass === node_opcua_data_model_1.NodeClass.Variable || component.nodeClass === node_opcua_data_model_1.NodeClass.Object);
            return component;
        }
        else {
            return null;
        }
    }
    /**
     * retrieve a property by name
     */
    getPropertyByName(browseName, namespaceIndex) {
        const properties = this.getProperties();
        const select = _filter_by_browse_name(properties, browseName, namespaceIndex);
        node_opcua_assert_1.assert(select.length <= 1, "BaseNode#getPropertyByName found duplicated reference");
        if (select.length === 1 && select[0].nodeClass !== node_opcua_data_model_1.NodeClass.Variable) {
            throw new Error("Expecting a proprerty to be of TypeVariable");
        }
        return select.length === 1 ? select[0] : null;
    }
    /**
     * retrieve a folder by name
     */
    getFolderElementByName(browseName, namespaceIndex) {
        node_opcua_assert_1.assert(typeof browseName === "string");
        const elements = this.getFolderElements();
        const select = _filter_by_browse_name(elements, browseName, namespaceIndex);
        return select.length === 1 ? select[0] : null;
    }
    /**
     * returns the list of nodes that this folder object organizes
     */
    getFolderElements() {
        return this.findReferencesAsObject("Organizes", true);
    }
    /**
     * returns the list of methods that this object provides
     * @method getMethods
     * @return an array with Method objects.
     *
     *
     * Note: internally, methods are special types of components
     */
    getMethods() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (!_private._cache._methods) {
            const components = this.getComponents();
            _private._cache._methods = components.filter((obj) => obj.nodeClass === node_opcua_data_model_1.NodeClass.Method);
        }
        return _private._cache._methods;
    }
    /**
     * returns the method exposed by this object and with the given nodeId
     */
    getMethodById(nodeId) {
        const methods = this.getMethods();
        const found = _.find(methods, (m) => m.nodeId.toString() === nodeId.toString());
        return found || null;
    }
    getMethodByName(browseName, namespaceIndex) {
        const methods = this.getMethods();
        const select = _filter_by_browse_name(methods, browseName, namespaceIndex);
        node_opcua_assert_1.assert(select.length <= 1, "BaseNode#getMethodByName found duplicated reference");
        return select.length === 1 ? select[0] : null;
    }
    getWriteMask() {
        return 0;
    }
    getUserWriteMask() {
        return 0;
    }
    readAttribute(context, attributeId, indexRange, dataEncoding) {
        node_opcua_assert_1.assert(!context || context instanceof source_1.SessionContext);
        const options = {};
        options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
        switch (attributeId) {
            case node_opcua_data_model_1.AttributeIds.NodeId: // NodeId
                options.value = { dataType: node_opcua_variant_1.DataType.NodeId, value: this.nodeId };
                break;
            case node_opcua_data_model_1.AttributeIds.NodeClass: // NodeClass
                node_opcua_assert_1.assert(_.isFinite(this.nodeClass));
                options.value = { dataType: node_opcua_variant_1.DataType.Int32, value: this.nodeClass };
                break;
            case node_opcua_data_model_1.AttributeIds.BrowseName: // QualifiedName
                node_opcua_assert_1.assert(this.browseName instanceof node_opcua_data_model_1.QualifiedName);
                options.value = { dataType: node_opcua_variant_1.DataType.QualifiedName, value: this.browseName };
                break;
            case node_opcua_data_model_1.AttributeIds.DisplayName: // LocalizedText
                options.value = { dataType: node_opcua_variant_1.DataType.LocalizedText, value: this.displayName[0] };
                break;
            case node_opcua_data_model_1.AttributeIds.Description: // LocalizedText
                options.value = { dataType: node_opcua_variant_1.DataType.LocalizedText, value: this.description };
                break;
            case node_opcua_data_model_1.AttributeIds.WriteMask:
                options.value = { dataType: node_opcua_variant_1.DataType.UInt32, value: this.getWriteMask() };
                break;
            case node_opcua_data_model_1.AttributeIds.UserWriteMask:
                options.value = { dataType: node_opcua_variant_1.DataType.UInt32, value: this.getUserWriteMask() };
                break;
            default:
                options.value = null;
                options.statusCode = node_opcua_status_code_1.StatusCodes.BadAttributeIdInvalid;
                break;
        }
        // xx options.serverTimestamp = new Date();
        return new node_opcua_data_value_1.DataValue(options);
    }
    writeAttribute(context, writeValue, callback) {
        node_opcua_assert_1.assert(context instanceof source_1.SessionContext);
        node_opcua_assert_1.assert(_.isFunction(callback));
        if (writeValue.attributeId <= 0 || writeValue.attributeId > node_opcua_data_model_1.AttributeIds.UserExecutable) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadAttributeIdInvalid);
        }
        // by default Node is read-only,
        // this method needs to be overridden to change the behavior
        callback(null, node_opcua_status_code_1.StatusCodes.BadNotWritable);
    }
    fullName() {
        if (this.parentNodeId) {
            const parent = this.addressSpace.findNode(this.parentNodeId);
            // istanbul ignore else
            if (parent) {
                return parent.fullName() + "." + this.browseName.toString() + "";
            }
            else {
                return "NOT YET REGISTERED" + this.parentNodeId.toString() + "." + this.browseName.toString() + "";
            }
        }
        return this.browseName.toString();
    }
    ownReferences() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        return _.map(_private._referenceIdx, (r) => r);
    }
    /**
     * @method browseNodeByTargetName
     *
     * @param relativePathElement
     * @param isLast
     * @return {NodeId[]}
     */
    browseNodeByTargetName(relativePathElement, isLast) {
        relativePathElement.targetName = relativePathElement.targetName || new node_opcua_data_model_1.QualifiedName({});
        // part 4.0 v1.03 $7.26 RelativePath
        // The BrowseName of the target node.
        // The final element may have an empty targetName. In this situation all targets of the references identified by
        // the referenceTypeId are the targets of the RelativePath.
        // The targetName shall be specified for all other elements.
        // The current path cannot be followed any further if no targets with the specified BrowseName exist.
        node_opcua_assert_1.assert(relativePathElement.targetName instanceof node_opcua_data_model_1.QualifiedName);
        node_opcua_assert_1.assert(relativePathElement.targetName.namespaceIndex >= 0);
        node_opcua_assert_1.assert(relativePathElement.targetName.name.length > 0);
        // The type of reference to follow from the current node.
        // The current path cannot be followed any further if the referenceTypeId is not available on the Node instance.
        // If not specified then all References are included and the parameter includeSubtypes is ignored.
        node_opcua_assert_1.assert(relativePathElement.hasOwnProperty("referenceTypeId"));
        // Indicates whether the inverse Reference should be followed.
        // The inverse reference is followed if this value is TRUE.
        node_opcua_assert_1.assert(relativePathElement.hasOwnProperty("isInverse"));
        // Indicates whether subtypes of the ReferenceType should be followed.
        // Subtypes are included if this value is TRUE.
        node_opcua_assert_1.assert(relativePathElement.hasOwnProperty("includeSubtypes"));
        const references = this.allReferences();
        const _check_reference = (reference) => {
            if (relativePathElement.referenceTypeId.isEmpty()) {
                return true;
            }
            node_opcua_assert_1.assert(relativePathElement.referenceTypeId instanceof node_opcua_nodeid_1.NodeId);
            if ((relativePathElement.isInverse && reference.isForward) ||
                (!relativePathElement.isInverse && !reference.isForward)) {
                return false;
            }
            node_opcua_assert_1.assert(reference.hasOwnProperty("isForward"));
            const referenceType = resolveReferenceType(this.addressSpace, reference);
            const referenceTypeId = referenceType.nodeId;
            if (node_opcua_nodeid_1.sameNodeId(relativePathElement.referenceTypeId, referenceTypeId)) {
                return true;
            }
            if (relativePathElement.includeSubtypes) {
                const baseType = this.addressSpace.findReferenceType(relativePathElement.referenceTypeId);
                if (baseType && referenceType.isSupertypeOf(baseType)) {
                    return true;
                }
            }
            return false;
        };
        const nodeIdsMap = {};
        let nodeIds = [];
        for (const reference of references) {
            if (!_check_reference(reference)) {
                continue;
            }
            const obj = resolveReferenceNode(this.addressSpace, reference);
            // istanbul ignore next
            if (!obj) {
                throw new Error(" cannot find node with id " + reference.nodeId.toString());
            }
            if (_.isEqual(obj.browseName, relativePathElement.targetName)) { // compare QualifiedName
                const key = obj.nodeId.toString();
                if (!nodeIdsMap.hasOwnProperty(key)) {
                    nodeIds.push(obj.nodeId);
                    nodeIdsMap[key] = obj;
                }
            }
        }
        if (this.nodeClass === node_opcua_data_model_1.NodeClass.ObjectType || this.nodeClass === node_opcua_data_model_1.NodeClass.VariableType) {
            const nodeType = this;
            if (nodeType.subtypeOf) {
                // browsing also InstanceDeclarations included in base type
                const baseType = this.addressSpace.findNode(nodeType.subtypeOf);
                const n = baseType.browseNodeByTargetName(relativePathElement, isLast);
                nodeIds = [].concat(nodeIds, n);
            }
        }
        return nodeIds;
    }
    /**
     * browse the node to extract information requested in browseDescription
     * @method browseNode
     * @param browseDescription
     * @param context
     * @return an array with reference descriptions
     */
    browseNode(browseDescription, context) {
        node_opcua_assert_1.assert(_.isFinite(browseDescription.nodeClassMask));
        node_opcua_assert_1.assert(_.isFinite(browseDescription.browseDirection));
        const do_debug = false;
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        const addressSpace = this.addressSpace;
        const referenceTypeId = normalize_referenceTypeId(addressSpace, browseDescription.referenceTypeId);
        node_opcua_assert_1.assert(referenceTypeId instanceof node_opcua_nodeid_1.NodeId);
        const browseDirection = (browseDescription.browseDirection !== undefined)
            ? browseDescription.browseDirection
            : node_opcua_data_model_1.BrowseDirection.Both;
        // get all possible references
        let references = [].concat(Object.values(_private._referenceIdx), Object.values(_private._back_referenceIdx));
        /* istanbul ignore next */
        if (do_debug) {
            console.log("all references :", this.nodeId.toString(), this.browseName.toString());
            source_1.dumpReferences(addressSpace, Object.values(_private._referenceIdx));
        }
        // filter out references not matching referenceType
        references = _filter_by_referenceType.call(this, browseDescription, references, referenceTypeId);
        references = _filter_by_direction(references, browseDirection);
        references = _filter_by_nodeclass.call(this, references, browseDescription.nodeClassMask);
        references = _filter_by_userFilter.call(this, references, context);
        const referenceDescriptions = base_node_private_1._constructReferenceDescription(addressSpace, references, browseDescription.resultMask);
        /* istanbul ignore next */
        if (do_debug) {
            source_1.dumpReferenceDescriptions(this.addressSpace, referenceDescriptions);
        }
        return referenceDescriptions;
    }
    allReferences() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        return [].concat(Object.values(_private._referenceIdx), Object.values(_private._back_referenceIdx));
    }
    /**
     * @method addReference
     * @param reference
     * @param reference.referenceType {String}
     * @param [reference.isForward = true] {Boolean}
     * @param reference.nodeId {Node|NodeId|String}
     *
     * @example
     *
     *     view.addReference({ referenceType: "Organizes", nodeId: myDevice });
     *
     * or
     *
     *     myDevice1.addReference({ referenceType: "OrganizedBy", nodeId: view });
     */
    addReference(reference) {
        const referenceNode = this.__addReference(reference);
        const addressSpace = this.addressSpace;
        if (!resolveReferenceType(addressSpace, referenceNode)) {
            throw new Error("BaseNode#addReference : invalid reference  " + reference.toString());
        }
        this._clear_caches();
        _propagate_ref.call(this, addressSpace, referenceNode);
        this.install_extra_properties();
        cetools._handle_add_reference_change_event(this, referenceNode.nodeId);
    }
    removeReference(referencOpts) {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        node_opcua_assert_1.assert(referencOpts.hasOwnProperty("referenceType"));
        // xx isForward is optional : assert(reference.hasOwnProperty("isForward"));
        node_opcua_assert_1.assert(referencOpts.hasOwnProperty("nodeId"));
        const addressSpace = this.addressSpace;
        const reference = addressSpace.normalizeReferenceTypes([referencOpts])[0];
        const h = reference.hash;
        const relatedNode = addressSpace.findNode(reference.nodeId);
        const invReference = new reference_1.Reference({
            isForward: !reference.isForward,
            nodeId: this.nodeId,
            referenceType: reference.referenceType
        });
        if (_private._referenceIdx[h]) {
            delete _private._referenceIdx[h];
            base_node_private_1.BaseNode_remove_backward_reference.call(relatedNode, invReference);
        }
        else if (_private._back_referenceIdx[h]) {
            relatedNode.removeReference(invReference);
        }
        else {
            throw new Error("Cannot find reference " + reference);
        }
        base_node_private_1._handle_HierarchicalReference(this, reference);
        this.uninstall_extra_properties(reference);
        this._clear_caches();
    }
    /**
     *
     */
    resolveNodeId(nodeId) {
        return this.addressSpace.resolveNodeId(nodeId);
    }
    install_extra_properties() {
        const addressSpace = this.addressSpace;
        if (addressSpace.isFrugal) {
            // skipping
            return;
        }
        install_components_as_object_properties(this);
        function install_extra_properties_on_parent(ref) {
            const node = reference_1.Reference.resolveReferenceNode(addressSpace, ref);
            install_components_as_object_properties(node);
        }
        // make sure parent have extra properties updated
        const parentComponents = this.findReferences("HasComponent", false);
        const parentSubfolders = this.findReferences("Organizes", false);
        const parentProperties = this.findReferences("HasProperty", false);
        for (const p of parentComponents) {
            install_extra_properties_on_parent(p);
        }
        for (const p of parentSubfolders) {
            install_extra_properties_on_parent(p);
        }
        for (const p of parentProperties) {
            install_extra_properties_on_parent(p);
        }
    }
    uninstall_extra_properties(reference) {
        const addressSpace = this.addressSpace;
        if (addressSpace.isFrugal) {
            // skipping
            return;
        }
        const childNode = resolveReferenceNode(addressSpace, reference);
        const name = node_opcua_utils_1.lowerFirstLetter(childNode.browseName.name.toString());
        if (reservedNames.hasOwnProperty(name)) {
            if (doDebug) {
                // tslint:disable-next-line:no-console
                console.log(chalk_1.default.bgWhite.red("Ignoring reserved keyword                                     " + name));
            }
            return;
        }
        /* istanbul ignore next */
        if (!this.hasOwnProperty(name)) {
            return;
        }
        Object.defineProperty(this, name, {
            value: undefined
        });
    }
    toString() {
        const options = new base_node_private_1.ToStringBuilder();
        base_node_private_1.BaseNode_toString.call(this, options);
        return options.toString();
    }
    /**
     * @property isFalseSubStateOf
     * @type {BaseNode|null}
     */
    get isFalseSubStateOf() {
        const node = this;
        const r = node.findReferencesAsObject("HasFalseSubState", false);
        if (!r || r.length === 0) {
            return null;
        }
        node_opcua_assert_1.assert(r.length === 1);
        return r[0];
    }
    /**
     * @property isTrueSubStateOf
     * @type {BaseNode|null}
     */
    get isTrueSubStateOf() {
        const node = this;
        const r = node.findReferencesAsObject("HasTrueSubState", false);
        if (!r || r.length === 0) {
            return null;
        }
        node_opcua_assert_1.assert(r.length === 1);
        return r[0];
    }
    /**
     * @method getFalseSubStates
     * @return {BaseNode[]} return an array with the SubStates of this object.
     */
    getFalseSubStates() {
        return this.findReferencesAsObject("HasFalseSubState");
    }
    /**
     * @method getTrueSubStates
     * @return {BaseNode[]} return an array with the SubStates of this object.
     */
    getTrueSubStates() {
        return this.findReferencesAsObject("HasTrueSubState");
    }
    findHierarchicalReferences() {
        const node = this;
        return node.findReferencesEx("HierarchicalReferences", node_opcua_data_model_1.BrowseDirection.Forward);
        // const _private = BaseNode_getPrivate(node);
        //
        // if (!_private._cache._HasChildReferences) {
        //     //xx console.log("node ",node.nodeId.toString());
        //     //xx _private._cache._HasChildReferences =
        //         node.findReferencesEx("HierarchicalReferences",BrowseDirection.Forward);
        //     const r1 =
        //     const r2 = node.findReferencesEx("Organizes",BrowseDirection.Forward);
        //     _private._cache._HasChildReferences = r1.concat(r2);
        // }
        // return _private._cache._HasChildReferences;
    }
    getChildByName(browseName) {
        // Attention: getChild doesn't care about namespace on browseName
        //            !!!!
        if (browseName instanceof node_opcua_data_model_1.QualifiedName) {
            browseName = browseName.name.toString();
        }
        node_opcua_assert_1.assert(typeof browseName === "string");
        const node = this;
        const _private = base_node_private_1.BaseNode_getPrivate(node);
        const addressSpace = node.addressSpace;
        if (!_private._cache._childByNameMap) {
            _private._cache._childByNameMap = {};
            const childReferenceTypes = node.findReferencesEx("HasChild");
            for (const r of childReferenceTypes) {
                const child = resolveReferenceNode(addressSpace, r);
                _private._cache._childByNameMap[child.browseName.name.toString()] = child;
            }
        }
        const ret = _private._cache._childByNameMap[browseName] || null;
        return ret;
    }
    get toStateNode() {
        const nodes = this.findReferencesAsObject("ToState", true);
        node_opcua_assert_1.assert(nodes.length <= 1);
        return nodes.length === 1 ? nodes[0] : null;
    }
    get fromStateNode() {
        const nodes = this.findReferencesAsObject("FromState", true);
        node_opcua_assert_1.assert(nodes.length <= 1);
        return nodes.length === 1 ? nodes[0] : null;
    }
    /**
     * this methods propagates the forward references to the pointed node
     * by inserting backward references to the counter part node
     */
    propagate_back_references() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        if (this.addressSpace.suspendBackReference) {
            // this indicates that the base node is constructed from an xml definition
            // propagate_back_references will be called later once the file has been completely processed.
            return;
        }
        const addressSpace = this.addressSpace;
        for (const reference of Object.values(_private._referenceIdx)) {
            _propagate_ref.call(this, addressSpace, reference);
        }
    }
    /**
     * the dispose method should be called when the node is no longer used, to release
     * back pointer to the address space and clear caches.
     *
     * @method dispose
     *
     */
    dispose() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        this.emit("dispose");
        this.removeAllListeners();
        this._clear_caches();
        _.forEach(_private._back_referenceIdx, (ref) => ref.dispose());
        _.forEach(_private._referenceIdx, (ref) => ref.dispose());
        _private._cache = {};
        _private.__address_space = null;
        _private._back_referenceIdx = null;
        _private._referenceIdx = null;
    }
    // istanbul ignore next
    dumpXML(xmlWriter) {
        console.error(" This ", node_opcua_data_model_1.NodeClass[this.nodeClass]);
        node_opcua_assert_1.assert(false, "BaseNode#dumpXML NOT IMPLEMENTED !");
        node_opcua_assert_1.assert(xmlWriter);
    }
    /**
     * Undo the effect of propagate_back_references
     */
    unpropagate_back_references() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        const addressSpace = this.addressSpace;
        _.forEach(_private._referenceIdx, (reference) => {
            // filter out non  Hierarchical References
            const referenceType = resolveReferenceType(addressSpace, reference);
            // istanbul ignore next
            if (!referenceType) {
                console.error(chalk_1.default.red(" ERROR"), " cannot find reference ", reference.referenceType, reference.toString());
            }
            const related_node = resolveReferenceNode(addressSpace, reference);
            if (related_node) {
                node_opcua_assert_1.assert(reference.nodeId.toString() !== this.nodeId.toString());
                base_node_private_1.BaseNode_remove_backward_reference.call(related_node, new reference_1.Reference({
                    isForward: !reference.isForward,
                    nodeId: this.nodeId,
                    referenceType: reference.referenceType
                }));
            } // else addressSpace may be incomplete
        });
    }
    installPostInstallFunc(f) {
        if (!f) {
            // nothing to do
            return;
        }
        function chain(f1, f2) {
            return function () {
                const args = arguments;
                if (f1) {
                    f1.apply(this, args);
                }
                if (f2) {
                    f2.apply(this, args);
                }
            };
        }
        this._postInstantiateFunc = chain.call(this, this._postInstantiateFunc, f);
    }
    _on_child_added() {
        this._clear_caches();
    }
    _on_child_removed(obj) {
        // obj; // unused;
        this._clear_caches();
    }
    _add_backward_reference(reference) {
        base_node_private_1.BaseNode_add_backward_reference.call(this, reference);
    }
    _coerceReferenceType(referenceType) {
        if (typeof referenceType === "string") {
            referenceType = this.addressSpace.findReferenceType(referenceType);
        }
        else if (referenceType instanceof node_opcua_nodeid_1.NodeId) {
            referenceType = this.addressSpace.findNode(referenceType);
        }
        node_opcua_assert_1.assert(referenceType.nodeClass === node_opcua_data_model_1.NodeClass.ReferenceType);
        return referenceType;
    }
    __findReferenceWithBrowseName(referenceType, browseName) {
        const refs = this.findReferencesAsObject(referenceType);
        function hasBrowseName(node) {
            return node.browseName.toString() === browseName;
        }
        const ref = refs.filter(hasBrowseName)[0];
        return ref;
    }
    __addReference(referenceOpts) {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        node_opcua_assert_1.assert(referenceOpts.hasOwnProperty("referenceType"));
        // xx isForward is optional : assert(reference.hasOwnProperty("isForward"));
        node_opcua_assert_1.assert(referenceOpts.hasOwnProperty("nodeId"));
        const addressSpace = this.addressSpace;
        const reference = addressSpace.normalizeReferenceTypes([referenceOpts])[0];
        node_opcua_assert_1.assert(reference instanceof reference_1.Reference);
        const h = reference.hash;
        node_opcua_assert_1.assert(!_private._back_referenceIdx[h], "reference exists already in _back_references");
        node_opcua_assert_1.assert(!_private._referenceIdx[h], "reference exists already in _references");
        _private._referenceIdx[h] = reference;
        base_node_private_1._handle_HierarchicalReference(this, reference);
        return reference;
    }
    _setDisplayName(displayName) {
        const displayNames = _.isArray(displayName) ? displayName : [displayName];
        const _displayNames = displayNames.map(node_opcua_data_model_1.coerceLocalizedText);
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        _private._displayName = _displayNames;
    }
    _setDescription(description) {
        const __description = node_opcua_data_model_1.coerceLocalizedText(description);
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        _private._description = __description;
    }
    _notifyAttributeChange(attributeId) {
        const event_name = BaseNode.makeAttributeEventName(attributeId);
        this.emit(event_name, this.readAttribute(source_1.SessionContext.defaultContext, attributeId));
    }
    _clear_caches() {
        const _private = base_node_private_1.BaseNode_getPrivate(this);
        _private._cache = {};
    }
}
exports.BaseNode = BaseNode;
let displayWarning = true;
function toString_ReferenceDescription(ref, options) {
    const addressSpace = options.addressSpace;
    // xx assert(ref instanceof ReferenceDescription);
    const refNode = addressSpace.findNode(ref.referenceType);
    if (!refNode) {
        return "Unknown Ref : " + ref;
    }
    const r = new reference_1.Reference({
        isForward: ref.isForward,
        nodeId: ref.nodeId,
        referenceType: refNode.browseName.toString()
    });
    const str = r.toString(options);
    r.dispose();
    return str;
}
/* jshint latedef: false */
function _setup_parent_item(references) {
    references = _.map(references, (x) => x);
    /* jshint validthis: true */
    node_opcua_assert_1.assert(this instanceof BaseNode);
    node_opcua_assert_1.assert(_.isArray(references));
    const _private = base_node_private_1.BaseNode_getPrivate(this);
    node_opcua_assert_1.assert(!_private._parent, "_setup_parent_item has been already called");
    const addressSpace = this.addressSpace;
    if (references.length > 0) {
        references = this.findReferencesEx("HasChild", node_opcua_data_model_1.BrowseDirection.Inverse);
        if (references.length >= 1) {
            // istanbul ignore next
            if (references.length > 1) {
                if (displayWarning) {
                    const options = { addressSpace };
                    // tslint:disable-next-line:no-console
                    console.warn("  More than one HasChild reference have been found for parent of object");
                    // tslint:disable-next-line:no-console
                    console.warn("    object node id:", this.nodeId.toString(), chalk_1.default.cyan(this.browseName.toString()));
                    // tslint:disable-next-line:no-console
                    console.warn("    browseResults:");
                    // tslint:disable-next-line:no-console
                    console.warn(references.map((f) => toString_ReferenceDescription(f, options)).join("\n"));
                    // tslint:disable-next-line:no-console
                    console.warn("    first one will be used as parent");
                    // xx assert(browseResults.length === 1);
                    displayWarning = false;
                }
            }
            return reference_1.Reference.resolveReferenceNode(addressSpace, references[0]);
        }
    }
    return null;
}
function _asObject(references, addressSpace) {
    function toObject(reference) {
        const obj = resolveReferenceNode(addressSpace, reference);
        // istanbul ignore next
        if (false && !obj) {
            // tslint:disable-next-line:no-console
            console.log(chalk_1.default.red(" Warning :  object with nodeId ")
                + chalk_1.default.cyan(reference.nodeId.toString()) + chalk_1.default.red(" cannot be found in the address space !"));
        }
        return obj;
    }
    function remove_null(o) {
        return !!o;
    }
    return references.map(toObject).filter(remove_null);
}
function _filter_by_browse_name(components, browseName, namespaceIndex) {
    let select = [];
    if (namespaceIndex === null || namespaceIndex === undefined) {
        select = components.filter((c) => c.browseName.name.toString() === browseName);
    }
    else {
        select = components.filter((c) => c.browseName.name.toString() === browseName && c.browseName.namespaceIndex === namespaceIndex);
    }
    return select;
}
let displayWarningReferencePointingToItSelf = true;
function _is_massively_used_reference(referenceType) {
    const name = referenceType.browseName.toString();
    return name === "HasTypeDefinition" || name === "HasModellingRule";
}
function _propagate_ref(addressSpace, reference) {
    // filter out non  Hierarchical References
    const referenceType = reference_1.Reference.resolveReferenceType(addressSpace, reference);
    // istanbul ignore next
    if (!referenceType) {
        // tslint:disable-next-line:no-console
        console.error(chalk_1.default.red(" ERROR"), " cannot find reference ", reference.referenceType, reference.toString());
    }
    // ------------------------------- Filter out back reference when reference type
    //                                 is HasTypeDefinition, HasModellingRule, etc ...
    //
    // var referenceNode = Reference.resolveReferenceNode(addressSpace,reference);
    // ignore propagation on back reference to UAVariableType or UAObject Type reference
    // because there are too many !
    if (!referenceType || _is_massively_used_reference(referenceType)) {
        return;
    }
    // ------------------------------- EXPERIMENT
    // xx if (!referenceType.isSupertypeOf(hierarchicalReferencesId)) { return; }
    const related_node = resolveReferenceNode(addressSpace, reference);
    if (related_node) {
        // verify that reference doesn't point to object itthis (see mantis 3099)
        if (node_opcua_nodeid_1.sameNodeId(reference.nodeId, this.nodeId)) {
            // istanbul ignore next
            if (displayWarningReferencePointingToItSelf) {
                // this could happen with method
                console.warn("  Warning: a Reference is pointing to itthis ", this.nodeId.toString(), this.browseName.toString());
                displayWarningReferencePointingToItSelf = false;
            }
        }
        // xx ignore this assert(reference.nodeId.toString() !== this.nodeId.toString());
        // function w(s,l) { return (s+"                                                          ").substr(0,l);}
        // if (reference.isForward) {
        //    console.log("  CHILD => ",w(related_node.browseName   + " " + related_node.nodeId.toString(),30),
        //    "  PARENT   ",w(this.browseName + " " + this.nodeId.toString(),30) , reference.toString());
        // } else {
        //    console.log("  CHILD => ",w(this.browseName   + " " + this.nodeId.toString(),30),
        //   "  PARENT   ",w(related_node.browseName + " " + related_node.nodeId.toString(),30) , reference.toString());
        //
        // }
        related_node._add_backward_reference(new reference_1.Reference({
            _referenceType: reference._referenceType,
            isForward: !reference.isForward,
            node: this,
            nodeId: this.nodeId,
            referenceType: reference.referenceType
        }));
    } // else addressSpace may be incomplete and under construction (while loading a nodeset.xml file for instance)
}
function nodeid_is_nothing(nodeid) {
    return (nodeid.value === 0 && nodeid.namespace === 0);
}
/**
 * @method normalize_referenceTypeId
 * @param addressSpace {AddressSpace}
 * @param referenceTypeId {String|NodeId|null} : the referenceType either as a string or a nodeId
 * @return {NodeId}
 */
function normalize_referenceTypeId(addressSpace, referenceTypeId) {
    if (!referenceTypeId) {
        return node_opcua_nodeid_1.makeNodeId(0);
    }
    if (typeof referenceTypeId === "string") {
        const ref = addressSpace.findReferenceType(referenceTypeId);
        if (ref) {
            return ref.nodeId;
        }
    }
    let nodeId;
    try {
        nodeId = addressSpace.resolveNodeId(referenceTypeId);
    }
    catch (err) {
        console.log("cannot normalize_referenceTypeId", referenceTypeId);
        throw err;
    }
    node_opcua_assert_1.assert(nodeId);
    return nodeId;
}
const resolveReferenceNode = reference_1.Reference.resolveReferenceNode;
const resolveReferenceType = reference_1.Reference.resolveReferenceType;
function _filter_by_referenceType(browseDescription, references, referenceTypeId) {
    // make sure we have a valid referenceTypeId if not null
    if (!nodeid_is_nothing(referenceTypeId)) {
        node_opcua_assert_1.assert(referenceTypeId instanceof node_opcua_nodeid_1.NodeId);
        const referenceType = this.addressSpace.findNode(referenceTypeId);
        node_opcua_debug_1.dumpIf(!referenceType, referenceTypeId);
        if (!referenceType || referenceType.nodeClass !== node_opcua_data_model_1.NodeClass.ReferenceType) {
            throw new Error("Cannot find reference type");
        }
        references = references.filter((reference) => {
            const ref = resolveReferenceType(this.addressSpace, reference);
            if (!ref) {
                return false;
            } // unknown type ... this may happen when the address space is not fully build
            node_opcua_assert_1.assert(ref.nodeClass === node_opcua_data_model_1.NodeClass.ReferenceType);
            const is_of_type = ref.nodeId.toString() === referenceType.nodeId.toString();
            if (is_of_type) {
                return true;
            }
            if (browseDescription.includeSubtypes) {
                return ref.isSupertypeOf(referenceType);
            }
            else {
                return false;
            }
        });
    }
    return references;
}
function forwardOnly(reference) {
    return reference.isForward;
}
function reverseOnly(reference) {
    return !reference.isForward;
}
function _filter_by_direction(references, browseDirection) {
    if (browseDirection === node_opcua_data_model_1.BrowseDirection.Both) {
        return references;
    }
    if (browseDirection === node_opcua_data_model_1.BrowseDirection.Forward) {
        return references.filter(forwardOnly);
    }
    else {
        return references.filter(reverseOnly);
    }
}
function _filter_by_nodeclass(references, nodeClassMask) {
    node_opcua_assert_1.assert(_.isFinite(nodeClassMask));
    if (nodeClassMask === 0) {
        return references;
    }
    const addressSpace = this.addressSpace;
    return references.filter((reference) => {
        const obj = resolveReferenceNode(addressSpace, reference);
        if (!obj) {
            return false;
        }
        const nodeClassName = node_opcua_data_model_1.NodeClass[obj.nodeClass];
        const value = node_opcua_data_model_1.makeNodeClassMask(nodeClassName);
        return (value & nodeClassMask) === value;
    });
}
function _filter_by_userFilter(references, context) {
    const addressSpace = this.addressSpace;
    return references.filter((reference) => {
        const obj = resolveReferenceNode(addressSpace, reference);
        if (!obj) {
            return false;
        }
        const _private = base_node_private_1.BaseNode_getPrivate(obj);
        if (!_private._browseFilter) {
            throw Error("Internal error : cannot find browseFilter");
        }
        return _private._browseFilter.call(obj, context);
    });
}
const reservedNames = {
    __description: 0,
    __displayName: 0,
    browseName: 0,
    description: 0,
    displayName: 0,
    nodeClass: 0,
    nodeId: 0,
    typeDefinition: 0
};
/*
 * install hierarchical references as javascript properties
 * Components/Properties/Organizes
 */
function install_components_as_object_properties(parentObj) {
    if (!parentObj) {
        return;
    }
    const addressSpace = parentObj.addressSpace;
    const hierarchicalRefs = parentObj.findHierarchicalReferences();
    const children = hierarchicalRefs.map((r) => reference_1.Reference.resolveReferenceNode(addressSpace, r));
    for (const child of children) {
        if (!child) {
            continue;
        }
        // assumption: we ignore namespace here .
        const name = node_opcua_utils_1.lowerFirstLetter(child.browseName.name.toString());
        if (reservedNames.hasOwnProperty(name)) {
            if (doDebug) {
                console.log(chalk_1.default.bgWhite.red("Ignoring reserved keyword                                               " + name));
            }
            continue;
        }
        if (doDebug) {
            console.log("Installing property " + name, " on ", parentObj.browseName.toString());
        }
        /* istanbul ignore next */
        if (parentObj.hasOwnProperty(name)) {
            continue;
        }
        Object.defineProperty(parentObj, name, {
            configurable: true,
            enumerable: true,
            // xx writable: false,
            get() {
                return child;
            }
            // value: child
        });
    }
}
//# sourceMappingURL=base_node.js.map