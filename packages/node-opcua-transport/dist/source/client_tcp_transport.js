"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-transport
 */
// tslint:disable:class-name
// system
const net_1 = require("net");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_chunkmanager_1 = require("node-opcua-chunkmanager");
const os = require("os");
const _ = require("underscore");
const tcp_transport_1 = require("./tcp_transport");
const tools_1 = require("./tools");
const debug = require("node-opcua-debug");
const AcknowledgeMessage_1 = require("./AcknowledgeMessage");
const HelloMessage_1 = require("./HelloMessage");
const TCPErrorMessage_1 = require("./TCPErrorMessage");
const transport_1 = require("./transport");
const doDebug = debug.checkDebugFlag(__filename);
const debugLog = debug.make_debugLog(__filename);
const gHostname = os.hostname();
function createClientSocket(endpointUrl) {
    // create a socket based on Url
    const ep = tools_1.parseEndpointUrl(endpointUrl);
    const port = parseInt(ep.port, 10);
    const hostname = ep.hostname;
    let socket;
    switch (ep.protocol) {
        case "opc.tcp:":
            socket = net_1.createConnection({ host: hostname, port });
            // Setting true for noDelay will immediately fire off data each time socket.write() is called.
            socket.setNoDelay(true);
            socket.setTimeout(0);
            socket.on("timeout", () => {
                debugLog("Socket has timed out");
            });
            return socket;
        case "fake:":
            socket = transport_1.getFakeTransport();
            node_opcua_assert_1.assert(ep.protocol === "fake:", " Unsupported transport protocol");
            process.nextTick(() => socket.emit("connect"));
            return socket;
        case "websocket:":
        case "http:":
        case "https:FF":
        default:
            throw new Error("this transport protocol is currently not supported :" + ep.protocol);
    }
}
/**
 * a ClientTCP_transport connects to a remote server socket and
 * initiates a communication with a HEL/ACK transaction.
 * It negotiates the communication parameters with the other end.
 *
 * @class ClientTCP_transport
 * @extends TCP_transport
 * @constructor
 * @example
 *
 *    ```javascript
 *    const transport = ClientTCP_transport(url);
 *
 *    transport.timeout = 1000;
 *
 *    transport.connect(function(err)) {
 *         if (err) {
 *            // cannot connect
 *         } else {
 *            // connected
 *
 *         }
 *    });
 *    ....
 *
 *    transport.write(message_chunk,'F');
 *
 *    ....
 *
 *    transport.on("message",function(message_chunk) {
 *        // do something with message from server...
 *    });
 *
 *
 *    ```
 *
 *
 */
class ClientTCP_transport extends tcp_transport_1.TCP_transport {
    constructor() {
        super();
        this.connected = false;
        this.endpointUrl = "";
        this.serverUri = "";
        this._counter = 0;
        this.numberOfRetry = 0;
    }
    dispose() {
        if (doDebug) {
            debugLog(" ClientTCP_transport disposed");
        }
        super.dispose();
    }
    connect(endpointUrl, callback) {
        node_opcua_assert_1.assert(arguments.length === 2);
        node_opcua_assert_1.assert(_.isFunction(callback));
        const ep = tools_1.parseEndpointUrl(endpointUrl);
        this.endpointUrl = endpointUrl;
        this.serverUri = "urn:" + gHostname + ":Sample";
        if (doDebug) {
            debugLog("endpointUrl =", endpointUrl, "ep", ep);
        }
        try {
            this._socket = createClientSocket(endpointUrl);
        }
        catch (err) {
            if (doDebug) {
                debugLog("CreateClientSocket has failed");
            }
            return callback(err);
        }
        this._install_socket(this._socket);
        const _on_socket_error_after_connection = (err) => {
            if (doDebug) {
                debugLog(" _on_socket_error_after_connection ClientTCP_transport Socket Error", err.message);
            }
            // EPIPE : EPIPE (Broken pipe): A write on a pipe, socket, or FIFO for which there is no process to read the
            // data. Commonly encountered at the net and http layers, indicative that the remote side of the stream
            // being written to has been closed.
            // ECONNRESET (Connection reset by peer): A connection was forcibly closed by a peer. This normally results
            // from a loss of the connection on the remote socket due to a timeout or reboot. Commonly encountered
            // via the http and net module
            if (err.message.match(/ECONNRESET|EPIPE/)) {
                /**
                 * @event connection_break
                 *
                 */
                this.emit("connection_break");
            }
        };
        const _on_socket_connect = () => {
            if (doDebug) {
                debugLog("entering _on_socket_connect");
            }
            _remove_connect_listeners();
            this._perform_HEL_ACK_transaction((err) => {
                if (!err) {
                    if (!this._socket) {
                        throw new Error("internal error");
                    }
                    // install error handler to detect connection break
                    this._socket.on("error", _on_socket_error_after_connection);
                    this.connected = true;
                    /**
                     * notify the observers that the transport is connected (the socket is connected and the the HEL/ACK
                     * transaction has been done)
                     * @event connect
                     *
                     */
                    this.emit("connect");
                }
                else {
                    debugLog("_perform_HEL_ACK_transaction has failed with err=", err.message);
                }
                callback(err);
            });
        };
        const _on_socket_error_for_connect = (err) => {
            // this handler will catch attempt to connect to an inaccessible address.
            if (doDebug) {
                debugLog(" _on_socket_error_for_connect", err.message);
            }
            node_opcua_assert_1.assert(err instanceof Error);
            _remove_connect_listeners();
            callback(err);
        };
        const _on_socket_end_for_connect = (err) => {
            if (doDebug) {
                debugLog("_on_socket_end_for_connect Socket has been closed by server", err);
            }
        };
        const _remove_connect_listeners = () => {
            if (!this._socket) {
                return;
            }
            this._socket.removeListener("error", _on_socket_error_for_connect);
            this._socket.removeListener("end", _on_socket_end_for_connect);
        };
        this._socket.once("error", _on_socket_error_for_connect);
        this._socket.once("end", _on_socket_end_for_connect);
        this._socket.once("connect", _on_socket_connect);
    }
    on_socket_ended(err) {
        if (this.connected) {
            super.on_socket_ended(err);
        }
        //  if (this._socket) {
        //      this._socket.removeAllListeners();
        // }
    }
    _handle_ACK_response(messageChunk, callback) {
        const _stream = new node_opcua_binary_stream_1.BinaryStream(messageChunk);
        const messageHeader = node_opcua_chunkmanager_1.readMessageHeader(_stream);
        let err;
        if (messageHeader.isFinal !== "F") {
            err = new Error(" invalid ACK message");
            return callback(err);
        }
        let responseClass;
        let response;
        if (messageHeader.msgType === "ERR") {
            responseClass = TCPErrorMessage_1.TCPErrorMessage;
            _stream.rewind();
            response = tools_1.decodeMessage(_stream, responseClass);
            err = new Error("ACK: ERR received " + response.statusCode.toString() + " : " + response.reason);
            err.statusCode = response.statusCode;
            callback(err);
        }
        else {
            responseClass = AcknowledgeMessage_1.AcknowledgeMessage;
            _stream.rewind();
            response = tools_1.decodeMessage(_stream, responseClass);
            this.parameters = response;
            callback();
        }
    }
    _send_HELLO_request() {
        if (doDebug) {
            debugLog("entering _send_HELLO_request");
        }
        node_opcua_assert_1.assert(this._socket);
        node_opcua_assert_1.assert(_.isFinite(this.protocolVersion));
        node_opcua_assert_1.assert(this.endpointUrl.length > 0, " expecting a valid endpoint url");
        // Write a message to the socket as soon as the client is connected,
        // the server will receive it as message from the client
        const request = new HelloMessage_1.HelloMessage({
            endpointUrl: this.endpointUrl,
            maxChunkCount: 0,
            maxMessageSize: 0,
            protocolVersion: this.protocolVersion,
            receiveBufferSize: 1024 * 64 * 10,
            sendBufferSize: 1024 * 64 * 10 // 8192 min,
        });
        const messageChunk = tools_1.packTcpMessage("HEL", request);
        this._write_chunk(messageChunk);
    }
    _on_ACK_response(externalCallback, err, data) {
        if (doDebug) {
            debugLog("entering _on_ACK_response");
        }
        node_opcua_assert_1.assert(_.isFunction(externalCallback));
        node_opcua_assert_1.assert(this._counter === 0, "Ack response should only be received once !");
        this._counter += 1;
        if (err) {
            externalCallback(err);
            if (this._socket) {
                this._socket.end();
                // Xx this._socket.removeAllListeners();
            }
        }
        else {
            if (!data) {
                return;
            }
            this._handle_ACK_response(data, externalCallback);
        }
    }
    _perform_HEL_ACK_transaction(callback) {
        if (!this._socket) {
            return callback(new Error("No socket available to perform HEL/ACK transaction"));
        }
        node_opcua_assert_1.assert(this._socket, "expecting a valid socket to send a message");
        node_opcua_assert_1.assert(_.isFunction(callback));
        this._counter = 0;
        if (doDebug) {
            debugLog("entering _perform_HEL_ACK_transaction");
        }
        this._install_one_time_message_receiver((err, data) => {
            if (doDebug) {
                debugLog("before  _on_ACK_response");
            }
            this._on_ACK_response(callback, err, data);
        });
        this._send_HELLO_request();
    }
}
exports.ClientTCP_transport = ClientTCP_transport;
//# sourceMappingURL=client_tcp_transport.js.map