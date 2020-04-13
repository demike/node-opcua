"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-console
const chalk_1 = require("chalk");
const events_1 = require("events");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_packet_analyzer_1 = require("node-opcua-packet-analyzer");
const node_opcua_service_endpoints_1 = require("node-opcua-service-endpoints");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const node_opcua_service_session_1 = require("node-opcua-service-session");
const node_opcua_transport_1 = require("node-opcua-transport");
const test_helpers_1 = require("node-opcua-transport/dist/test_helpers");
const _ = require("underscore");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
exports.fakeAcknowledgeMessage = new node_opcua_transport_1.AcknowledgeMessage({
    maxChunkCount: 600000,
    maxMessageSize: 100000,
    protocolVersion: 0,
    receiveBufferSize: 8192,
    sendBufferSize: 8192,
});
exports.fakeCloseSecureChannelResponse = new node_opcua_service_secure_channel_1.CloseSecureChannelResponse({});
exports.fakeOpenSecureChannelResponse = new node_opcua_service_secure_channel_1.OpenSecureChannelResponse({
    serverProtocolVersion: 0,
    securityToken: {
        channelId: 23,
        createdAt: new Date(),
        revisedLifetime: 30000,
        tokenId: 1,
    },
    serverNonce: Buffer.from("qwerty")
});
exports.fakeGetEndpointsResponse = new node_opcua_service_endpoints_1.GetEndpointsResponse({
    endpoints: [
        {
            endpointUrl: "fake://localhost:2033/SomeAddress"
        }
    ]
});
exports.fakeCreateSessionResponse = new node_opcua_service_session_1.CreateSessionResponse({});
exports.fakeActivateSessionResponse = new node_opcua_service_session_1.ActivateSessionResponse({});
class MockServerTransport extends events_1.EventEmitter {
    constructor(expectedReplies) {
        super();
        this._replies = expectedReplies;
        this._counter = 0;
        this._mockTransport = new test_helpers_1.DirectTransport();
        this._mockTransport.initialize(() => {
            console.log("initialized");
        });
        this._mockTransport.server.on("data", (data) => {
            let reply = this._replies[this._counter];
            this._counter++;
            if (reply) {
                if (_.isFunction(reply)) {
                    reply = reply.call(this);
                    // console.log(" interpreting reply as a function" + reply);
                    if (!reply) {
                        return;
                    }
                }
                debugLog("\nFAKE SERVER RECEIVED");
                debugLog(node_opcua_debug_1.hexDump(data));
                let replies = [];
                if (reply instanceof Buffer) {
                    replies.push(reply);
                }
                else {
                    replies = reply;
                }
                node_opcua_assert_1.assert(replies.length >= 1, " expecting at least one reply " + JSON.stringify(reply));
                replies.forEach((reply1) => {
                    debugLog("\nFAKE SERVER SEND");
                    debugLog(chalk_1.default.red(node_opcua_debug_1.hexDump(reply1)));
                    this._mockTransport.server.write(reply1);
                });
            }
            else {
                const msg = " MockServerTransport has no more packets to send to client to" +
                    " emulate server responses.... ";
                console.log(chalk_1.default.red.bold(msg));
                console.log(chalk_1.default.blue.bold(node_opcua_debug_1.hexDump(data)));
                node_opcua_debug_1.display_trace_from_this_projet_only();
                node_opcua_packet_analyzer_1.analyseExtensionObject(data, 0, 0, {});
                this.emit("done");
            }
        });
    }
}
exports.MockServerTransport = MockServerTransport;
//# sourceMappingURL=mock_transport.js.map