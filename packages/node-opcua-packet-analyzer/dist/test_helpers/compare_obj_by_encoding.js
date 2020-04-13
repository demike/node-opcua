"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const should = require("should");
const persist = should;
function compare_obj_by_encoding(obj1, obj2) {
    function encoded(obj) {
        const stream = new node_opcua_binary_stream_1.BinaryStream(obj.binaryStoreSize());
        obj.encode(stream);
        return stream.buffer.toString("hex");
    }
    encoded(obj1).should.eql(encoded(obj2));
    return true;
}
exports.compare_obj_by_encoding = compare_obj_by_encoding;
//# sourceMappingURL=compare_obj_by_encoding.js.map