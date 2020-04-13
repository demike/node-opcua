"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_assert_1 = require("node-opcua-assert");
const source_1 = require("../source");
/**
 * @method decompose_message_body_in_chunks
 *
 * @param messageBody
 * @param msgType
 * @param chunkSize
 * @return {Array}
 *
 * wrap a message body into one or more messageChunks
 * (  use this method to build fake data blocks in tests)
 */
function decompose_message_body_in_chunks(messageBody, msgType, chunkSize) {
    node_opcua_assert_1.assert(chunkSize > 24, "expecting chunkSize");
    node_opcua_assert_1.assert(msgType.length === 3, " invalid msgType " + msgType);
    node_opcua_assert_1.assert(messageBody instanceof Buffer && messageBody.length > 0, " invalid buffer");
    const sequenceNumberGenerator = new source_1.SequenceNumberGenerator();
    const options = {
        channelId: 10,
        chunkSize,
        cipherBlockSize: 0,
        plainBlockSize: 0,
        requestId: 36,
        sequenceHeaderSize: 0,
        signatureLength: 0,
    };
    const msgChunkManager = new source_1.SecureMessageChunkManager(msgType, options, null, sequenceNumberGenerator);
    const chunks = [];
    msgChunkManager.on("chunk", (chunk) => {
        if (chunk) {
            node_opcua_assert_1.assert(chunk.length > 0);
            chunks.push(chunk);
        }
    });
    msgChunkManager.write(messageBody);
    msgChunkManager.end();
    node_opcua_assert_1.assert(chunks.length > 0, "decompose_message_body_in_chunks: must produce at least one chunk");
    return chunks;
}
exports.decompose_message_body_in_chunks = decompose_message_body_in_chunks;
//# sourceMappingURL=decompose_message_body_in_chunks.js.map