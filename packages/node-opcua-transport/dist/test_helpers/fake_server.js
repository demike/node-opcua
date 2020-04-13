"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const net = require("net");
const node_opcua_assert_1 = require("node-opcua-assert");
class FakeServer extends events_1.EventEmitter {
    constructor() {
        super();
        const port = 5678;
        this.port = port;
        this.url = "opc.tcp://localhost:" + port;
        this.tcpServer = new net.Server();
        this._serverSocket = undefined;
        this.tcpServer.on("connection", (socket) => {
            node_opcua_assert_1.assert(!this._serverSocket, " already connected");
            this._serverSocket = socket;
            this._serverSocket.on("data", (data) => {
                const func = this.popResponse();
                if (func) {
                    func(this._serverSocket, data);
                }
            });
            this._serverSocket.on("err", (err) => {
                // console.log(" @@@@ socket err ",err);
            });
            this._serverSocket.on("close", (err) => {
                // console.log(" @@@@ socket closed ",err);
            });
            this._serverSocket.on("end", (err) => {
                // console.log(" @@@@ socket end ",err);
                this.emit("end", err);
            });
        });
    }
    initialize(done) {
        this.tcpServer.listen(this.port, () => {
            done();
        });
    }
    shutdown(callback) {
        this.tcpServer.close(callback);
    }
    popResponse() {
        if (!this._responses) {
            return null;
        }
        return this._responses.shift();
    }
    pushResponse(func) {
        this._responses = this._responses || [];
        this._responses.push(func);
    }
}
exports.FakeServer = FakeServer;
//# sourceMappingURL=fake_server.js.map