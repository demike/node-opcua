"use strict";
/**
 * @module node-opcua-secure-channel
 */
// tslint:disable:max-line-length
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const secure_message_chunk_manager_1 = require("./secure_message_chunk_manager");
const sequence_number_generator_1 = require("./sequence_number_generator");
/**
 * @class MessageChunker
 * @param options {Object}
 * @param options.securityHeader  {Object} SecurityHeader
 * @param [options.derivedKeys] {Object} derivedKeys
 * @constructor
 */
class MessageChunker {
    constructor(options) {
        this.sequenceNumberGenerator = new sequence_number_generator_1.SequenceNumberGenerator();
        this.update(options);
    }
    dispose() {
        this.securityHeader = null;
        this.derivedKeys = undefined;
        this._stream = undefined;
    }
    /***
     * update security information
     */
    update(options) {
        options = options || {};
        options.securityHeader = options.securityHeader ||
            new node_opcua_service_secure_channel_1.AsymmetricAlgorithmSecurityHeader({ securityPolicyUri: "http://opcfoundation.org/UA/SecurityPolicy#None" });
        node_opcua_assert_1.assert(_.isObject(options));
        node_opcua_assert_1.assert(_.isObject(options.securityHeader));
        this.securityHeader = options.securityHeader;
        this.derivedKeys = options.derivedKeys || undefined;
    }
    chunkSecureMessage(msgType, options, message, messageChunkCallback) {
        node_opcua_assert_1.assert(_.isFunction(messageChunkCallback));
        // calculate message size ( with its  encodingDefaultBinary)
        const binSize = message.binaryStoreSize() + 4;
        const stream = new node_opcua_binary_stream_1.BinaryStream(binSize);
        this._stream = stream;
        node_opcua_basic_types_1.encodeExpandedNodeId(message.schema.encodingDefaultBinary, stream);
        message.encode(stream);
        let securityHeader;
        if (msgType === "OPN") {
            securityHeader = this.securityHeader;
        }
        else {
            securityHeader = new node_opcua_service_secure_channel_1.SymmetricAlgorithmSecurityHeader({ tokenId: options.tokenId });
        }
        const chunkManager = new secure_message_chunk_manager_1.SecureMessageChunkManager(msgType, options, securityHeader, this.sequenceNumberGenerator);
        chunkManager
            .on("chunk", (messageChunk) => {
            messageChunkCallback(messageChunk);
        })
            .on("finished", () => {
            messageChunkCallback(null);
        });
        chunkManager.write(stream.buffer, stream.buffer.length);
        chunkManager.end();
    }
}
exports.MessageChunker = MessageChunker;
//# sourceMappingURL=message_chunker.js.map