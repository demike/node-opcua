"use strict";
/**
 * @module node-opcua-secure-channel
 */
// A SecureChannel is a long-running logical connection between a single Client and a single Server.
// This channel maintains a set of keys known only to the Client and Server, which are used to
// authenticate and encrypt Messages sent across the network. The ClientSecureChannelLayer Services allow
// the Client and Server to securely negotiate the keys to use.
Object.defineProperty(exports, "__esModule", { value: true });
var node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
exports.AsymmetricAlgorithmSecurityHeader = node_opcua_service_secure_channel_1.AsymmetricAlgorithmSecurityHeader;
exports.SymmetricAlgorithmSecurityHeader = node_opcua_service_secure_channel_1.SymmetricAlgorithmSecurityHeader;
var node_opcua_transport_1 = require("node-opcua-transport");
exports.AcknowledgeMessage = node_opcua_transport_1.AcknowledgeMessage;
exports.HelloMessage = node_opcua_transport_1.HelloMessage;
var node_opcua_service_secure_channel_2 = require("node-opcua-service-secure-channel");
exports.OpenSecureChannelRequest = node_opcua_service_secure_channel_2.OpenSecureChannelRequest;
exports.OpenSecureChannelResponse = node_opcua_service_secure_channel_2.OpenSecureChannelResponse;
exports.CloseSecureChannelRequest = node_opcua_service_secure_channel_2.CloseSecureChannelRequest;
exports.CloseSecureChannelResponse = node_opcua_service_secure_channel_2.CloseSecureChannelResponse;
exports.ServiceFault = node_opcua_service_secure_channel_2.ServiceFault;
var message_chunker_1 = require("./message_chunker");
exports.MessageChunker = message_chunker_1.MessageChunker;
var secure_message_chunk_manager_1 = require("./secure_message_chunk_manager");
exports.chooseSecurityHeader = secure_message_chunk_manager_1.chooseSecurityHeader;
//# sourceMappingURL=secure_channel_service.js.map