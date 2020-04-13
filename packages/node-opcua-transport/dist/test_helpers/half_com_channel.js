"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-empty
// tslint:disable:unused-variable
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
class HalfComChannel extends events_1.EventEmitter {
    constructor() {
        super();
        this._hasEnded = false;
    }
    write(data) {
        if (typeof data === "string") {
            data = Buffer.from(data);
        }
        node_opcua_assert_1.assert(data instanceof Buffer, "HalfComChannel.write expecting a buffer");
        const copy = Buffer.concat([data]);
        this.emit("send_data", copy);
    }
    end() {
        if (!this._hasEnded) {
            node_opcua_assert_1.assert(!this._hasEnded, "half communication channel has already ended !");
            this._hasEnded = true;
            this.emit("ending");
            this.emit("end");
        }
    }
    destroy() {
    }
    setTimeout() {
    }
}
exports.HalfComChannel = HalfComChannel;
//# sourceMappingURL=half_com_channel.js.map