"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const utils = require("node-opcua-utils");
const node_opcua_variant_1 = require("node-opcua-variant");
const base_node_1 = require("./base_node");
const base_node_private_1 = require("./base_node_private");
const session_context_1 = require("./session_context");
const tool_isSupertypeOf_1 = require("./tool_isSupertypeOf");
const tools = require("./tool_isSupertypeOf");
const ua_variable_type_1 = require("./ua_variable_type");
/*
UAObjectType.prototype.isSupertypeOf = tools.construct_isSupertypeOf(UAObjectType);
const initialize_properties_and_components = require("./ua_variable_type").initialize_properties_and_components;
*/
class UAObjectType extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_1.NodeClass.ObjectType;
        this.isSupertypeOf = tools.construct_isSupertypeOf(UAObjectType);
        this.isAbstract = utils.isNullOrUndefined(options.isAbstract) ? false : options.isAbstract;
    }
    /**
     * returns true if the object has some opcua methods
     */
    get hasMethods() {
        return this.getMethods().length > 0;
    }
    get subtypeOf() {
        return tool_isSupertypeOf_1.get_subtypeOf.call(this);
    }
    get subtypeOfObj() {
        return tool_isSupertypeOf_1.get_subtypeOfObj.call(this);
    }
    readAttribute(context, attributeId) {
        node_opcua_assert_1.assert(context instanceof session_context_1.SessionContext);
        const options = {};
        switch (attributeId) {
            case node_opcua_data_model_2.AttributeIds.IsAbstract:
                options.value = {
                    dataType: node_opcua_variant_1.DataType.Boolean,
                    value: !!this.isAbstract
                };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            default:
                return base_node_1.BaseNode.prototype.readAttribute.call(this, context, attributeId);
        }
        return new node_opcua_data_value_1.DataValue(options);
    }
    /**
     * instantiate an object of this UAObjectType
     * The instantiation takes care of object type inheritance when constructing inner properties and components.
     * @method instantiate
     * @param options
     * @param options.browseName
     * @param [options.description]
     * @param [options.organizedBy] the parent Folder holding this object
     * @param [options.componentOf] the parent Object holding this object
     * @param [options.notifierOf]
     * @param [options.eventSourceOf]
     * @param [options.optionals = [] name of the optional child to create
     * @param [options.modellingRule]
     *
     *
     * Note : HasComponent usage scope
     *
     *    Source          |     Destination
     * -------------------+---------------------------
     *  Object            | Object, Variable,Method
     *  ObjectType        |
     * -------------------+---------------------------
     *  DataVariable      | Variable
     *  DataVariableType  |
     */
    instantiate(options) {
        const addressSpace = this.addressSpace;
        node_opcua_assert_1.assert(!this.isAbstract, "cannot instantiate abstract UAObjectType");
        node_opcua_assert_1.assert(options, "missing option object");
        node_opcua_assert_1.assert(_.isString(options.browseName) || _.isObject(options.browseName), "expecting a browse name");
        node_opcua_assert_1.assert(!options.hasOwnProperty("propertyOf"), "an Object shall not be a PropertyOf an other object");
        node_opcua_assert_1.assert(!options.hasOwnProperty("optional"), "do you mean optionals ?");
        ua_variable_type_1.assertUnusedChildBrowseName(addressSpace, options);
        const baseObjectType = addressSpace.findObjectType("BaseObjectType");
        node_opcua_assert_1.assert(baseObjectType, "BaseObjectType must be defined in the address space");
        const references = [];
        const opts = {
            browseName: options.browseName,
            componentOf: options.componentOf,
            description: options.description || this.description,
            eventSourceOf: options.eventSourceOf,
            notifierOf: options.notifierOf,
            organizedBy: options.organizedBy,
            references,
            typeDefinition: this.nodeId,
            nodeId: options.nodeId,
            eventNotifier: options.eventNotifier === undefined ? 0 : options.eventNotifier,
            modellingRule: options.modellingRule
        };
        const namespace = this.addressSpace.getOwnNamespace();
        const instance = namespace.addObject(opts);
        ua_variable_type_1.initialize_properties_and_components(instance, baseObjectType, this, options.optionals);
        node_opcua_assert_1.assert(instance.typeDefinition.toString() === this.nodeId.toString());
        instance.install_extra_properties();
        if (this._postInstantiateFunc) {
            this._postInstantiateFunc(instance, this, options);
        }
        return instance;
    }
    toString() {
        const options = new base_node_private_1.ToStringBuilder();
        base_node_private_1.UAObjectType_toString.call(this, options);
        return options.toString();
    }
}
exports.UAObjectType = UAObjectType;
//# sourceMappingURL=ua_object_type.js.map