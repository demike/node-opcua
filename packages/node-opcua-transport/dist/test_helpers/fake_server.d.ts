/// <reference types="node" />
import { EventEmitter } from "events";
import * as net from "net";
export declare class FakeServer extends EventEmitter {
    port: number;
    url: string;
    tcpServer: net.Server;
    protected _serverSocket?: net.Socket;
    private _responses?;
    constructor();
    initialize(done: () => void): void;
    shutdown(callback: (err?: Error) => void): void;
    popResponse(): any;
    pushResponse(func: any): void;
}
