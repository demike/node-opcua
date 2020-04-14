/// <reference types="node" />
import { EventEmitter } from "events";
import { PacketAssembler } from "node-opcua-packet-assembler";
declare type ErrorCallback = (err?: Error | null) => void;
export declare function setFakeTransport(mockSocket: any): void;
declare type CallbackWithData = (err: Error | null, data?: Buffer) => void;
export declare function getFakeTransport(): any;
export declare abstract class Transport<S extends EventEmitter> extends EventEmitter {
    timeout: number;
    /**
     * indicates the version number of the OPCUA protocol used
     * @default  0
     */
    protocolVersion: number;
    bytesWritten: number;
    bytesRead: number;
    chunkWrittenCount: number;
    chunkReadCount: number;
    name: string;
    _socket: S | null;
    /**
     * the size of the header in bytes
     * @default  8
     */
    protected readonly headerSize: 8;
    protected _disconnecting: boolean;
    protected _timerId: NodeJS.Timer | null;
    private _onSocketClosedHasBeenCalled;
    private _onSocketEndedHasBeenCalled;
    private _theCallback?;
    private _on_error_during_one_time_message_receiver;
    private _pendingBuffer?;
    protected packetAssembler?: PacketAssembler;
    protected _remotePort: number;
    protected _remoteAddress: string;
    readonly remoteAddress: string;
    readonly remotePort: number;
    constructor();
    abstract dispose(): void;
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
    createChunk(msgType: string, chunkType: string, length: number): Buffer;
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
    write(messageChunk: Buffer): void;
    /**
     * disconnect the TCP layer and close the underlying socket.
     * The ```"close"``` event will be emitted to the observers with err=null.
     *
     * @method disconnect
     * @async
     * @param callback
     */
    abstract disconnect(callback: ErrorCallback): void;
    abstract isValid(): boolean;
    protected abstract _write_chunk(messageChunk: Buffer): void;
    protected on_socket_ended(err: Error | null): void;
    /**
     * @method _install_socket
     * @param socket {Socket}
     * @protected
     */
    protected abstract _install_socket(socket: S): void;
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
    protected _install_one_time_message_receiver(callback: CallbackWithData): void;
    private _fulfill_pending_promises;
    protected _on_message_received(messageChunk: Buffer): void;
    protected _cleanup_timers(): void;
    private _start_one_time_message_receiver;
    protected on_socket_closed(err?: Error): void;
    protected _on_socket_data(data: Buffer): void;
    private _on_socket_ended_message;
    protected _on_socket_end(err: Error): void;
    protected _on_socket_error(err: Error): void;
}
export interface ServerTransport<S extends EventEmitter> extends Transport<S> {
    receiveBufferSize: number;
    sendBufferSize: number;
    maxMessageSize: number;
    maxChunkCount: number;
    protocolVersion: number;
    init(socket: S, callback: ErrorCallback): void;
}
export {};
