"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_factory_1 = require("node-opcua-factory");
var DataValueEncodingByte;
(function (DataValueEncodingByte) {
    DataValueEncodingByte[DataValueEncodingByte["Value"] = 1] = "Value";
    DataValueEncodingByte[DataValueEncodingByte["StatusCode"] = 2] = "StatusCode";
    DataValueEncodingByte[DataValueEncodingByte["SourceTimestamp"] = 4] = "SourceTimestamp";
    DataValueEncodingByte[DataValueEncodingByte["ServerTimestamp"] = 8] = "ServerTimestamp";
    DataValueEncodingByte[DataValueEncodingByte["SourcePicoseconds"] = 16] = "SourcePicoseconds";
    DataValueEncodingByte[DataValueEncodingByte["ServerPicoseconds"] = 32] = "ServerPicoseconds";
})(DataValueEncodingByte = exports.DataValueEncodingByte || (exports.DataValueEncodingByte = {}));
exports.schemaDataValueEncodingByte = {
    name: "DataValue_EncodingByte",
    enumValues: DataValueEncodingByte
};
exports._enumerationDataValueEncodingByte = node_opcua_factory_1.registerEnumeration(exports.schemaDataValueEncodingByte);
//# sourceMappingURL=DataValueEncodingByte_enum.js.map