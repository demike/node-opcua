"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_nodeid_2 = require("node-opcua-nodeid");
const base_node_private_1 = require("./base_node_private");
const reference_1 = require("./reference");
const HasSubTypeNodeId = node_opcua_nodeid_1.resolveNodeId("HasSubtype");
function _filterSubType(reference) {
    return (node_opcua_nodeid_2.sameNodeId(reference.referenceType, HasSubTypeNodeId)
        && !reference.isForward);
}
function _slow_isSupertypeOf(Class, baseType) {
    node_opcua_assert_1.assert(this instanceof Class);
    node_opcua_assert_1.assert(baseType instanceof Class, " Object must have same type");
    node_opcua_assert_1.assert(this.addressSpace);
    if (node_opcua_nodeid_2.sameNodeId(this.nodeId, baseType.nodeId)) {
        return true;
    }
    const references = this.allReferences();
    const subTypes = references.filter(_filterSubType);
    node_opcua_assert_1.assert(subTypes.length <= 1, "should have zero or one subtype no more");
    for (const subType1 of subTypes) {
        const subTypeId = subType1.nodeId;
        const subTypeNode = this.addressSpace.findNode(subTypeId);
        // istanbul ignore next
        if (!subTypeNode) {
            throw new Error("Cannot find object with nodeId " + subTypeId.toString());
        }
        if (node_opcua_nodeid_2.sameNodeId(subTypeNode.nodeId, baseType.nodeId)) {
            return true;
        }
        else {
            if (_slow_isSupertypeOf.call(subTypeNode, Class, baseType)) {
                return true;
            }
        }
    }
    return false;
}
//  http://jsperf.com/underscore-js-memoize-refactor-test
//  http://addyosmani.com/blog/faster-javascript-memoization/
function wrap_memoize(func, hashFunc) {
    if (undefined === hashFunc) {
        hashFunc = (_p) => _p.toString();
    }
    return function memoize(param) {
        if (!this.__cache) {
            this.__cache = {};
        }
        const hash = hashFunc.call(this, param);
        let cache_value = this.__cache[hash];
        if (cache_value === undefined) {
            cache_value = func.call(this, param);
            this.__cache[hash] = cache_value;
        }
        return cache_value;
    };
}
function hashBaseNode(e) {
    return e.nodeId.value.toString();
}
function construct_isSupertypeOf(Class) {
    node_opcua_assert_1.assert(_.isFunction(Class));
    return wrap_memoize(function (baseType) {
        node_opcua_assert_1.assert(baseType instanceof Class);
        node_opcua_assert_1.assert(this instanceof Class);
        return _slow_isSupertypeOf.call(this, Class, baseType);
    }, hashBaseNode);
}
exports.construct_isSupertypeOf = construct_isSupertypeOf;
function construct_slow_isSupertypeOf(Class) {
    return function (baseType) {
        return _slow_isSupertypeOf.call(this, Class, baseType);
    };
}
exports.construct_slow_isSupertypeOf = construct_slow_isSupertypeOf;
/**
 * returns the nodeId of the Type which is the super type of this
 */
function get_subtypeOf() {
    const s = get_subtypeOfObj.call(this);
    return s ? s.nodeId : null;
}
exports.get_subtypeOf = get_subtypeOf;
function get_subtypeOfObj() {
    const _private = base_node_private_1.BaseNode_getPrivate(this);
    if (!_private._cache._subtypeOfObj) {
        const is_subtype_of_ref = this.findReference("HasSubtype", false);
        if (is_subtype_of_ref) {
            _private._cache._subtypeOfObj = reference_1.Reference.resolveReferenceNode(this.addressSpace, is_subtype_of_ref);
        }
        else {
            _private._cache._subtypeOfObj = null;
        }
    }
    return _private._cache._subtypeOfObj;
}
exports.get_subtypeOfObj = get_subtypeOfObj;
//# sourceMappingURL=tool_isSupertypeOf.js.map