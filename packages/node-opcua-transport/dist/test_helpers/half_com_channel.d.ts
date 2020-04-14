/// <reference types="node" />
import { EventEmitter } from "events";
export declare class HalfComChannel extends EventEmitter {
    _hasEnded: boolean;
    constructor();
    write(data: string | Buffer): void;
    end(): void;
    destroy(): void;
    setTimeout(): void;
}
