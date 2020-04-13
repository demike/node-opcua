"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_factory_1 = require("node-opcua-factory");
var BrowseDirection;
(function (BrowseDirection) {
    BrowseDirection[BrowseDirection["Forward"] = 0] = "Forward";
    BrowseDirection[BrowseDirection["Inverse"] = 1] = "Inverse";
    BrowseDirection[BrowseDirection["Both"] = 2] = "Both";
    BrowseDirection[BrowseDirection["Invalid"] = 3] = "Invalid";
})(BrowseDirection = exports.BrowseDirection || (exports.BrowseDirection = {}));
exports.schemaBrowseDirection = {
    name: "BrowseDirection",
    enumValues: BrowseDirection,
};
function encodeBrowseDirection(value, stream) {
    stream.writeUInt32(value);
}
exports.encodeBrowseDirection = encodeBrowseDirection;
function decodeBrowseDirection(stream) {
    return stream.readUInt32();
}
exports.decodeBrowseDirection = decodeBrowseDirection;
exports._enumerationBrowseDirection = node_opcua_factory_1.registerEnumeration(exports.schemaBrowseDirection);
//# sourceMappingURL=BrowseDirection.js.map