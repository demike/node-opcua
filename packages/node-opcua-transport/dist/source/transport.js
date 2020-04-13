"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-transport
 */
const chalk_1 = require("chalk");
const events_1 = require("events");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_buffer_utils_1 = require("node-opcua-buffer-utils");
const debug = require("node-opcua-debug");
const message_builder_base_1 = require("./message_builder_base");
const tools_1 = require("./tools");
const debugLog = debug.make_debugLog(__filename);
const doDebug = debug.checkDebugFlag(__filename);
let fakeSocket = { invalid: true };
function setFakeTransport(mockSocket) {
    fakeSocket = mockSocket;
}
exports.setFakeTransport = setFakeTransport;
function getFakeTransport() {
    if (fakeSocket.invalid) {
        throw new Error("getFakeTransport: setFakeTransport must be called first  - BadProtocolVersionUnsupported");
    }
    return fakeSocket;
}
exports.getFakeTransport = getFakeTransport;
let counter = 0;
// tslint:disable:class-name
class Transport extends events_1.EventEmitter {
    constructor() {
        super();
        this._remotePort = 0;
        this._remoteAddress = "";
        this.name = this.constructor.name + counter;
        counter += 1;
        this._timerId = null;
        this.timeout = 30000; // 30 seconds timeout
        this._socket = null;
        this.headerSize = 8;
        this.protocolVersion = 0;
        this._disconnecting = false;
        this._pendingBuffer = undefined;
        this.bytesWritten = 0;
        this.bytesRead = 0;
        this._theCallback = undefined;
        this.chunkWrittenCount = 0;
        this.chunkReadCount = 0;
        this._onSocketClosedHasBeenCalled = false;
        this._onSocketEndedHasBeenCalled = false;
    }
    get remoteAddress() {
        return this._remoteAddress;
    }
    get remotePort() {
        return this._remotePort;
    }
    /**
     * ```createChunk``` is used to construct a pre-allocated chunk to store up to ```length``` bytes of data.
     * The created chunk includes a prepended header for ```chunk_type``` of size ```self.headerSize```.
     *
     * @method createChunk
     * @param msgType
     * @param chunkType {String} chunk type. should be 'F' 'C' or 'A'
     * @param length
     * @return a buffer object with the required length representing the chunk.
     *
     * Note:
     *  - only one chunk can be created at a time.
     *  - a created chunk should be committed using the ```write``` method before an other one is created.
     */
    createChunk(msgType, chunkType, length) {
        node_opcua_assert_1.assert(msgType === "MSG");
        node_opcua_assert_1.assert(this._pendingBuffer === undefined, "createChunk has already been called ( use write first)");
        const totalLength = length + this.headerSize;
        const buffer = node_opcua_buffer_utils_1.createFastUninitializedBuffer(totalLength);
        tools_1.writeTCPMessageHeader("MSG", chunkType, totalLength, buffer);
        this._pendingBuffer = buffer;
        return buffer;
    }
    /**
     * write the message_chunk on the socket.
     * @method write
     * @param messageChunk
     *
     * Notes:
     *  - the message chunk must have been created by ```createChunk```.
     *  - once a message chunk has been written, it is possible to call ```createChunk``` again.
     *
     */
    write(messageChunk) {
        node_opcua_assert_1.assert((this._pendingBuffer === undefined)
            || this._pendingBuffer === messageChunk, " write should be used with buffer created by createChunk");
        const header = message_builder_base_1.readRawMessageHeader(messageChunk);
        node_opcua_assert_1.assert(header.length === messageChunk.length);
        node_opcua_assert_1.assert(["F", "C", "A"].indexOf(header.messageHeader.isFinal) !== -1);
        this._write_chunk(messageChunk);
        this._pendingBuffer = undefined;
    }
    on_socket_ended(err) {
        node_opcua_assert_1.assert(!this._onSocketEndedHasBeenCalled);
        this._onSocketEndedHasBeenCalled = true; // we don't want to send close event twice ...
        /**
         * notify the observers that the transport layer has been disconnected.
         * @event close
         * @param err the Error object or null
         */
        this.emit("close", err || null);
    }
    /**
     * @method _install_one_time_message_receiver
     *
     * install a one time message receiver callback
     *
     * Rules:
     * * TCP_transport will not emit the ```message``` event, while the "one time message receiver" is in operation.
     * * the TCP_transport will wait for the next complete message chunk and call the provided callback func
     *   ```callback(null,messageChunk);```
     *
     * if a messageChunk is not received within ```TCP_transport.timeout``` or if the underlying socket reports
     * an error, the callback function will be called with an Error.
     *
     */
    _install_one_time_message_receiver(callback) {
        node_opcua_assert_1.assert(!this._theCallback, "callback already set");
        node_opcua_assert_1.assert(_.isFunction(callback));
        this._theCallback = callback;
        this._start_one_time_message_receiver();
    }
    _fulfill_pending_promises(err, data) {
        this._cleanup_timers();
        if (this._socket && this._on_error_during_one_time_message_receiver) {
            this._socket.removeListener("close", this._on_error_during_one_time_message_receiver);
            this._on_error_during_one_time_message_receiver = null;
        }
        const callback = this._theCallback;
        this._theCallback = undefined;
        if (callback) {
            callback(err, data);
            return true;
        }
        return false;
    }
    _on_message_received(messageChunk) {
        const hasCallback = this._fulfill_pending_promises(null, messageChunk);
        this.chunkReadCount++;
        if (!hasCallback) {
            /**
             * notify the observers that a message chunk has been received
             * @event message
             * @param message_chunk the message chunk
             */
            this.emit("message", messageChunk);
        }
    }
    _cleanup_timers() {
        if (this._timerId) {
            clearTimeout(this._timerId);
            this._timerId = null;
        }
    }
    _start_one_time_message_receiver() {
        node_opcua_assert_1.assert(!this._timerId, "timer already started");
        // Setup timeout detection timer ....
        this._timerId = setTimeout(() => {
            this._timerId = null;
            this._fulfill_pending_promises(new Error(`Timeout in waiting for data on socket ( timeout was = ${this.timeout} ms)`));
        }, this.timeout);
        // also monitored
        if (this._socket) {
            // to do = intercept socket error as well
            this._on_error_during_one_time_message_receiver = (err) => {
                this._fulfill_pending_promises(new Error(`ERROR in waiting for data on socket ( timeout was = ${this.timeout} ms)`));
            };
            this._socket.on("close", this._on_error_during_one_time_message_receiver);
        }
    }
    on_socket_closed(err) {
        if (this._onSocketClosedHasBeenCalled) {
            return;
        }
        node_opcua_assert_1.assert(!this._onSocketClosedHasBeenCalled);
        this._onSocketClosedHasBeenCalled = true; // we don't want to send close event twice ...
        /**
         * notify the observers that the transport layer has been disconnected.
         * @event socket_closed
         * @param err the Error object or null
         */
        this.emit("socket_closed", err || null);
    }
    _on_socket_data(data) {
        if (!this.packetAssembler) {
            throw new Error("internal Error");
        }
        this.bytesRead += data.length;
        if (data.length > 0) {
            this.packetAssembler.feed(data);
        }
    }
    _on_socket_ended_message(err) {
        if (this._disconnecting) {
            return;
        }
        debugLog(chalk_1.default.red("Transport Connection ended") + " " + this.name);
        node_opcua_assert_1.assert(!this._disconnecting);
        err = err || new Error("_socket has been disconnected by third party");
        this.on_socket_ended(err);
        this._disconnecting = true;
        debugLog(" bytesRead    = ", this.bytesRead);
        debugLog(" bytesWritten = ", this.bytesWritten);
        this._fulfill_pending_promises(new Error("Connection aborted - ended by server : " + (err ? err.message : "")));
    }
    _on_socket_end(err) {
        // istanbul ignore next
        if (doDebug) {
            debugLog(chalk_1.default.red(" SOCKET END : "), err ? chalk_1.default.yellow(err.message) : "null", this.name);
        }
        this._on_socket_ended_message(err);
    }
    _on_socket_error(err) {
        // istanbul ignore next
        if (doDebug) {
            debugLog(chalk_1.default.red(" SOCKET ERROR : "), chalk_1.default.yellow(err.message), this.name);
        }
        // node The "close" event will be called directly following this event.
    }
}
exports.Transport = Transport;
//# sourceMappingURL=transport.js.map