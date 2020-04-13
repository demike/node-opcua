"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-secure-channel
 */
// tslint:disable:max-line-length
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_chunkmanager_1 = require("node-opcua-chunkmanager");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const _ = require("underscore");
function chooseSecurityHeader(msgType) {
    return msgType === "OPN" ? new node_opcua_service_secure_channel_1.AsymmetricAlgorithmSecurityHeader() : new node_opcua_service_secure_channel_1.SymmetricAlgorithmSecurityHeader();
}
exports.chooseSecurityHeader = chooseSecurityHeader;
class SecureMessageChunkManager extends events_1.EventEmitter {
    constructor(msgType, options, securityHeader, sequenceNumberGenerator) {
        super();
        this.aborted = false;
        this.sequenceHeaderSize = 0;
        msgType = msgType || "OPN";
        this.securityHeader = securityHeader || chooseSecurityHeader(msgType);
        node_opcua_assert_1.assert(_.isObject(this.securityHeader));
        // the maximum size of a message chunk:
        // Note: OPCUA requires that chunkSize is at least 8192
        this.chunkSize = options.chunkSize || 1024 * 128;
        this.msgType = msgType;
        options.channelId = options.channelId || 0;
        node_opcua_assert_1.assert(_.isFinite(options.channelId));
        this.channelId = options.channelId;
        const requestId = options.requestId;
        this.sequenceNumberGenerator = sequenceNumberGenerator;
        node_opcua_assert_1.assert(requestId > 0, "expecting a valid request ID");
        this.sequenceHeader = new node_opcua_chunkmanager_1.SequenceHeader({ requestId, sequenceNumber: -1 });
        const securityHeaderSize = this.securityHeader.binaryStoreSize();
        const sequenceHeaderSize = this.sequenceHeader.binaryStoreSize();
        node_opcua_assert_1.assert(sequenceHeaderSize === 8);
        this.sequenceHeaderSize = sequenceHeaderSize;
        this.headerSize = 12 + securityHeaderSize;
        const params = {
            chunkSize: this.chunkSize,
            headerSize: this.headerSize,
            writeHeaderFunc: (buffer, isLast, totalLength) => {
                let finalC = isLast ? "F" : "C";
                finalC = this.aborted ? "A" : finalC;
                this.write_header(finalC, buffer, totalLength);
            },
            sequenceHeaderSize,
            writeSequenceHeaderFunc: (buffer) => {
                // assert(buffer.length === this.sequenceHeaderSize);
                this.writeSequenceHeader(buffer);
            },
            // ---------------------------------------- Signing stuff
            signBufferFunc: options.signBufferFunc,
            signatureLength: options.signatureLength,
            // ---------------------------------------- Encrypting stuff
            cipherBlockSize: options.cipherBlockSize,
            encryptBufferFunc: options.encryptBufferFunc,
            plainBlockSize: options.plainBlockSize,
        };
        this.chunkManager = new node_opcua_chunkmanager_1.ChunkManager(params);
        this.chunkManager.on("chunk", (chunk, isLast) => {
            /**
             * @event chunk
             */
            this.emit("chunk", chunk, isLast || this.aborted);
        });
    }
    write_header(finalC, buffer, length) {
        node_opcua_assert_1.assert(buffer.length > 12);
        node_opcua_assert_1.assert(finalC.length === 1);
        node_opcua_assert_1.assert(buffer instanceof Buffer);
        const stream = new node_opcua_binary_stream_1.BinaryStream(buffer);
        // message header --------------------------
        // ---------------------------------------------------------------
        // OPC UA Secure Conversation Message Header : Part 6 page 36
        // MessageType     Byte[3]
        // IsFinal         Byte[1]  C : intermediate, F: Final , A: Final with Error
        // MessageSize     UInt32   The length of the MessageChunk, in bytes. This value includes size of the message header.
        // SecureChannelId UInt32   A unique identifier for the ClientSecureChannelLayer assigned by the server.
        stream.writeUInt8(this.msgType.charCodeAt(0));
        stream.writeUInt8(this.msgType.charCodeAt(1));
        stream.writeUInt8(this.msgType.charCodeAt(2));
        stream.writeUInt8(finalC.charCodeAt(0));
        stream.writeUInt32(length);
        stream.writeUInt32(this.channelId);
        node_opcua_assert_1.assert(stream.length === 12);
        // write Security Header -----------------
        this.securityHeader.encode(stream);
        node_opcua_assert_1.assert(stream.length === this.headerSize);
    }
    writeSequenceHeader(buffer) {
        const stream = new node_opcua_binary_stream_1.BinaryStream(buffer);
        // write Sequence Header -----------------
        this.sequenceHeader.sequenceNumber = this.sequenceNumberGenerator.next();
        this.sequenceHeader.encode(stream);
        node_opcua_assert_1.assert(stream.length === 8);
    }
    write(buffer, length) {
        length = length || buffer.length;
        this.chunkManager.write(buffer, length);
    }
    abort() {
        this.aborted = true;
        this.end();
    }
    end() {
        this.chunkManager.end();
        this.emit("finished");
    }
}
exports.SecureMessageChunkManager = SecureMessageChunkManager;
//# sourceMappingURL=secure_message_chunk_manager.js.map