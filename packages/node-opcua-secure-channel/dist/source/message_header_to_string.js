"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-secure-channel
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_chunkmanager_1 = require("node-opcua-chunkmanager");
const node_opcua_debug_1 = require("node-opcua-debug");
const secure_message_chunk_manager_1 = require("./secure_message_chunk_manager");
/**
 * convert the messageChunk header to a string
 * @method messageHeaderToString
 * @param messageChunk {BinaryStream}
 * @return {string}
 */
function messageHeaderToString(messageChunk) {
    const stream = new node_opcua_binary_stream_1.BinaryStream(messageChunk);
    const messageHeader = node_opcua_chunkmanager_1.readMessageHeader(stream);
    if (messageHeader.msgType === "ERR" || messageHeader.msgType === "HEL") {
        return messageHeader.msgType + " " + messageHeader.isFinal + " length   = " + messageHeader.length;
    }
    const securityHeader = secure_message_chunk_manager_1.chooseSecurityHeader(messageHeader.msgType);
    const sequenceHeader = new node_opcua_chunkmanager_1.SequenceHeader();
    node_opcua_assert_1.assert(stream.length === 8);
    const channelId = stream.readUInt32();
    securityHeader.decode(stream);
    sequenceHeader.decode(stream);
    const slice = messageChunk.slice(0, stream.length);
    return messageHeader.msgType + " " +
        messageHeader.isFinal +
        " length   = " + messageHeader.length +
        " channel  = " + channelId +
        " seqNum   = " + sequenceHeader.sequenceNumber +
        " req ID   = " + sequenceHeader.requestId +
        " security   = " + securityHeader.toString() +
        "\n\n" + node_opcua_debug_1.hexDump(slice);
}
exports.messageHeaderToString = messageHeaderToString;
//# sourceMappingURL=message_header_to_string.js.map