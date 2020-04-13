"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-console
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const utils = require("node-opcua-utils");
function isNodeIdString(str) {
    node_opcua_assert_1.assert(typeof str === "string");
    return str.substring(0, 2) === "i=" || str.substring(0, 3) === "ns=";
}
exports.isNodeIdString = isNodeIdString;
function is_valid_reference(ref) {
    const hasRequestedProperties = ref.hasOwnProperty("referenceType") &&
        ref.hasOwnProperty("nodeId") &&
        !utils.isNullOrUndefined(ref.isForward);
    if (!hasRequestedProperties) {
        return false;
    }
    node_opcua_assert_1.assert(ref.referenceType instanceof node_opcua_nodeid_1.NodeId);
    node_opcua_assert_1.assert(!ref.node || node_opcua_nodeid_1.sameNodeId(ref.node.nodeId, ref.nodeId));
    // xx assert(!ref.referenceTypeName || typeof ref.referenceTypeName === "string");
    // xx // referenceType shall no be a nodeId string (this could happen by mistake)
    // xx assert(!isNodeIdString(ref.referenceType));
    return true;
}
/**
 * @private
 *
 * @example
 *       ---- some text ----->
 */
function _arrow(text, length, isForward) {
    length = Math.max(length, text.length + 8);
    const nb = Math.floor((length - text.length - 2) / 2);
    const h = Array(nb).join("-");
    const extra = (text.length % 2 === 1) ? "-" : "";
    if (isForward) {
        return extra + h + " " + text + " " + h + "> ";
    }
    return "<" + h + " " + text + " " + h + extra + " ";
}
function _w(str, width) {
    return (str + "                                         ").substr(0, width);
}
function _localCoerceToNodeID(nodeIdLike) {
    if (nodeIdLike.nodeId) {
        return nodeIdLike.nodeId;
    }
    return node_opcua_nodeid_1.coerceNodeId(nodeIdLike);
}
function resolveReferenceNode(addressSpace, reference) {
    const _reference = reference;
    if (!_reference.node) {
        _reference.node = addressSpace.findNode(reference.nodeId);
    }
    return _reference.node;
}
exports.resolveReferenceNode = resolveReferenceNode;
function resolveReferenceType(addressSpace, reference) {
    const _reference = reference;
    if (!_reference._referenceType) {
        if (!_reference.referenceType) {
            console.log(chalk_1.default.red("ERROR MISSING reference"), reference);
        }
        _reference._referenceType = addressSpace.findReferenceType(reference.referenceType);
    }
    return _reference._referenceType;
}
exports.resolveReferenceType = resolveReferenceType;
/**
 * @class Reference
 * @param options.referenceType {NodeId}
 * @param options.nodeId        {NodeId}
 * @param options.isForward     {Boolean}
 * @constructor
 */
class Reference {
    constructor(options) {
        node_opcua_assert_1.assert(options.referenceType instanceof node_opcua_nodeid_1.NodeId);
        node_opcua_assert_1.assert(options.nodeId instanceof node_opcua_nodeid_1.NodeId);
        this.referenceType = node_opcua_nodeid_1.coerceNodeId(options.referenceType);
        this.isForward = (options.isForward === undefined) ? true : !!options.isForward;
        this.nodeId = _localCoerceToNodeID(options.nodeId);
        // optional to speed up when AddReferenceOpts is in fact a Reference !
        this._referenceType = options._referenceType;
        this.node = options.node;
        node_opcua_assert_1.assert(is_valid_reference(this));
    }
    static resolveReferenceNode(addressSpace, reference) { return resolveReferenceNode(addressSpace, reference); }
    static resolveReferenceType(addressSpace, reference) {
        return resolveReferenceType(addressSpace, reference);
    }
    /**
     * turn reference into a arrow :   ---- ReferenceType --> [NodeId]
     * @method toString
     * @return {String}
     */
    toString(options) {
        let infoNode = _w(this.nodeId.toString(), 24);
        let refType = this.referenceType.toString();
        if (options && options.addressSpace) {
            const node = options.addressSpace.findNode(this.nodeId);
            infoNode = "[" + infoNode + "]" + _w(node.browseName.toString(), 40);
            const ref = options.addressSpace.findReferenceType(this.referenceType);
            const refNode = options.addressSpace.findNode(ref.nodeId);
            refType = refNode.browseName.toString() + " (" + ref.nodeId.toString() + ")";
        }
        return _arrow(refType, 40, this.isForward) + infoNode;
    }
    /**
     * @internal
     */
    get hash() {
        if (!this.__hash) {
            this.__hash = (this.isForward ? "" : "!") + this.referenceType.toString() + "-" + this.nodeId.toString();
        }
        return this.__hash;
    }
    /**
     * @internal
     */
    dispose() {
        this.__hash = undefined;
        this.node = undefined;
        /*
        this._referenceType = null;
        this.nodeId = null as NodeId;
        this.referenceType = null as NodeId;
        */
    }
}
exports.Reference = Reference;
//# sourceMappingURL=reference.js.map