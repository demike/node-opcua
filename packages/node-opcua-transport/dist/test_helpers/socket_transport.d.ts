import { FakeServer } from "./fake_server";
export declare class SocketTransport extends FakeServer {
    private client;
    private server?;
    constructor();
    initialize(done: () => void): void;
    shutdown(done: (err?: Error) => void): void;
}
