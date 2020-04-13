"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-basic-types
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const byte_string_1 = require("./byte_string");
const guid_1 = require("./guid");
const integers_1 = require("./integers");
const string_1 = require("./string");
const utils_1 = require("./utils");
function isUInt8(value) {
    return value >= 0 && value <= 0xff;
}
function isUInt16(value) {
    return value >= 0 && value <= 0xffff;
}
function nodeID_encodingByte(nodeId) {
    if (!nodeId) {
        return 0;
    }
    node_opcua_assert_1.assert(nodeId.hasOwnProperty("identifierType"));
    let encodingByte = 0;
    if (nodeId.identifierType === node_opcua_nodeid_1.NodeIdType.NUMERIC) {
        if (isUInt8(nodeId.value) &&
            !nodeId.namespace &&
            !nodeId.namespaceUri &&
            !nodeId.serverIndex) {
            encodingByte = encodingByte | 0 /* TwoBytes */;
        }
        else if (isUInt16(nodeId.value) &&
            isUInt8(nodeId.namespace) &&
            !nodeId.namespaceUri &&
            !nodeId.serverIndex) {
            encodingByte = encodingByte | 1 /* FourBytes */;
        }
        else {
            encodingByte = encodingByte | 2 /* Numeric */;
        }
    }
    else if (nodeId.identifierType === node_opcua_nodeid_1.NodeIdType.STRING) {
        encodingByte = encodingByte | 3 /* String */;
    }
    else if (nodeId.identifierType === node_opcua_nodeid_1.NodeIdType.BYTESTRING) {
        encodingByte = encodingByte | 5 /* ByteString */;
    }
    else if (nodeId.identifierType === node_opcua_nodeid_1.NodeIdType.GUID) {
        encodingByte = encodingByte | 4 /* Guid */;
    }
    if (nodeId.hasOwnProperty("namespaceUri") && nodeId.namespaceUri) {
        encodingByte = encodingByte | 128 /* NamespaceUriFlag */;
    }
    if (nodeId.hasOwnProperty("serverIndex") && nodeId.serverIndex) {
        encodingByte = encodingByte | 64 /* ServerIndexFlag */;
    }
    return encodingByte;
}
function isValidNodeId(nodeId) {
    if (nodeId === null || nodeId === void 0) {
        return false;
    }
    return nodeId.hasOwnProperty("identifierType");
}
exports.isValidNodeId = isValidNodeId;
function randomNodeId() {
    const value = utils_1.getRandomInt(0, 0xfffff);
    const namespace = utils_1.getRandomInt(0, 3);
    return node_opcua_nodeid_1.makeNodeId(value, namespace);
}
exports.randomNodeId = randomNodeId;
function _encodeNodeId(encodingByte, nodeId, stream) {
    stream.writeUInt8(encodingByte); // encoding byte
    /*jslint bitwise: true */
    encodingByte &= 0x3f;
    switch (encodingByte) {
        case 0 /* TwoBytes */:
            stream.writeUInt8(nodeId ? nodeId.value : 0);
            break;
        case 1 /* FourBytes */:
            stream.writeUInt8(nodeId.namespace);
            stream.writeUInt16(nodeId.value);
            break;
        case 2 /* Numeric */:
            stream.writeUInt16(nodeId.namespace);
            stream.writeUInt32(nodeId.value);
            break;
        case 3 /* String */:
            stream.writeUInt16(nodeId.namespace);
            string_1.encodeString(nodeId.value, stream);
            break;
        case 5 /* ByteString */:
            stream.writeUInt16(nodeId.namespace);
            byte_string_1.encodeByteString(nodeId.value, stream);
            break;
        default:
            node_opcua_assert_1.assert(encodingByte === 4 /* Guid */);
            stream.writeUInt16(nodeId.namespace);
            guid_1.encodeGuid(nodeId.value, stream);
            break;
    }
}
function encodeNodeId(nodeId, stream) {
    let encodingByte = nodeID_encodingByte(nodeId);
    /*jslint bitwise: true */
    encodingByte &= 0x3f;
    _encodeNodeId(encodingByte, nodeId, stream);
}
exports.encodeNodeId = encodeNodeId;
function encodeExpandedNodeId(expandedNodeId, stream) {
    node_opcua_assert_1.assert(expandedNodeId, "encodeExpandedNodeId: must provide a valid expandedNodeId");
    const encodingByte = nodeID_encodingByte(expandedNodeId);
    _encodeNodeId(encodingByte, expandedNodeId, stream);
    if (encodingByte & 128 /* NamespaceUriFlag */) {
        string_1.encodeString(expandedNodeId.namespaceUri, stream);
    }
    if (encodingByte & 64 /* ServerIndexFlag */) {
        integers_1.encodeUInt32(expandedNodeId.serverIndex, stream);
    }
}
exports.encodeExpandedNodeId = encodeExpandedNodeId;
function _decodeNodeId(encodingByte, stream) {
    let value;
    let namespace;
    let nodeIdType;
    /*jslint bitwise: true */
    encodingByte &= 0x3f; // 1 to 5
    switch (encodingByte) {
        case 0 /* TwoBytes */:
            value = stream.readUInt8();
            nodeIdType = node_opcua_nodeid_1.NodeIdType.NUMERIC;
            break;
        case 1 /* FourBytes */:
            namespace = stream.readUInt8();
            value = stream.readUInt16();
            nodeIdType = node_opcua_nodeid_1.NodeIdType.NUMERIC;
            break;
        case 2 /* Numeric */:
            namespace = stream.readUInt16();
            value = stream.readUInt32();
            nodeIdType = node_opcua_nodeid_1.NodeIdType.NUMERIC;
            break;
        case 3 /* String */:
            namespace = stream.readUInt16();
            value = string_1.decodeString(stream);
            nodeIdType = node_opcua_nodeid_1.NodeIdType.STRING;
            break;
        case 5 /* ByteString */:
            namespace = stream.readUInt16();
            value = byte_string_1.decodeByteString(stream);
            nodeIdType = node_opcua_nodeid_1.NodeIdType.BYTESTRING;
            break;
        default:
            if (encodingByte !== 4 /* Guid */) {
                /*jslint bitwise: true */
                // console.log(" encoding_byte = 0x" + encodingByte.toString(16),
                //     " bin=", ("0000000000000000" + encodingByte.toString(2)).substr(-16),
                //     encodingByte, encodingByte & 0x3f);
                throw new Error(" encoding_byte = " + encodingByte.toString(16));
            }
            namespace = stream.readUInt16();
            value = guid_1.decodeGuid(stream);
            nodeIdType = node_opcua_nodeid_1.NodeIdType.GUID;
            node_opcua_assert_1.assert(guid_1.isValidGuid(value));
            break;
    }
    return new node_opcua_nodeid_1.NodeId(nodeIdType, value, namespace);
}
function decodeNodeId(stream) {
    const encodingByte = stream.readUInt8();
    return _decodeNodeId(encodingByte, stream);
}
exports.decodeNodeId = decodeNodeId;
function decodeExpandedNodeId(stream) {
    const encodingByte = stream.readUInt8();
    const expandedNodeId = _decodeNodeId(encodingByte, stream);
    expandedNodeId.namespaceUri = null;
    expandedNodeId.serverIndex = 0;
    if (encodingByte & 128 /* NamespaceUriFlag */) {
        expandedNodeId.namespaceUri = string_1.decodeString(stream);
    }
    if (encodingByte & 64 /* ServerIndexFlag */) {
        expandedNodeId.serverIndex = integers_1.decodeUInt32(stream);
    }
    const e = expandedNodeId;
    return new node_opcua_nodeid_1.ExpandedNodeId(e.identifierType, e.value, e.namespace, e.namespaceUri, e.serverIndex);
}
exports.decodeExpandedNodeId = decodeExpandedNodeId;
var node_opcua_nodeid_2 = require("node-opcua-nodeid");
exports.coerceNodeId = node_opcua_nodeid_2.coerceNodeId;
exports.coerceExpandedNodeId = node_opcua_nodeid_2.coerceExpandedNodeId;
//# sourceMappingURL=nodeid.js.map