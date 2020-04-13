"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-transport
 */
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const debug = require("node-opcua-debug");
const node_opcua_packet_assembler_1 = require("node-opcua-packet-assembler");
const message_builder_base_1 = require("./message_builder_base");
const WebSocket = require("ws");
const transport_1 = require("./transport");
const debugLog = debug.make_debugLog(__filename);
const doDebug = debug.checkDebugFlag(__filename);
let counter = 0;
// tslint:disable:class-name
class Websocket_transport extends transport_1.Transport {
    constructor() {
        super();
        this.name = this.constructor.name + counter;
        counter += 1;
        this._socket = null;
    }
    dispose() {
        node_opcua_assert_1.assert(!this._timerId);
        if (this._socket) {
            this._socket.terminate();
            this._socket.removeAllListeners();
            this._socket = null;
        }
    }
    /**
     * disconnect the TCP layer and close the underlying socket.
     * The ```"close"``` event will be emitted to the observers with err=null.
     *
     * @method disconnect
     * @async
     * @param callback
     */
    disconnect(callback) {
        node_opcua_assert_1.assert(_.isFunction(callback), "expecting a callback function, but got " + callback);
        if (this._disconnecting) {
            callback();
            return;
        }
        node_opcua_assert_1.assert(!this._disconnecting, "WS Transport has already been disconnected");
        this._disconnecting = true;
        // xx assert(!this._theCallback,
        //              "disconnect shall not be called while the 'one time message receiver' is in operation");
        this._cleanup_timers();
        if (this._socket) {
            this._socket.close();
            // xx this._socket.removeAllListeners();
            this._socket = null;
        }
        setImmediate(() => {
            this.on_socket_ended(null);
            callback();
        });
    }
    isValid() {
        return this._socket !== null && this._socket.readyState === WebSocket.OPEN && !this._disconnecting;
    }
    _write_chunk(messageChunk) {
        if (this._socket !== null) {
            this.bytesWritten += messageChunk.length;
            this.chunkWrittenCount++;
            this._socket.send(messageChunk);
        }
    }
    /**
     * @method _install_socket
     * @param socket {Socket}
     * @protected
     */
    _install_socket(socket) {
        node_opcua_assert_1.assert(socket);
        this._socket = socket;
        if (doDebug) {
            debugLog("_install_socket ", this.name);
        }
        let nativeSocket = socket._socket;
        this._remoteAddress = (nativeSocket && nativeSocket.remoteAddress) ? nativeSocket.remoteAddress : "";
        this._remotePort = (nativeSocket && nativeSocket.remotePort) ? nativeSocket.remotePort : 0;
        // install packet assembler ...
        this.packetAssembler = new node_opcua_packet_assembler_1.PacketAssembler({
            readMessageFunc: message_builder_base_1.readRawMessageHeader,
            minimumSizeInBytes: this.headerSize
        });
        if (!this.packetAssembler) {
            throw new Error("Internal Error");
        }
        this.packetAssembler.on("message", (messageChunk) => this._on_message_received(messageChunk));
        this._socket
            .on("message", (data) => this._on_socket_data(data))
            .on("close", (code, reason) => this._on_socket_close(code, reason))
            .on("end", (err) => this._on_socket_end(err))
            .on("error", (err) => this._on_socket_error(err));
        const doDestroyOnTimeout = false;
        if (doDestroyOnTimeout) {
            // set socket timeout
            debugLog("setting _socket.setTimeout to ", this.timeout);
            setTimeout(() => {
                debugLog(` _socket ${this.name} has timed out (timeout = ${this.timeout})`);
                if (this._socket) {
                    this._socket.terminate();
                    // 08/2008 shall we do this ?
                    this._socket.removeAllListeners();
                    this._socket = null;
                }
            }, this.timeout);
        }
    }
    _on_socket_close(code, reason) {
        // istanbul ignore next
        if (doDebug) {
            debugLog(chalk_1.default.red(" SOCKET CLOSE : "), chalk_1.default.yellow("had_error ="), chalk_1.default.cyan(code.toString()), this.name);
        }
        if (this._socket) {
            debugLog("  remote address = ", this._socket.url, " ", this._socket.protocol);
        }
        let hadError = code !== 1000; /* if not normal */
        if (code !== 1000) {
            if (this._socket) {
                this._socket.terminate();
            }
            this.emit('socket_error', code, reason);
        }
        const err = hadError ? new Error("ERROR IN SOCKET: reason=" + reason + ' code=' + code + ' name=' + this.name) : undefined;
        this.on_socket_closed(err);
    }
}
exports.Websocket_transport = Websocket_transport;
//# sourceMappingURL=ws_transport.js.map