"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
const source_1 = require("../source");
const half_com_channel_1 = require("./half_com_channel");
class DirectTransport extends events_1.EventEmitter {
    constructor() {
        super();
        this.client = new half_com_channel_1.HalfComChannel();
        this.server = new half_com_channel_1.HalfComChannel();
        this.client.on("send_data", (data) => {
            node_opcua_assert_1.assert(data instanceof Buffer);
            this.server.emit("data", data);
        });
        this.server.on("send_data", (data) => {
            node_opcua_assert_1.assert(data instanceof Buffer);
            this.client.emit("data", data);
        });
        this.server.on("ending", () => {
            this.client.emit("end");
            this.client._hasEnded = true;
        });
        this.client.on("ending", () => {
            this.server.emit("end");
            this.server._hasEnded = true;
        });
        this.server.on("end", (err) => {
            this.emit("end", err);
        });
        this.server.on("data", (data) => {
            const func = this.popResponse();
            if (func) {
                func(this.server, data);
            }
        });
        this.url = "fake://localhost:2033/SomeAddress";
    }
    initialize(done) {
        source_1.setFakeTransport(this.client);
        done();
    }
    shutdown(done) {
        this.client.end();
        this.server.end();
        if (done) {
            setImmediate(done);
        }
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
exports.DirectTransport = DirectTransport;
//# sourceMappingURL=direct_transport.js.map