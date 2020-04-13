"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-service-read
 */
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
node_opcua_assert_1.assert(node_opcua_types_1.ReadRequest.schema.fields[2].name === "timestampsToReturn");
node_opcua_types_1.ReadRequest.schema.fields[2].defaultValue = () => node_opcua_data_value_1.TimestampsToReturn.Both;
node_opcua_assert_1.assert(node_opcua_types_1.ReadValueId.schema.fields[1].name === "attributeId");
node_opcua_types_1.ReadValueId.schema.fields[1].defaultValue = () => node_opcua_data_model_1.AttributeIds.Value;
node_opcua_types_1.ReadValueId.schema.fields[1].validate = (value) => {
    return node_opcua_data_model_1.isValidAttributeId(value) || value === node_opcua_data_model_1.AttributeIds.INVALID;
};
var node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
exports.RequestHeader = node_opcua_service_secure_channel_1.RequestHeader;
exports.ResponseHeader = node_opcua_service_secure_channel_1.ResponseHeader;
// --------------------------------------------------------------------------------
// OPCUA Part 4 $5.10 : Attribute Service Set
// This Service Set provides Service sto access Attributes that are part of Nodes.
//  --------------------------------------------------------------------------------
var node_opcua_types_2 = require("node-opcua-types");
exports.ReadValueId = node_opcua_types_2.ReadValueId;
exports.ReadRequest = node_opcua_types_2.ReadRequest;
exports.ReadResponse = node_opcua_types_2.ReadResponse;
var node_opcua_data_model_2 = require("node-opcua-data-model");
exports.attributeNameById = node_opcua_data_model_2.attributeNameById;
exports.AttributeIds = node_opcua_data_model_2.AttributeIds;
var node_opcua_data_value_2 = require("node-opcua-data-value");
exports.TimestampsToReturn = node_opcua_data_value_2.TimestampsToReturn;
//# sourceMappingURL=index.js.map