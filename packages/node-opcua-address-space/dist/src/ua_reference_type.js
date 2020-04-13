"use strict";
/**
 * @module node-opcua-address-space
 */
Object.defineProperty(exports, "__esModule", { value: true });
const util = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_model_3 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const source_1 = require("../source");
const base_node_1 = require("./base_node");
const base_node_private_1 = require("./base_node_private");
const tools = require("./tool_isSupertypeOf");
const tool_isSupertypeOf_1 = require("./tool_isSupertypeOf");
class UAReferenceType extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_2.NodeClass.ReferenceType;
        /**
         * returns true if self is  a super type of baseType
         */
        this.isSupertypeOf = tools.construct_isSupertypeOf(UAReferenceType);
        this._slow_isSupertypeOf = tools.construct_slow_isSupertypeOf(UAReferenceType);
        this.isAbstract = util.isNullOrUndefined(options.isAbstract) ? false : !!options.isAbstract;
        this.symmetric = util.isNullOrUndefined(options.symmetric) ? false : !!options.symmetric;
        this.inverseName = node_opcua_data_model_1.coerceLocalizedText(options.inverseName);
        base_node_private_1.ReferenceTypeCounter.count += 1;
    }
    get subtypeOfObj() {
        return tool_isSupertypeOf_1.get_subtypeOfObj.call(this);
    }
    get subtypeOf() {
        return tool_isSupertypeOf_1.get_subtypeOf.call(this);
    }
    readAttribute(context, attributeId) {
        node_opcua_assert_1.assert(!context || context instanceof source_1.SessionContext);
        const options = {};
        switch (attributeId) {
            case node_opcua_data_model_3.AttributeIds.IsAbstract:
                options.value = { dataType: node_opcua_variant_1.DataType.Boolean, value: !!this.isAbstract };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            case node_opcua_data_model_3.AttributeIds.Symmetric:
                options.value = { dataType: node_opcua_variant_1.DataType.Boolean, value: !!this.symmetric };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            case node_opcua_data_model_3.AttributeIds.InverseName: // LocalizedText
                options.value = { dataType: node_opcua_variant_1.DataType.LocalizedText, value: this.inverseName };
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            default:
                return super.readAttribute(context, attributeId);
        }
        return new node_opcua_data_value_1.DataValue(options);
    }
    toString() {
        let str = "";
        str += this.isAbstract ? "A" : " ";
        str += this.symmetric ? "S" : " ";
        str += " " + this.browseName.toString() + "/" + this.inverseName.text + " ";
        str += this.nodeId.toString();
        return str;
    }
    install_extra_properties() {
        //
    }
    /**
     * returns a array of all ReferenceTypes in the addressSpace that are self or a subType of self
     */
    getAllSubtypes() {
        const _cache = base_node_1.BaseNode._getCache(this);
        if (!_cache._allSubTypesVersion || _cache._allSubTypesVersion < base_node_private_1.ReferenceTypeCounter) {
            _cache._allSubTypes = null;
        }
        if (!_cache._allSubTypes) {
            _cache._allSubTypes = findAllSubTypes(this);
            _cache._allSubTypesVersion = base_node_private_1.ReferenceTypeCounter.count;
        }
        return _cache._allSubTypes;
    }
    is(referenceTypeString) {
        const referenceType = this.addressSpace.findReferenceType(referenceTypeString);
        return base_node_private_1.getSubtypeIndex.call(this).hasOwnProperty(referenceType.toString());
    }
}
exports.UAReferenceType = UAReferenceType;
function findAllSubTypes(referenceType) {
    const addressSpace = referenceType.addressSpace;
    const possibleReferenceTypes = [];
    const hasSubtypeReferenceType = addressSpace.findReferenceType("HasSubtype");
    function _findAllSubType(referenceTypeInner) {
        possibleReferenceTypes.push(referenceTypeInner);
        node_opcua_assert_1.assert(referenceTypeInner.nodeClass === node_opcua_data_model_2.NodeClass.ReferenceType);
        const references = referenceTypeInner.findReferences(hasSubtypeReferenceType, true);
        for (const _r of references) {
            const subType = addressSpace.findReferenceType(_r.nodeId);
            _findAllSubType(subType);
        }
    }
    _findAllSubType(referenceType);
    return possibleReferenceTypes;
}
//# sourceMappingURL=ua_reference_type.js.map