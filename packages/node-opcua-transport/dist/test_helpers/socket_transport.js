"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-empty
const net = require("net");
const fake_server_1 = require("./fake_server");
class SocketTransport extends fake_server_1.FakeServer {
    constructor() {
        super();
        this.client = new net.Socket();
        this.client.connect(this.port, (err) => {
        });
    }
    initialize(done) {
        super.initialize(() => {
            this.tcpServer.on("connection", (socket) => {
                this.server = this._serverSocket;
                done();
            });
        });
    }
    shutdown(done) {
        this.client.end();
        super.shutdown((err) => {
            done(err);
        });
    }
}
exports.SocketTransport = SocketTransport;
//# sourceMappingURL=socket_transport.js.map