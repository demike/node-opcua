import * as WebSocket from "ws";
import { ErrorCallback } from "./client_tcp_transport";
import { Websocket_transport } from "./ws_transport";
import { ServerTransport } from "./transport";
/**
 * @class ServerTCP_transport
 * @extends TCP_transport
 * @constructor
 *
 */
export declare class ServerWS_transport extends Websocket_transport implements ServerTransport<WebSocket> {
    receiveBufferSize: number;
    sendBufferSize: number;
    maxMessageSize: number;
    maxChunkCount: number;
    protocolVersion: number;
    private _aborted;
    private _helloReceived;
    constructor();
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
    init(socket: WebSocket, callback: ErrorCallback): void;
    private _abortWithError;
    private _send_ACK_response;
    private _install_HEL_message_receiver;
    private _on_HEL_message;
}
