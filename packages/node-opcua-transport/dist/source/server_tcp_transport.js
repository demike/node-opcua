"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-transport
 */
// tslint:disable:class-name
// system
const chalk_1 = require("chalk");
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
// opcua requires
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_chunkmanager_1 = require("node-opcua-chunkmanager");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const AcknowledgeMessage_1 = require("./AcknowledgeMessage");
const HelloMessage_1 = require("./HelloMessage");
const tcp_transport_1 = require("./tcp_transport");
// this package requires
const TCPErrorMessage_1 = require("./TCPErrorMessage");
const tools_1 = require("./tools");
const debug = require("node-opcua-debug");
const hexDump = debug.hexDump;
const debugLog = debug.make_debugLog(__filename);
const doDebug = debug.checkDebugFlag(__filename);
function clamp_value(value, minVal, maxVal) {
    node_opcua_assert_1.assert(minVal < maxVal);
    if (value === 0) {
        return maxVal;
    }
    if (value < minVal) {
        return minVal;
    }
    /* istanbul ignore next*/
    if (value >= maxVal) {
        return maxVal;
    }
    return value;
}
const minimumBufferSize = 8192;
/**
 * @class ServerTCP_transport
 * @extends TCP_transport
 * @constructor
 *
 */
class ServerTCP_transport extends tcp_transport_1.TCP_transport {
    constructor() {
        super();
        this._aborted = 0;
        this._helloReceived = false;
        this.receiveBufferSize = 0;
        this.sendBufferSize = 0;
        this.maxMessageSize = 0;
        this.maxChunkCount = 0;
        this.protocolVersion = 0;
    }
    /**
     * Initialize the server transport.
     *
     *
     *  The ServerTCP_transport initialisation process starts by waiting for the client to send a "HEL" message.
     *
     *  The  ServerTCP_transport replies with a "ACK" message and then start waiting for further messages of any size.
     *
     *  The callback function received an error:
     *   - if no message from the client is received within the ```self.timeout``` period,
     *   - or, if the connection has dropped within the same interval.
     *   - if the protocol version specified within the HEL message is invalid or is greater
     *     than ```self.protocolVersion```
     *
     *
     */
    init(socket, callback) {
        if (debugLog) {
            debugLog(chalk_1.default.cyan("init socket"));
        }
        node_opcua_assert_1.assert(!this._socket, "init already called!");
        node_opcua_assert_1.assert(_.isFunction(callback), "expecting a valid callback ");
        this._install_socket(socket);
        this._install_HEL_message_receiver(callback);
    }
    _abortWithError(statusCode, extraErrorDescription, callback) {
        if (debugLog) {
            debugLog(chalk_1.default.cyan("_abortWithError"));
        }
        node_opcua_assert_1.assert(_.isFunction(callback), "expecting a callback");
        /* istanbul ignore else */
        if (!this._aborted) {
            this._aborted = 1;
            // send the error message and close the connection
            node_opcua_assert_1.assert(node_opcua_status_code_1.StatusCodes.hasOwnProperty(statusCode.name));
            /* istanbul ignore next*/
            if (doDebug) {
                debugLog(chalk_1.default.red(" Server aborting because ") + chalk_1.default.cyan(statusCode.name));
                debugLog(chalk_1.default.red(" extraErrorDescription   ") + chalk_1.default.cyan(extraErrorDescription));
            }
            const errorResponse = new TCPErrorMessage_1.TCPErrorMessage({
                reason: statusCode.description,
                statusCode
            });
            const messageChunk = tools_1.packTcpMessage("ERR", errorResponse);
            this.write(messageChunk);
            this.disconnect(() => {
                this._aborted = 2;
                callback(new Error(extraErrorDescription + " StatusCode = " + statusCode.name));
            });
        }
        else {
            callback(new Error(statusCode.name));
        }
    }
    _send_ACK_response(helloMessage) {
        node_opcua_assert_1.assert(helloMessage.receiveBufferSize >= minimumBufferSize);
        node_opcua_assert_1.assert(helloMessage.sendBufferSize >= minimumBufferSize);
        this.receiveBufferSize = clamp_value(helloMessage.receiveBufferSize, 8192, 512 * 1024);
        this.sendBufferSize = clamp_value(helloMessage.sendBufferSize, 8192, 512 * 1024);
        this.maxMessageSize = clamp_value(helloMessage.maxMessageSize, 100000, 16 * 1024 * 1024);
        this.maxChunkCount = clamp_value(helloMessage.maxChunkCount, 0, 65535);
        const acknowledgeMessage = new AcknowledgeMessage_1.AcknowledgeMessage({
            maxChunkCount: this.maxChunkCount,
            maxMessageSize: this.maxMessageSize,
            protocolVersion: this.protocolVersion,
            receiveBufferSize: this.receiveBufferSize,
            sendBufferSize: this.sendBufferSize
        });
        const messageChunk = tools_1.packTcpMessage("ACK", acknowledgeMessage);
        /* istanbul ignore next*/
        if (doDebug) {
            node_opcua_chunkmanager_1.verify_message_chunk(messageChunk);
            debugLog("server send: " + chalk_1.default.yellow("ACK"));
            debugLog("server send: " + hexDump(messageChunk));
            debugLog("acknowledgeMessage=", acknowledgeMessage);
        }
        // send the ACK reply
        this.write(messageChunk);
    }
    _install_HEL_message_receiver(callback) {
        if (debugLog) {
            debugLog(chalk_1.default.cyan("_install_HEL_message_receiver "));
        }
        this._install_one_time_message_receiver((err, data) => {
            if (err) {
                this._abortWithError(node_opcua_status_code_1.StatusCodes.BadConnectionRejected, err.message, callback);
            }
            else {
                if (!data) {
                    throw new Error("Invalid Data");
                }
                // handle the HEL message
                this._on_HEL_message(data, callback);
            }
        });
    }
    _on_HEL_message(data, callback) {
        if (debugLog) {
            debugLog(chalk_1.default.cyan("_on_HEL_message"));
        }
        node_opcua_assert_1.assert(data instanceof Buffer);
        node_opcua_assert_1.assert(!this._helloReceived);
        const stream = new node_opcua_binary_stream_1.BinaryStream(data);
        const msgType = data.slice(0, 3).toString("ascii");
        /* istanbul ignore next*/
        if (doDebug) {
            debugLog("SERVER received " + chalk_1.default.yellow(msgType));
            debugLog("SERVER received " + hexDump(data));
        }
        if (msgType === "HEL") {
            node_opcua_assert_1.assert(data.length >= 24);
            const helloMessage = tools_1.decodeMessage(stream, HelloMessage_1.HelloMessage);
            node_opcua_assert_1.assert(_.isFinite(this.protocolVersion));
            // OPCUA Spec 1.03 part 6 - page 41
            // The Server shall always accept versions greater than what it supports.
            if (helloMessage.protocolVersion !== this.protocolVersion) {
                debugLog(`warning ! client sent helloMessage.protocolVersion = ` +
                    ` 0x${helloMessage.protocolVersion.toString(16)} ` +
                    `whereas server protocolVersion is 0x${this.protocolVersion.toString(16)}`);
            }
            if (helloMessage.protocolVersion === 0xDEADBEEF || helloMessage.protocolVersion < this.protocolVersion) {
                // Note: 0xDEADBEEF is our special version number to simulate BadProtocolVersionUnsupported in tests
                // invalid protocol version requested by client
                return this._abortWithError(node_opcua_status_code_1.StatusCodes.BadProtocolVersionUnsupported, "Protocol Version Error" + this.protocolVersion, callback);
            }
            // OPCUA Spec 1.04 part 6 - page 45
            // UASC is designed to operate with different TransportProtocols that may have limited buffer
            // sizes. For this reason, OPC UA Secure Conversation will break OPC UA Messages into several
            // pieces (called ‘MessageChunks’) that are smaller than the buffer size allowed by the
            // TransportProtocol. UASC requires a TransportProtocol buffer size that is at least 8 192 bytes
            if (helloMessage.receiveBufferSize < minimumBufferSize || helloMessage.sendBufferSize < minimumBufferSize) {
                return this._abortWithError(node_opcua_status_code_1.StatusCodes.BadConnectionRejected, "Buffer size too small (should be at least " + minimumBufferSize, callback);
            }
            // the helloMessage shall only be received once.
            this._helloReceived = true;
            this._send_ACK_response(helloMessage);
            callback(); // no Error
        }
        else {
            // invalid packet , expecting HEL
            /* istanbul ignore next*/
            if (doDebug) {
                debugLog(chalk_1.default.red("BadCommunicationError ") + "Expecting 'HEL' message to initiate communication");
            }
            this._abortWithError(node_opcua_status_code_1.StatusCodes.BadCommunicationError, "Expecting 'HEL' message to initiate communication", callback);
        }
    }
}
exports.ServerTCP_transport = ServerTCP_transport;
//# sourceMappingURL=server_tcp_transport.js.map