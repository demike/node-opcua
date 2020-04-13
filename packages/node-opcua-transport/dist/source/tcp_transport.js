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
const transport_1 = require("./transport");
const debugLog = debug.make_debugLog(__filename);
const doDebug = debug.checkDebugFlag(__filename);
let counter = 0;
// tslint:disable:class-name
class TCP_transport extends transport_1.Transport {
    constructor() {
        super();
        this.name = this.constructor.name + counter;
        counter += 1;
        this._socket = null;
    }
    dispose() {
        node_opcua_assert_1.assert(!this._timerId);
        if (this._socket) {
            this._socket.destroy();
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
        node_opcua_assert_1.assert(!this._disconnecting, "TCP Transport has already been disconnected");
        this._disconnecting = true;
        // xx assert(!this._theCallback,
        //              "disconnect shall not be called while the 'one time message receiver' is in operation");
        this._cleanup_timers();
        if (this._socket) {
            this._socket.end();
            this._socket.destroy();
            // xx this._socket.removeAllListeners();
            this._socket = null;
        }
        setImmediate(() => {
            this.on_socket_ended(null);
            callback();
        });
    }
    isValid() {
        return this._socket !== null && !this._socket.destroyed && !this._disconnecting;
    }
    _write_chunk(messageChunk) {
        if (this._socket !== null) {
            this.bytesWritten += messageChunk.length;
            this.chunkWrittenCount++;
            this._socket.write(messageChunk);
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
        this._remoteAddress = socket.remoteAddress || "";
        this._remotePort = socket.remotePort || 0;
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
            .on("data", (data) => this._on_socket_data(data))
            .on("close", (hadError) => this._on_socket_close(hadError))
            .on("end", (err) => this._on_socket_end(err))
            .on("error", (err) => this._on_socket_error(err));
        const doDestroyOnTimeout = false;
        if (doDestroyOnTimeout) {
            // set socket timeout
            debugLog("setting _socket.setTimeout to ", this.timeout);
            this._socket.setTimeout(this.timeout, () => {
                debugLog(` _socket ${this.name} has timed out (timeout = ${this.timeout})`);
                if (this._socket) {
                    this._socket.destroy();
                    // 08/2008 shall we do this ?
                    this._socket.removeAllListeners();
                    this._socket = null;
                }
            });
        }
    }
    _on_socket_close(hadError) {
        // istanbul ignore next
        if (doDebug) {
            debugLog(chalk_1.default.red(" SOCKET CLOSE : "), chalk_1.default.yellow("had_error ="), chalk_1.default.cyan(hadError.toString()), this.name);
        }
        if (this._socket) {
            debugLog("  remote address = ", this._socket.remoteAddress, " ", this._socket.remoteFamily, " ", this._socket.remotePort);
        }
        if (hadError) {
            if (this._socket) {
                this._socket.destroy();
            }
        }
        const err = hadError ? new Error("ERROR IN SOCKET") : undefined;
        this.on_socket_closed(err);
    }
}
exports.TCP_transport = TCP_transport;
//# sourceMappingURL=tcp_transport.js.map