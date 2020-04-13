"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-history
 */
const node_opcua_data_value_1 = require("node-opcua-data-value");
var node_opcua_types_1 = require("node-opcua-types");
exports.AggregateConfiguration = node_opcua_types_1.AggregateConfiguration;
exports.HistoryData = node_opcua_types_1.HistoryData;
exports.HistoryModifiedData = node_opcua_types_1.HistoryModifiedData;
exports.HistoryReadDetails = node_opcua_types_1.HistoryReadDetails;
exports.HistoryReadValueId = node_opcua_types_1.HistoryReadValueId;
exports.HistoryReadResult = node_opcua_types_1.HistoryReadResult;
exports.HistoryUpdateResult = node_opcua_types_1.HistoryUpdateResult;
exports.HistoryReadRequest = node_opcua_types_1.HistoryReadRequest;
exports.HistoryReadResponse = node_opcua_types_1.HistoryReadResponse;
exports.HistoryUpdateRequest = node_opcua_types_1.HistoryUpdateRequest;
exports.HistoryUpdateResponse = node_opcua_types_1.HistoryUpdateResponse;
exports.ReadRawModifiedDetails = node_opcua_types_1.ReadRawModifiedDetails;
exports.ReadProcessedDetails = node_opcua_types_1.ReadProcessedDetails;
exports.ReadAtTimeDetails = node_opcua_types_1.ReadAtTimeDetails;
exports.HistoryUpdateType = node_opcua_types_1.HistoryUpdateType;
exports.ModificationInfo = node_opcua_types_1.ModificationInfo;
exports.ReadEventDetails = node_opcua_types_1.ReadEventDetails;
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_types_2 = require("node-opcua-types");
node_opcua_assert_1.assert(node_opcua_types_2.HistoryReadRequest.schema.fields[2].name === "timestampsToReturn");
node_opcua_types_2.HistoryReadRequest.schema.fields[2].defaultValue = node_opcua_data_value_1.TimestampsToReturn.Neither;
//# sourceMappingURL=imports.js.map