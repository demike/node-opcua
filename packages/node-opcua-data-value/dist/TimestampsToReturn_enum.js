"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_factory_1 = require("node-opcua-factory");
var TimestampsToReturn;
(function (TimestampsToReturn) {
    TimestampsToReturn[TimestampsToReturn["Source"] = 0] = "Source";
    TimestampsToReturn[TimestampsToReturn["Server"] = 1] = "Server";
    TimestampsToReturn[TimestampsToReturn["Both"] = 2] = "Both";
    TimestampsToReturn[TimestampsToReturn["Neither"] = 3] = "Neither";
    TimestampsToReturn[TimestampsToReturn["Invalid"] = 4] = "Invalid";
})(TimestampsToReturn = exports.TimestampsToReturn || (exports.TimestampsToReturn = {}));
exports.schemaTimestampsToReturn = {
    name: "TimestampsToReturn",
    enumValues: TimestampsToReturn
};
function encodeTimestampsToReturn(value, stream) {
    stream.writeUInt32(value);
}
exports.encodeTimestampsToReturn = encodeTimestampsToReturn;
function clamp(min, a, max) {
    return Math.max(Math.min(a, max), min);
}
function decodeTimestampsToReturn(stream) {
    return clamp(TimestampsToReturn.Source, stream.readUInt32(), TimestampsToReturn.Invalid);
}
exports.decodeTimestampsToReturn = decodeTimestampsToReturn;
exports._enumerationTimestampsToReturn = node_opcua_factory_1.registerEnumeration(exports.schemaTimestampsToReturn);
//# sourceMappingURL=TimestampsToReturn_enum.js.map