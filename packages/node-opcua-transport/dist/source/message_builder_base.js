"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-transport
 */
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_buffer_utils_1 = require("node-opcua-buffer-utils");
const node_opcua_chunkmanager_1 = require("node-opcua-chunkmanager");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_packet_assembler_1 = require("node-opcua-packet-assembler");
const node_opcua_utils_1 = require("node-opcua-utils");
const doPerfMonitoring = false;
const errorLog = node_opcua_debug_1.make_errorLog("MessageBuilder");
function readRawMessageHeader(data) {
    const messageHeader = node_opcua_chunkmanager_1.readMessageHeader(new node_opcua_binary_stream_1.BinaryStream(data));
    return {
        extra: "",
        length: messageHeader.length,
        messageHeader
    };
}
exports.readRawMessageHeader = readRawMessageHeader;
/**
 * @class MessageBuilderBase
 * @extends EventEmitter
 * @uses PacketAssembler
 * @constructor
 * @param options {Object}
 * @param [options.signatureLength=0] {number}
 *
 */
class MessageBuilderBase extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.id = "";
        this._tick0 = 0;
        this._tick1 = 0;
        this._hasReceivedError = false;
        this.blocks = [];
        this.messageChunks = [];
        this._expectedChannelId = 0;
        options = options || {};
        this.signatureLength = options.signatureLength || 0;
        this.options = options;
        this._packetAssembler = new node_opcua_packet_assembler_1.PacketAssembler({
            minimumSizeInBytes: 0,
            readMessageFunc: readRawMessageHeader
        });
        this._packetAssembler.on("message", (messageChunk) => this._feed_messageChunk(messageChunk));
        this._packetAssembler.on("newMessage", (info, data) => {
            if (doPerfMonitoring) {
                // record tick 0: when the first data is received
                this._tick0 = node_opcua_utils_1.get_clock_tick();
            }
            /**
             *
             * notify the observers that a new message is being built
             * @event start_chunk
             * @param info
             * @param data
             */
            this.emit("start_chunk", info, data);
        });
        this._securityDefeated = false;
        this.totalBodySize = 0;
        this.totalMessageSize = 0;
        this.channelId = 0;
        this.offsetBodyStart = 0;
        this.sequenceHeader = null;
        this._init_new();
    }
    dispose() {
        this.removeAllListeners();
    }
    /**
     * Feed message builder with some data
     * @method feed
     * @param data
     */
    feed(data) {
        if (!this._securityDefeated && !this._hasReceivedError) {
            this._packetAssembler.feed(data);
        }
    }
    _decodeMessageBody(fullMessageBody) {
        return true;
    }
    _read_headers(binaryStream) {
        this.messageHeader = node_opcua_chunkmanager_1.readMessageHeader(binaryStream);
        node_opcua_assert_1.assert(binaryStream.length === 8, "expecting message header to be 8 bytes");
        this.channelId = binaryStream.readUInt32();
        node_opcua_assert_1.assert(binaryStream.length === 12);
        // verifying secure ChannelId
        if (this._expectedChannelId && this.channelId !== this._expectedChannelId) {
            return this._report_error("Invalid secure channel Id");
        }
        return true;
    }
    _report_error(errorMessage) {
        this._hasReceivedError = true;
        /**
         * notify the observers that an error has occurred
         * @event error
         * @param error the error to raise
         */
        errorLog("Error  ", this.id, errorMessage);
        // xx errorLog(new Error());
        this.emit("error", new Error(errorMessage), this.sequenceHeader ? this.sequenceHeader.requestId : null);
        return false;
    }
    _init_new() {
        this._securityDefeated = false;
        this._hasReceivedError = false;
        this.totalBodySize = 0;
        this.totalMessageSize = 0;
        this.blocks = [];
        this.messageChunks = [];
    }
    /**
     * append a message chunk
     * @method _append
     * @param chunk
     * @private
     */
    _append(chunk) {
        if (this._hasReceivedError) {
            // the message builder is in error mode and further message chunks should be discarded.
            return false;
        }
        this.messageChunks.push(chunk);
        this.totalMessageSize += chunk.length;
        const binaryStream = new node_opcua_binary_stream_1.BinaryStream(chunk);
        if (!this._read_headers(binaryStream)) {
            return false;
        }
        node_opcua_assert_1.assert(binaryStream.length >= 12);
        // verify message chunk length
        if (this.messageHeader.length !== chunk.length) {
            // tslint:disable:max-line-length
            return this._report_error(`Invalid messageChunk size: the provided chunk is ${chunk.length} bytes long but header specifies ${this.messageHeader.length}`);
        }
        // the start of the message body block
        const offsetBodyStart = binaryStream.length;
        // the end of the message body block
        const offsetBodyEnd = binaryStream.buffer.length;
        this.totalBodySize += (offsetBodyEnd - offsetBodyStart);
        this.offsetBodyStart = offsetBodyStart;
        // add message body to a queue
        // note : Buffer.slice create a shared memory !
        //        use Buffer.clone
        const sharedBuffer = chunk.slice(offsetBodyStart, offsetBodyEnd);
        const clonedBuffer = node_opcua_buffer_utils_1.createFastUninitializedBuffer(sharedBuffer.length);
        sharedBuffer.copy(clonedBuffer, 0, 0);
        this.blocks.push(clonedBuffer);
        return true;
    }
    _feed_messageChunk(chunk) {
        node_opcua_assert_1.assert(chunk);
        const messageHeader = node_opcua_chunkmanager_1.readMessageHeader(new node_opcua_binary_stream_1.BinaryStream(chunk));
        /**
         * notify the observers that new message chunk has been received
         * @event chunk
         * @param messageChunk the raw message chunk
         */
        this.emit("chunk", chunk);
        if (messageHeader.isFinal === "F") {
            // last message
            this._append(chunk);
            if (this._hasReceivedError) {
                return false;
            }
            const fullMessageBody = this.blocks.length === 1 ? this.blocks[0] : Buffer.concat(this.blocks);
            if (doPerfMonitoring) {
                // record tick 1: when a complete message has been received ( all chunks assembled)
                this._tick1 = node_opcua_utils_1.get_clock_tick();
            }
            /**
             * notify the observers that a full message has been received
             * @event full_message_body
             * @param full_message_body the full message body made of all concatenated chunks.
             */
            this.emit("full_message_body", fullMessageBody);
            this._decodeMessageBody(fullMessageBody);
            // be ready for next block
            this._init_new();
            return true;
        }
        else if (messageHeader.isFinal === "A") {
            return this._report_error("received and Abort Message");
        }
        else if (messageHeader.isFinal === "C") {
            return this._append(chunk);
        }
        return false;
    }
}
exports.MessageBuilderBase = MessageBuilderBase;
//# sourceMappingURL=message_builder_base.js.map