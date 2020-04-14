/// <reference types="node" />
import * as WebSocket from 'ws';
import { Transport } from './transport';
declare type ErrorCallback = (err?: Error | null) => void;
export declare class Websocket_transport extends Transport<WebSocket> {
    constructor();
    dispose(): void;
    /**
     * disconnect the TCP layer and close the underlying socket.
     * The ```"close"``` event will be emitted to the observers with err=null.
     *
     * @method disconnect
     * @async
     * @param callback
     */
    disconnect(callback: ErrorCallback): void;
    isValid(): boolean;
    protected _write_chunk(messageChunk: Buffer): void;
    /**
     * @method _install_socket
     * @param socket {Socket}
     * @protected
     */
    protected _install_socket(socket: WebSocket): void;
    private _on_socket_close;
}
export {};
