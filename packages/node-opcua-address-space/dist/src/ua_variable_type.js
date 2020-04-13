"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:max-classes-per-file
// tslint:disable:no-console
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_model_3 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_utils_1 = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const node_opcua_variant_3 = require("node-opcua-variant");
const source_1 = require("../source");
const base_node_1 = require("./base_node");
const base_node_private_1 = require("./base_node_private");
const session_context_1 = require("./session_context");
const tools = require("./tool_isSupertypeOf");
const tool_isSupertypeOf_1 = require("./tool_isSupertypeOf");
const tool_isSupertypeOf_2 = require("./tool_isSupertypeOf");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
class UAVariableType extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_1.NodeClass.VariableType;
        this.isSupertypeOf = tools.construct_isSupertypeOf(UAVariableType);
        this.accessLevel = 0;
        this.userAccessLevel = 0;
        this.minimumSamplingInterval = 0;
        this.historizing = node_opcua_utils_1.isNullOrUndefined(options.historizing) ? false : options.historizing;
        this.isAbstract = node_opcua_utils_1.isNullOrUndefined(options.isAbstract) ? false : options.isAbstract;
        this.value = options.value; // optional default value for instances of this UAVariableType
        this.dataType = node_opcua_nodeid_1.coerceNodeId(options.dataType); // DataType (NodeId)
        this.valueRank = options.valueRank || 0; // Int32
        // see OPC-UA part 5 : $3.7 Conventions for Node descriptions
        this.arrayDimensions = options.arrayDimensions || [];
        node_opcua_assert_1.assert(_.isArray(this.arrayDimensions));
        if (options.value) {
            this.value = new node_opcua_variant_2.Variant(options.value);
            // xx console.log("setting ",this.value.toString());
        }
    }
    get subtypeOf() {
        return tool_isSupertypeOf_2.get_subtypeOf.call(this);
    }
    get subtypeOfObj() {
        return tool_isSupertypeOf_1.get_subtypeOfObj.call(this);
    }
    readAttribute(context, attributeId) {
        node_opcua_assert_1.assert(!context || context instanceof session_context_1.SessionContext);
        const options = {};
        switch (attributeId) {
            case node_opcua_data_model_3.AttributeIds.IsAbstract:
                options.value = { dataType: node_opcua_variant_1.DataType.Boolean, value: this.isAbstract ? true : false };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            case node_opcua_data_model_3.AttributeIds.Value:
                if (this.hasOwnProperty("value") && this.value !== undefined) {
                    node_opcua_assert_1.assert(this.value.schema.name === "Variant");
                    options.value = this.value;
                    options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                }
                else {
                    debugLog(" warning Value not implemented");
                    options.value = { dataType: node_opcua_variant_1.DataType.UInt32, value: 0 };
                    options.statusCode = node_opcua_status_code_1.StatusCodes.BadAttributeIdInvalid;
                }
                break;
            case node_opcua_data_model_3.AttributeIds.DataType:
                node_opcua_assert_1.assert(this.dataType instanceof node_opcua_nodeid_1.NodeId);
                options.value = { dataType: node_opcua_variant_1.DataType.NodeId, value: this.dataType };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            case node_opcua_data_model_3.AttributeIds.ValueRank:
                options.value = { dataType: node_opcua_variant_1.DataType.Int32, value: this.valueRank };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            case node_opcua_data_model_3.AttributeIds.ArrayDimensions:
                node_opcua_assert_1.assert(_.isArray(this.arrayDimensions) || this.arrayDimensions === null);
                options.value = {
                    arrayType: node_opcua_variant_3.VariantArrayType.Array,
                    dataType: node_opcua_variant_1.DataType.UInt32,
                    value: this.arrayDimensions
                };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            default:
                return super.readAttribute(context, attributeId);
        }
        return new node_opcua_data_value_1.DataValue(options);
    }
    toString() {
        const options = new base_node_private_1.ToStringBuilder();
        base_node_private_1.UAVariableType_toString.call(this, options);
        return options.toString();
    }
    /**
     * instantiate an object of this UAVariableType
     * The instantiation takes care of object type inheritance when constructing inner properties
     * @method instantiate
     * @param options
     * @param options.browseName
     * @param [options.description]
     * @param [options.organizedBy]   the parent Folder holding this object
     * @param [options.componentOf]   the parent Object holding this object
     * @param [options.notifierOf]
     * @param [options.eventSourceOf]
     * @param [options.optionals]     array of browseName of optional component/property to instantiate.
     * @param [options.modellingRule]
     * @param [options.minimumSamplingInterval =0]
     * @param [options.extensionObject =null]
     * Note : HasComponent usage scope
     *
     *    Source          |     Destination
     * -------------------+---------------------------
     *  Object            | Object, Variable,Method
     *  ObjectType        |
     * -------------------+---------------------------
     *  DataVariable      | Variable
     *  DataVariableType  |
     *
     *
     *  see : OPCUA 1.03 page 44 $6.4 Instances of ObjectTypes and VariableTypes
     */
    instantiate(options) {
        const addressSpace = this.addressSpace;
        // xx assert(!this.isAbstract, "cannot instantiate abstract UAVariableType");
        node_opcua_assert_1.assert(options, "missing option object");
        node_opcua_assert_1.assert(_.isString(options.browseName) || _.isObject(options.browseName), "expecting a browse name");
        node_opcua_assert_1.assert(!options.hasOwnProperty("propertyOf"), "Use addressSpace#addVariable({ propertyOf: xxx}); to add a property");
        assertUnusedChildBrowseName(addressSpace, options);
        const baseVariableType = addressSpace.findVariableType("BaseVariableType");
        node_opcua_assert_1.assert(baseVariableType, "BaseVariableType must be defined in the address space");
        let dataType = (options.dataType !== undefined) ? options.dataType : this.dataType;
        // may be required (i.e YArrayItemType )
        dataType = this.resolveNodeId(dataType); // DataType (NodeId)
        node_opcua_assert_1.assert(dataType instanceof node_opcua_nodeid_1.NodeId);
        const valueRank = (options.valueRank !== undefined) ? options.valueRank : this.valueRank;
        const arrayDimensions = (options.arrayDimensions !== undefined)
            ? options.arrayDimensions : this.arrayDimensions;
        // istanbul ignore next
        if (!dataType || dataType.isEmpty()) {
            console.warn(" options.dataType", options.dataType ? options.dataType.toString() : "<null>");
            console.warn(" this.dataType", this.dataType ? this.dataType.toString() : "<null>");
            throw new Error(" A valid dataType must be specified");
        }
        const opts = {
            arrayDimensions,
            browseName: options.browseName,
            componentOf: options.componentOf,
            dataType,
            description: options.description || this.description,
            eventSourceOf: options.eventSourceOf,
            minimumSamplingInterval: options.minimumSamplingInterval,
            modellingRule: options.modellingRule,
            nodeId: options.nodeId,
            notifierOf: options.notifierOf,
            organizedBy: options.organizedBy,
            typeDefinition: this.nodeId,
            value: options.value,
            valueRank
        };
        const namespace = addressSpace.getOwnNamespace();
        const instance = namespace.addVariable(opts);
        // xx assert(instance.minimumSamplingInterval === options.minimumSamplingInterval);
        initialize_properties_and_components(instance, baseVariableType, this, options.optionals);
        // if VariableType is a type of Structure DataType
        // we need to instantiate a dataValue
        // and create a bidirectional binding with the individual properties of this type
        instance.bindExtensionObject(options.extensionObject);
        node_opcua_assert_1.assert(instance.typeDefinition.toString() === this.nodeId.toString());
        instance.install_extra_properties();
        if (this._postInstantiateFunc) {
            this._postInstantiateFunc(instance, this);
        }
        return instance;
    }
}
exports.UAVariableType = UAVariableType;
/**
 * return true if node is a mandatory child or a requested optional
 * @method MandatoryChildOrRequestedOptionalFilter
 * @param instance
 * @param optionalsMap
 * @return {Boolean}
 */
class MandatoryChildOrRequestedOptionalFilter {
    constructor(instance, optionalsMap) {
        // should we clone the node to be a component or propertyOf of a instance
        node_opcua_assert_1.assert(_.isObject(optionalsMap));
        node_opcua_assert_1.assert(null !== instance);
        this.optionalsMap = optionalsMap;
        this.instance = instance;
        this.references = instance.allReferences();
    }
    shouldKeep(node) {
        const addressSpace = node.addressSpace;
        const alreadyIn = this.references.filter((r) => {
            const n = addressSpace.findNode(r.nodeId);
            // istanbul ignore next
            if (!n) {
                console.log(" cannot find node ", r.nodeId.toString());
                return false;
            }
            return n.browseName.name.toString() === node.browseName.name.toString();
        });
        if (alreadyIn.length > 0) {
            node_opcua_assert_1.assert(alreadyIn.length === 1, "Duplication found ?");
            // a child with the same browse name has already been install
            // probably from a SuperClass, we should ignore this.
            return false; // ignore
        }
        const modellingRule = node.modellingRule;
        switch (modellingRule) {
            case null:
            case undefined:
                return false; // skip
            case "Mandatory":
                return true; // keep;
            case "Optional":
                // only if in requested optionals
                return (node.browseName.name in this.optionalsMap);
            case "OptionalPlaceHolder":
                return false; // ignored
            default:
                return false; // ignored
        }
    }
    filterFor(childinstance) {
        const browseName = childinstance.browseName.name;
        let map = {};
        if (browseName in this.optionalsMap) {
            map = this.optionalsMap[browseName];
        }
        const newFilter = new MandatoryChildOrRequestedOptionalFilter(childinstance, map);
        return newFilter;
    }
}
/*
 * @function _get_parent_as_VariableOrObjectType
 * @param originalObject
 * @return {null|BaseNode}
 * @private
 */
function _get_parent_as_VariableOrObjectType(originalObject) {
    if (originalObject.nodeClass === node_opcua_data_model_1.NodeClass.Method) {
        return null;
    }
    const addressSpace = originalObject.addressSpace;
    const parents = originalObject.findReferencesEx("HasChild", node_opcua_data_model_2.BrowseDirection.Inverse);
    // istanbul ignore next
    if (parents.length > 1) {
        console.warn(" object ", originalObject.browseName.toString(), " has more than one parent !");
        console.warn(originalObject.toString());
        console.warn(" parents : ");
        for (const parent of parents) {
            console.log("     ", parent.toString(), addressSpace.findNode(parent.nodeId).browseName.toString());
        }
        return null;
    }
    node_opcua_assert_1.assert(parents.length === 0 || parents.length === 1);
    if (parents.length === 0) {
        return null;
    }
    const theParent = addressSpace.findNode(parents[0].nodeId);
    if (theParent && (theParent.nodeClass === node_opcua_data_model_1.NodeClass.VariableType || theParent.nodeClass === node_opcua_data_model_1.NodeClass.ObjectType)) {
        return theParent;
    }
    return null;
}
class CloneHelper {
    constructor() {
        this.mapOrgToClone = {};
    }
    registerClonedObject(objInType, clonedObj) {
        this.mapOrgToClone[objInType.nodeId.toString()] = {
            cloned: clonedObj,
            original: objInType
        };
        //
        //   /-----------------------------\
        //   | AcknowledgableConditionType |
        //   \-----------------------------/
        //              ^        |
        //              |        +---------------------|- (EnabledState)   (shadow element)
        //              |
        //   /-----------------------------\
        //   |        AlarmConditionType   |
        //   \-----------------------------/
        //              |
        //              +-------------------------------|- EnabledState    <
        //
        // find also child object with the same browse name that are
        // overridden in the SuperType
        //
        const origParent = _get_parent_as_VariableOrObjectType(objInType);
        if (origParent) {
            let base = origParent.subtypeOfObj;
            while (base) {
                const shadowChild = base.getChildByName(objInType.browseName);
                if (shadowChild) {
                    this.mapOrgToClone[shadowChild.nodeId.toString()] = {
                        cloned: clonedObj,
                        original: shadowChild
                    };
                }
                base = base.subtypeOfObj;
            }
        }
        // find subTypeOf
    }
}
// install properties and components on a instantiated Object
//
// based on their ModelingRule
//  => Mandatory                 => Installed
//  => Optional                  => Not Installed , unless it appear in optionals array
//  => OptionalPlaceHolder       => Not Installed
//  => null (no modelling rule ) => Not Installed
//
function _initialize_properties_and_components(instance, topMostType, typeNode, optionalsMap, extraInfo) {
    if (doDebug) {
        console.log("instance browseName =", instance.browseName.toString());
        console.log("typeNode         =", typeNode.browseName.toString());
        console.log("optionalsMap     =", Object.keys(optionalsMap).join(" "));
        const c = typeNode.findReferencesEx("Aggregates");
        console.log("type possibilities      =", c.map((x) => x.node.browseName.toString()).join(" "));
    }
    optionalsMap = optionalsMap || {};
    if (node_opcua_nodeid_1.sameNodeId(topMostType.nodeId, typeNode.nodeId)) {
        return; // nothing to do
    }
    const baseTypeNodeId = typeNode.subtypeOf;
    const baseType = typeNode.subtypeOfObj;
    // istanbul ignore next
    if (!baseType) {
        throw new Error(chalk_1.default.red("Cannot find object with nodeId ") + baseTypeNodeId);
    }
    const filter = new MandatoryChildOrRequestedOptionalFilter(instance, optionalsMap);
    base_node_private_1._clone_children_references.call(typeNode, instance, filter, extraInfo);
    // get properties and components from base class
    _initialize_properties_and_components(instance, topMostType, baseType, optionalsMap, extraInfo);
}
/**
 * @method hasChildWithBrowseName
 * returns true if the parent object has a child  with the provided browseName
 * @param parent
 * @param childBrowseName
 */
function hasChildWithBrowseName(parent, childBrowseName) {
    if (!parent) {
        throw Error("Internal error");
    }
    // extract children
    const children = parent.findReferencesAsObject("HasChild", true);
    return children.filter((child) => {
        return child.browseName.name.toString() === childBrowseName;
    }).length > 0;
}
function getParent(addressSpace, options) {
    const parent = options.componentOf || options.organizedBy;
    if (parent instanceof node_opcua_nodeid_1.NodeId) {
        return addressSpace.findNode(parent);
    }
    return parent;
}
function assertUnusedChildBrowseName(addressSpace, options) {
    function resolveOptionalObject(node) {
        return node ? addressSpace._coerceNode(node) : null;
    }
    options.componentOf = resolveOptionalObject(options.componentOf);
    options.organizedBy = resolveOptionalObject(options.organizedBy);
    node_opcua_assert_1.assert(!(options.componentOf && options.organizedBy));
    const parent = getParent(addressSpace, options);
    if (!parent) {
        return;
    }
    node_opcua_assert_1.assert(_.isObject(parent));
    if (!(parent instanceof base_node_1.BaseNode)) {
        throw new Error("Invalid parent  parent is " + parent.constructor.name);
    }
    // istanbul ignore next
    // verify that no components already exists in parent
    if (parent && hasChildWithBrowseName(parent, options.browseName)) {
        throw new Error("object " + parent.browseName.name.toString() +
            " have already a child with browseName " + options.browseName.toString());
    }
}
exports.assertUnusedChildBrowseName = assertUnusedChildBrowseName;
exports.assertUnusedChildBrowseName = assertUnusedChildBrowseName;
exports.initialize_properties_and_components = initialize_properties_and_components;
const hasTypeDefinitionNodeId = node_opcua_nodeid_1.makeNodeId(40);
const hasModellingRuleNodeId = node_opcua_nodeid_1.makeNodeId(37);
function _remove_unwanted_ref(references) {
    // filter out HasTypeDefinition (i=40) , HasModellingRule (i=37);
    references = _.filter(references, (reference) => {
        return !node_opcua_nodeid_1.sameNodeId(reference.referenceType, hasTypeDefinitionNodeId) &&
            !node_opcua_nodeid_1.sameNodeId(reference.referenceType, hasModellingRuleNodeId);
    });
    return references;
}
// todo: MEMOIZE this method
function findNonHierarchicalReferences(originalObject) {
    const addressSpace = originalObject.addressSpace;
    const referenceId = addressSpace.findReferenceType("NonHierarchicalReferences");
    if (!referenceId) {
        return [];
    }
    node_opcua_assert_1.assert(referenceId);
    // we need to explore
    let references = originalObject.findReferencesEx("NonHierarchicalReferences", node_opcua_data_model_2.BrowseDirection.Inverse);
    references = [].concat(references, originalObject.findReferencesEx("HasEventSource", node_opcua_data_model_2.BrowseDirection.Inverse));
    const parent = _get_parent_as_VariableOrObjectType(originalObject);
    if (parent && parent.subtypeOfObj) {
        // parent is a ObjectType or VariableType and is not a root type
        node_opcua_assert_1.assert(parent.nodeClass === node_opcua_data_model_1.NodeClass.VariableType || parent.nodeClass === node_opcua_data_model_1.NodeClass.ObjectType);
        // let investigate the same child base child
        const child = parent.subtypeOfObj.getChildByName(originalObject.browseName);
        if (child) {
            const baseRef = findNonHierarchicalReferences(child);
            // xx console.log("  ... ",originalObject.browseName.toString(),
            // parent.browseName.toString(), references.length, baseRef.length);
            references = [].concat(references, baseRef);
        }
    }
    // perform some cleanup
    references = _remove_unwanted_ref(references);
    return references;
}
function reconstructNonHierarchicalReferences(extraInfo) {
    function findImplementedObject(ref) {
        const info = extraInfo.mapOrgToClone[ref.nodeId.toString()];
        if (info) {
            return info;
        }
        return null;
    }
    // navigate through original objects to find those that are being references by node that
    // have been cloned .
    // this could be node organized by some FunctionalGroup
    //
    _.forEach(extraInfo.mapOrgToClone, (value, key) => {
        const originalObject = value.original;
        const clonedObject = value.cloned;
        // find NonHierarchical References on original object
        const originalNonHierarchical = findNonHierarchicalReferences(originalObject);
        if (originalNonHierarchical.length === 0) {
            return;
        }
        // istanbul ignore next
        if (doDebug) {
            debugLog(" investigation ", value.original.browseName.toString(), value.cloned.nodeClass.toString(), value.original.nodeClass.toString(), value.original.nodeId.toString(), value.cloned.nodeId.toString());
        }
        originalNonHierarchical.forEach((ref) => {
            const info = findImplementedObject(ref);
            // if the object pointed by this reference is also cloned ...
            if (info) {
                const originalDest = info.original;
                const cloneDest = info.cloned;
                // istanbul ignore next
                if (doDebug) {
                    debugLog(chalk_1.default.cyan("   adding reference "), ref.referenceType, " from cloned ", clonedObject.nodeId.toString(), clonedObject.browseName.toString(), " to cloned ", cloneDest.nodeId.toString(), cloneDest.browseName.toString());
                }
                // restore reference
                clonedObject.addReference({
                    isForward: false,
                    nodeId: cloneDest.nodeId,
                    referenceType: ref.referenceType
                });
            }
        });
    });
}
/**
 * recreate functional group types according to type definition
 *
 * @method reconstructFunctionalGroupType
 * @param baseType
 */
/* @example:
 *
 *    MyDeviceType
 *        |
 *        +----------|- ParameterSet(BaseObjectType)
 *        |                   |
 *        |                   +-----------------|- Parameter1
 *        |                                             ^
 *        +----------|- Config(FunctionalGroupType)     |
 *                                |                     |
 *                                +-------- Organizes---+
 */
function reconstructFunctionalGroupType(extraInfo) {
    // navigate through original objects to find those that are being organized by some FunctionalGroup
    _.forEach(extraInfo.mapOrgToClone, (value, key) => {
        const originalObject = value.original;
        const instantiatedObject = value.cloned;
        const organizedByArray = originalObject.findReferencesEx("Organizes", node_opcua_data_model_2.BrowseDirection.Inverse);
        // function dumpRef(r) {
        //    var referenceTd = addressSpace.findNode(r.referenceTypeId);
        //    var obj = addressSpace.findNode(r.nodeId);
        //    return "<-- " + referenceTd.browseName.toString() + " -- " + obj.browseName.toString();
        // }
        //
        // console.log("xxxxx ========================================================",
        //    originalObject.browseName.toString(),
        //    organizedByArray.map(dumpRef).join("\n"));
        organizedByArray.forEach((ref) => {
            if (extraInfo.mapOrgToClone.hasOwnProperty(ref.nodeId.toString())) {
                const info = extraInfo.mapOrgToClone[ref.nodeId.toString()];
                const folder = info.original;
                node_opcua_assert_1.assert(folder.typeDefinitionObj.browseName.name.toString() === "FunctionalGroupType");
                // now create the same reference with the instantiated function group
                const destFolder = info.cloned;
                node_opcua_assert_1.assert(ref.referenceType);
                destFolder.addReference({
                    isForward: !ref.isForward,
                    nodeId: instantiatedObject.nodeId,
                    referenceType: ref.referenceType
                });
                // xx console.log("xxx ============> adding reference ",ref.browse )
            }
        });
    });
}
function initialize_properties_and_components(instance, topMostType, nodeType, optionals) {
    const extraInfo = new CloneHelper();
    extraInfo.registerClonedObject(nodeType, instance);
    const optionalsMap = source_1.makeOptionalsMap(optionals);
    _initialize_properties_and_components(instance, topMostType, nodeType, optionalsMap, extraInfo);
    reconstructFunctionalGroupType(extraInfo);
    reconstructNonHierarchicalReferences(extraInfo);
}
exports.initialize_properties_and_components = initialize_properties_and_components;
//# sourceMappingURL=ua_variable_type.js.map