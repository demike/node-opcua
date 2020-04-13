"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space.Private
 */
// tslint:disable:no-bitwise
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_types_1 = require("node-opcua-types");
const source_1 = require("../source");
const base_node_1 = require("./base_node");
const namespace_private_1 = require("./namespace_private");
const reference_1 = require("./reference");
const g_weakMap = new WeakMap();
function BaseNode_initPrivate(self) {
    const _private = {
        __address_space: null,
        _back_referenceIdx: {},
        _browseFilter: undefined,
        _cache: {},
        _description: undefined,
        _displayName: [],
        _parent: undefined,
        _referenceIdx: {},
        _subtype_idx: {},
        _subtype_idxVersion: 0,
    };
    g_weakMap.set(self, _private);
    return _private;
}
exports.BaseNode_initPrivate = BaseNode_initPrivate;
function BaseNode_getPrivate(self) {
    return g_weakMap.get(self);
}
exports.BaseNode_getPrivate = BaseNode_getPrivate;
const hasTypeDefinition_ReferenceTypeNodeId = node_opcua_nodeid_1.resolveNodeId("HasTypeDefinition");
class ToStringBuilder {
    constructor() {
        this.level = 0;
        this.cycleDetector = {};
        this.padding = "";
        this.str = [];
        //
        this.str = [];
    }
    add(line) {
        this.str.push(line);
    }
    toString() {
        return this.str.join("\n");
    }
    indent(str, padding) {
        padding = padding || "          ";
        return str.split("\n").map((r) => {
            return padding + r;
        }).join("\n");
    }
}
exports.ToStringBuilder = ToStringBuilder;
function set_as_processed(options, nodeId) {
    options.cycleDetector[nodeId.toString()] = nodeId;
}
function is_already_processed(options, nodeId) {
    return !!options.cycleDetector[nodeId.toString()];
}
function BaseNode_toString(options) {
    options.level = options.level || 1;
    set_as_processed(options, this.nodeId);
    options.add("");
    options.add(options.padding + chalk_1.default.yellow("          nodeId              : ") + this.nodeId.toString());
    options.add(options.padding + chalk_1.default.yellow("          nodeClass           : ") + node_opcua_data_model_1.NodeClass[this.nodeClass] + " (" + this.nodeClass + ")");
    options.add(options.padding + chalk_1.default.yellow("          browseName          : ") + this.browseName.toString());
    options.add(options.padding + chalk_1.default.yellow("          displayName         : ") + this.displayName
        .map((f) => f.locale + " " + f.text).join(" | "));
    options.add(options.padding + chalk_1.default.yellow("          description         : ")
        + (this.description ? this.description.toString() : ""));
}
exports.BaseNode_toString = BaseNode_toString;
function BaseNode_References_toString(options) {
    const _private = BaseNode_getPrivate(this);
    const dispOptions = {
        addressSpace: this.addressSpace
    };
    const addressSpace = this.addressSpace;
    options.add(options.padding + chalk_1.default.yellow("          references    : ") + "  length =" +
        Object.keys(_private._referenceIdx).length);
    function dump_reference(follow, reference) {
        if (!reference) {
            return;
        }
        const o = reference_1.Reference.resolveReferenceNode(addressSpace, reference);
        const name = o ? o.browseName.toString() : "<???>";
        options.add(options.padding +
            chalk_1.default.yellow("               +-> ") +
            reference.toString(dispOptions) +
            " " + chalk_1.default.cyan(name));
        // ignore HasTypeDefinition as it has been already handled
        if (node_opcua_nodeid_1.sameNodeId(reference.referenceType, hasTypeDefinition_ReferenceTypeNodeId) &&
            reference.nodeId.namespace === 0) {
            return;
        }
        if (o) {
            if (!is_already_processed(options, o.nodeId)) {
                set_as_processed(options, o.nodeId);
                if (options.level > 1 && follow) {
                    const rr = o.toString({
                        cycleDetector: options.cycleDetector,
                        level: options.level - 1,
                        padding: options.padding + "         ",
                    });
                    options.add(rr);
                }
            }
        }
    }
    // direct reference
    _.forEach(_private._referenceIdx, dump_reference.bind(null, true));
    const br = _.map(_private._back_referenceIdx, (x) => x);
    options.add(options.padding +
        chalk_1.default.yellow("          back_references     : ") +
        chalk_1.default.cyan("  length =") + br.length +
        chalk_1.default.grey(" ( references held by other nodes involving this node)"));
    // backward reference
    br.forEach(dump_reference.bind(null, false));
}
exports.BaseNode_References_toString = BaseNode_References_toString;
function _UAType_toString(options) {
    if (this.subtypeOfObj) {
        options.add(options.padding + chalk_1.default.yellow("          subtypeOf           : ") +
            this.subtypeOfObj.browseName.toString() + " (" + this.subtypeOfObj.nodeId.toString() + ")");
    }
}
function _UAInstance_toString(options) {
    if (this.typeDefinitionObj) {
        options.add(options.padding + chalk_1.default.yellow("          typeDefinition      : ") +
            this.typeDefinitionObj.browseName.toString() + " (" + this.typeDefinitionObj.nodeId.toString() + ")");
    }
}
function UAVariableType_toString(options) {
    BaseNode_toString.call(this, options);
    _UAType_toString.call(this, options);
    VariableOrVariableType_toString.call(this, options);
    BaseNode_References_toString.call(this, options);
}
exports.UAVariableType_toString = UAVariableType_toString;
function UAVariable_toString(options) {
    BaseNode_toString.call(this, options);
    _UAInstance_toString.call(this, options);
    VariableOrVariableType_toString.call(this, options);
    BaseNode_References_toString.call(this, options);
}
exports.UAVariable_toString = UAVariable_toString;
function UAObject_toString(options) {
    BaseNode_toString.call(this, options);
    _UAInstance_toString.call(this, options);
    BaseNode_References_toString.call(this, options);
}
exports.UAObject_toString = UAObject_toString;
function UAObjectType_toString(options) {
    BaseNode_toString.call(this, options);
    _UAType_toString.call(this, options);
    BaseNode_References_toString.call(this, options);
}
exports.UAObjectType_toString = UAObjectType_toString;
function accessLevelFlagToString(flag) {
    const str = [];
    if (flag & node_opcua_data_model_1.AccessLevelFlag.CurrentRead) {
        str.push("CurrentRead");
    }
    if (flag & node_opcua_data_model_1.AccessLevelFlag.CurrentWrite) {
        str.push("CurrentWrite");
    }
    if (flag & node_opcua_data_model_1.AccessLevelFlag.HistoryRead) {
        str.push("HistoryRead");
    }
    if (flag & node_opcua_data_model_1.AccessLevelFlag.HistoryWrite) {
        str.push("HistoryWrite");
    }
    if (flag & node_opcua_data_model_1.AccessLevelFlag.SemanticChange) {
        str.push("SemanticChange");
    }
    if (flag & node_opcua_data_model_1.AccessLevelFlag.StatusWrite) {
        str.push("StatusWrite");
    }
    if (flag & node_opcua_data_model_1.AccessLevelFlag.TimestampWrite) {
        str.push("TimestampWrite");
    }
    return str.join(" | ");
}
function VariableOrVariableType_toString(options) {
    node_opcua_assert_1.assert(options);
    const _private = BaseNode_getPrivate(this);
    if (this.dataType) {
        const addressSpace = this.addressSpace;
        const d = addressSpace.findNode(this.dataType);
        const n = d ? "(" + d.browseName.toString() + ")" : " (???)";
        options.add(options.padding + chalk_1.default.yellow("          dataType            : ") + this.dataType + "  " + n);
    }
    if (this.nodeClass === node_opcua_data_model_1.NodeClass.Variable) {
        if (this._dataValue) {
            options.add(options.padding + chalk_1.default.yellow("          value               : ") + "\n" +
                options.indent(this._dataValue.toString(), options.padding + "                        | "));
        }
    }
    if (this.accessLevel) {
        options.add(options.padding + chalk_1.default.yellow("          accessLevel         : ") + " " +
            accessLevelFlagToString(this.accessLevel));
    }
    if (this.userAccessLevel) {
        options.add(options.padding + chalk_1.default.yellow("          userAccessLevel     : ") + " " +
            accessLevelFlagToString(this.userAccessLevel));
    }
    if (this.hasOwnProperty("valueRank")) {
        options.add(options.padding + chalk_1.default.yellow("          valueRank           : ") + " " +
            this.valueRank.toString());
    }
    if (this.minimumSamplingInterval !== undefined) {
        options.add(options.padding + chalk_1.default.yellow(" minimumSamplingInterval      : ") + " " +
            this.minimumSamplingInterval.toString() + " ms");
    }
}
exports.VariableOrVariableType_toString = VariableOrVariableType_toString;
/**
 * clone properties and methods
 * @private
 */
function _clone_collection_new(newParent, collectionRef, optionalFilter, extraInfo) {
    const addressSpace = newParent.addressSpace;
    node_opcua_assert_1.assert(!optionalFilter || (_.isFunction(optionalFilter.shouldKeep) && _.isFunction(optionalFilter.filterFor)));
    for (const reference of collectionRef) {
        const node = reference_1.Reference.resolveReferenceNode(addressSpace, reference);
        // ensure node is of the correct type,
        // it may happen that the xmlnodeset2 file was malformed
        // istanbul ignore next
        if (!_.isFunction(node.clone)) {
            // tslint:disable-next-line:no-console
            console.log(chalk_1.default.red("Warning : cannot clone node ") +
                node.browseName.toString() +
                " of class " + node_opcua_data_model_1.NodeClass[node.nodeClass].toString() +
                " while cloning " + newParent.browseName.toString());
            continue;
        }
        if (optionalFilter && !optionalFilter.shouldKeep(node)) {
            continue; // skip this node
        }
        node_opcua_assert_1.assert(reference.isForward);
        node_opcua_assert_1.assert(reference.referenceType instanceof node_opcua_nodeid_1.NodeId, "" + reference.referenceType.toString());
        const options = {
            references: [
                { referenceType: reference.referenceType, isForward: false, nodeId: newParent.nodeId }
            ]
        };
        const clone = node.clone(options, optionalFilter, extraInfo);
        if (extraInfo) {
            extraInfo.registerClonedObject(node, clone);
        }
    }
}
function _clone_children_references(newParent, optionalFilter, extraInfo) {
    // find all reference that derives from the Aggregates
    const aggregatesRef = this.findReferencesEx("Aggregates", node_opcua_data_model_1.BrowseDirection.Forward);
    _clone_collection_new.call(this, newParent, aggregatesRef, optionalFilter, extraInfo);
}
exports._clone_children_references = _clone_children_references;
function _clone_non_hierarchical_references(newParent, optionalFilter, extraInfo) {
    // clone only some non hierarchical_references that we do want to clone
    // such as
    //   HasSubStateMachine
    node_opcua_assert_1.assert(newParent instanceof base_node_1.BaseNode);
    // find all reference that derives from the HasSubStateMachine
    const references = this.findReferencesEx("HasSubStateMachine", node_opcua_data_model_1.BrowseDirection.Forward);
    _clone_collection_new.call(this, newParent, references, optionalFilter, extraInfo);
}
exports._clone_non_hierarchical_references = _clone_non_hierarchical_references;
/**
 * @method _clone
 * @private
 */
function _clone(Constructor, options, optionalFilter, extraInfo) {
    node_opcua_assert_1.assert(_.isFunction(Constructor));
    node_opcua_assert_1.assert(_.isObject(options));
    node_opcua_assert_1.assert(!extraInfo || (_.isObject(extraInfo) && _.isFunction(extraInfo.registerClonedObject)));
    node_opcua_assert_1.assert(!this.subtypeOf, "We do not do cloning of Type yet");
    options = _.extend(options, {
        addressSpace: this.addressSpace,
        browseName: this.browseName,
        description: this.description,
        displayName: this.displayName,
    });
    options.references = options.references || [];
    if (this.typeDefinition) {
        options.references.push({
            isForward: true,
            nodeId: this.typeDefinition,
            referenceType: "HasTypeDefinition",
        });
    }
    if (!options.modellingRule) {
        if (this.modellingRule) {
            const modellingRuleNode = this.findReferencesAsObject("HasModellingRule")[0];
            node_opcua_assert_1.assert(modellingRuleNode);
            options.references.push({
                isForward: true,
                nodeId: modellingRuleNode.nodeId,
                referenceType: "HasModellingRule",
            });
        }
    }
    else {
        namespace_private_1.UANamespace_process_modelling_rule(options.references, options.modellingRule);
    }
    options.nodeId = this.addressSpace.getOwnNamespace()._construct_nodeId(options);
    node_opcua_assert_1.assert(options.nodeId instanceof node_opcua_nodeid_1.NodeId);
    const cloneObj = new Constructor(options);
    this.addressSpace._register(cloneObj);
    const newFilter = optionalFilter ? optionalFilter.filterFor(cloneObj) : null;
    _clone_children_references.call(this, cloneObj, newFilter, extraInfo);
    _clone_non_hierarchical_references.call(this, cloneObj, newFilter, extraInfo);
    cloneObj.propagate_back_references();
    cloneObj.install_extra_properties();
    return cloneObj;
}
exports._clone = _clone;
function _handle_HierarchicalReference(node, reference) {
    const _private = BaseNode_getPrivate(node);
    if (_private._cache._childByNameMap) {
        const addressSpace = node.addressSpace;
        const referenceType = reference_1.Reference.resolveReferenceType(addressSpace, reference);
        if (referenceType) {
            const HierarchicalReferencesType = addressSpace.findReferenceType("HierarchicalReferences");
            // xx console.log ("HierarchicalReferencesType",HierarchicalReferencesType.toString());
            if (referenceType.isSupertypeOf(HierarchicalReferencesType)) {
                node_opcua_assert_1.assert(reference.isForward);
                const targetNode = reference_1.Reference.resolveReferenceNode(addressSpace, reference);
                // Xx console.log(" adding object to map");
                _private._cache._childByNameMap[targetNode.browseName.name.toString()] = targetNode;
            }
        }
    }
}
exports._handle_HierarchicalReference = _handle_HierarchicalReference;
function _remove_HierarchicalReference(node, reference) {
    const _private = BaseNode_getPrivate(node);
    if (_private._cache._childByNameMap) {
        const addressSpace = node.addressSpace;
        const referenceType = reference_1.Reference.resolveReferenceType(addressSpace, reference);
        if (referenceType) {
            const HierarchicalReferencesType = addressSpace.findReferenceType("HierarchicalReferences");
            if (referenceType.isSupertypeOf(HierarchicalReferencesType)) {
                node_opcua_assert_1.assert(reference.isForward);
                const targetNode = reference_1.Reference.resolveReferenceNode(addressSpace, reference);
                // Xx console.log(" adding object to map");
                delete _private._cache._childByNameMap[targetNode.browseName.name.toString()];
            }
        }
    }
}
function _makeReferenceDescription(addressSpace, reference, resultMask) {
    const isForward = reference.isForward;
    const referenceTypeId = reference_1.Reference.resolveReferenceType(addressSpace, reference).nodeId;
    node_opcua_assert_1.assert(referenceTypeId instanceof node_opcua_nodeid_1.NodeId);
    const obj = reference_1.Reference.resolveReferenceNode(addressSpace, reference);
    let data = {};
    if (!obj) {
        // cannot find reference node
        data = {
            isForward,
            nodeId: reference.nodeId,
            referenceTypeId: (resultMask & node_opcua_data_model_1.ResultMask.ReferenceType) ? referenceTypeId : null,
            typeDefinition: null
        };
    }
    else {
        node_opcua_assert_1.assert(reference.nodeId, " obj.nodeId");
        data = {
            browseName: (resultMask & node_opcua_data_model_1.ResultMask.BrowseName) ? node_opcua_data_model_1.coerceQualifiedName(obj.browseName) : null,
            displayName: (resultMask & node_opcua_data_model_1.ResultMask.DisplayName) ? node_opcua_data_model_1.coerceLocalizedText(obj.displayName[0]) : null,
            isForward: (resultMask & node_opcua_data_model_1.ResultMask.IsForward) ? isForward : false,
            nodeClass: (resultMask & node_opcua_data_model_1.ResultMask.NodeClass) ? obj.nodeClass : node_opcua_data_model_1.NodeClass.Unspecified,
            nodeId: obj.nodeId,
            referenceTypeId: (resultMask & node_opcua_data_model_1.ResultMask.ReferenceType) ? referenceTypeId : null,
            typeDefinition: (resultMask & node_opcua_data_model_1.ResultMask.TypeDefinition) ? obj.typeDefinition : null
        };
    }
    if (data.typeDefinition === null) {
        data.typeDefinition = node_opcua_nodeid_1.NodeId.nullNodeId;
    }
    const referenceDescription = new node_opcua_types_1.ReferenceDescription(data);
    return referenceDescription;
}
function _constructReferenceDescription(addressSpace, references, resultMask) {
    node_opcua_assert_1.assert(_.isArray(references));
    return references.map((reference) => _makeReferenceDescription(addressSpace, reference, resultMask));
}
exports._constructReferenceDescription = _constructReferenceDescription;
function BaseNode_remove_backward_reference(reference) {
    const _private = BaseNode_getPrivate(this);
    _remove_HierarchicalReference(this, reference);
    const h = reference.hash;
    if (_private._back_referenceIdx[h]) {
        // note : h may not exist in _back_referenceIdx since we are not indexing
        //        _back_referenceIdx to UAObjectType and UAVariableType for performance reasons
        _private._back_referenceIdx[h].dispose();
        delete _private._back_referenceIdx[h];
    }
    reference.dispose();
}
exports.BaseNode_remove_backward_reference = BaseNode_remove_backward_reference;
function BaseNode_add_backward_reference(reference) {
    const _private = BaseNode_getPrivate(this);
    const h = reference.hash;
    node_opcua_assert_1.assert(_.isString(h));
    // istanbul ignore next
    if (_private._referenceIdx[h]) {
        //  the reference exists already in the forward references
        //  this append for instance when the XML NotSetFile has redundant <Reference>
        //  in this case there is nothing to do
        return;
    }
    // istanbul ignore next
    if (_private._back_referenceIdx[h]) {
        const opts = { addressSpace: this.addressSpace };
        // tslint:disable-next-line:no-console
        console.warn(" Warning !", this.browseName.toString());
        // tslint:disable-next-line:no-console
        console.warn("    ", reference.toString(opts));
        // tslint:disable-next-line:no-console
        console.warn(" already found in ===>");
        // tslint:disable-next-line:no-console
        console.warn(_.map(_private._back_referenceIdx, (c) => c.toString(opts)).join("\n"));
        // tslint:disable-next-line:no-console
        console.warn("===>");
        throw new Error("reference exists already in _back_references");
    }
    if (!reference._referenceType) {
        const stop_here = 1;
    }
    //  assert(reference._referenceType instanceof ReferenceType);
    _private._back_referenceIdx[h] = reference;
    _handle_HierarchicalReference(this, reference);
    this._clear_caches();
}
exports.BaseNode_add_backward_reference = BaseNode_add_backward_reference;
function _get_idx(referenceType) {
    const possibleReferenceTypes = referenceType.getAllSubtypes();
    // create a index of reference type with browseName as key for faster search
    const keys = {};
    for (const refType of possibleReferenceTypes) {
        keys[refType.nodeId.toString()] = refType;
    }
    return keys;
}
exports.ReferenceTypeCounter = { count: 0 };
/**
 * getSubtypeIndex
 * @returns {null|*}
 * @private
 */
function getSubtypeIndex() {
    const _cache = BaseNode_getPrivate(this);
    if (_cache._subtype_idxVersion < exports.ReferenceTypeCounter.count) {
        // the cache need to be invalidated
        _cache._subtype_idx = null;
    }
    else {
        // tslint:disable:no-empty
    }
    if (!_cache._subtype_idx) {
        _cache._subtype_idx = _get_idx(this);
        _cache._subtype_idxVersion = exports.ReferenceTypeCounter.count;
    }
    return _cache._subtype_idx;
}
exports.getSubtypeIndex = getSubtypeIndex;
function apply_condition_refresh(_cache) {
    // visit all notifiers recursively
    _cache = _cache || {};
    const notifiers = this.getNotifiers();
    const eventSources = this.getEventSources();
    const conditions = this.findReferencesAsObject("HasCondition", true);
    for (const condition of conditions) {
        if (condition instanceof source_1.UAConditionBase) {
            condition._resend_conditionEvents();
        }
    }
    const arr = [].concat(notifiers, eventSources);
    for (const notifier of arr) {
        const key = notifier.nodeId.toString();
        if (!_cache[key]) {
            _cache[key] = notifier;
            if (notifier._conditionRefresh) {
                notifier._conditionRefresh(_cache);
            }
        }
    }
}
exports.apply_condition_refresh = apply_condition_refresh;
//# sourceMappingURL=base_node_private.js.map