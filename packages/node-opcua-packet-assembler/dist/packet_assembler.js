"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const doDebug = false;
class PacketAssembler extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._stack = [];
        this.expectedLength = 0;
        this.currentLength = 0;
        this.readMessageFunc = options.readMessageFunc;
        this.minimumSizeInBytes = options.minimumSizeInBytes || 8;
        node_opcua_assert_1.assert(_.isFunction(this.readMessageFunc), "packet assembler requires a readMessageFunc");
    }
    feed(data) {
        let messageChunk;
        if (this.expectedLength === 0 && this.currentLength + data.length >= this.minimumSizeInBytes) {
            // we are at a start of a block and there is enough data provided to read the length  of the block
            // let's build the whole data block with previous blocks already read.
            if (this._stack.length > 0) {
                data = this._buildData(data);
                this.currentLength = 0;
            }
            // we can extract the expected length here
            this.packetInfo = this._readPacketInfo(data);
            this.expectedLength = this.packetInfo.length;
            node_opcua_assert_1.assert(this.currentLength === 0);
            node_opcua_assert_1.assert(this.expectedLength > 0);
            // we can now emit an event to signal the start of a new packet
            this.emit("newMessage", this.packetInfo, data);
        }
        if (this.expectedLength === 0 || this.currentLength + data.length < this.expectedLength) {
            this._stack.push(data);
            this.currentLength += data.length;
            // expecting more data to complete current message chunk
        }
        else if (this.currentLength + data.length === this.expectedLength) {
            this.currentLength += data.length;
            messageChunk = this._buildData(data);
            // istanbul ignore next
            if (doDebug) {
                const packetInfo = this._readPacketInfo(messageChunk);
                node_opcua_assert_1.assert(this.packetInfo && this.packetInfo.length === packetInfo.length);
                node_opcua_assert_1.assert(messageChunk.length === packetInfo.length);
            }
            // reset
            this.currentLength = 0;
            this.expectedLength = 0;
            this.emit("message", messageChunk);
        }
        else {
            // there is more data in this chunk than expected...
            // the chunk need to be split
            const size1 = this.expectedLength - this.currentLength;
            if (size1 > 0) {
                const chunk1 = data.slice(0, size1);
                this.feed(chunk1);
            }
            const chunk2 = data.slice(size1);
            if (chunk2.length > 0) {
                this.feed(chunk2);
            }
        }
    }
    _readPacketInfo(data) {
        return this.readMessageFunc(data);
    }
    _buildData(data) {
        if (data && this._stack.length === 0) {
            return data;
        }
        if (!data && this._stack.length === 1) {
            data = this._stack[0];
            this._stack.length = 0; // empty stack array
            return data;
        }
        this._stack.push(data);
        data = Buffer.concat(this._stack);
        this._stack.length = 0;
        return data;
    }
}
exports.PacketAssembler = PacketAssembler;
//# sourceMappingURL=packet_assembler.js.map