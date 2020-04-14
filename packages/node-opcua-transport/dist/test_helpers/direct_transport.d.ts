/// <reference types="node" />
import { EventEmitter } from "events";
import { HalfComChannel } from "./half_com_channel";
export declare class DirectTransport extends EventEmitter {
    client: HalfComChannel;
    server: HalfComChannel;
    url: string;
    private _responses?;
    constructor();
    initialize(done: () => void): void;
    shutdown(done: () => void): void;
    popResponse(): any;
    pushResponse(func: any): void;
}
