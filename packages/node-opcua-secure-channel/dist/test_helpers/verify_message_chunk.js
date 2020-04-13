"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// tslint:disable:no-console
const node_opcua_packet_analyzer_1 = require("node-opcua-packet-analyzer");
const index_1 = require("../source/index");
/**
 *
 * @param packets
 */
function verify_multi_chunk_message(packets) {
    const messageBuilder = new index_1.MessageBuilder({});
    messageBuilder.setSecurity(index_1.MessageSecurityMode.None, index_1.SecurityPolicy.None);
    messageBuilder.on("full_message_body", (fullMessageBody) => {
        console.log("full_message_body received:");
        node_opcua_packet_analyzer_1.analyseExtensionObject(fullMessageBody, 0, 0);
    });
    messageBuilder.on("start_chunk", (info) => {
        console.log(" starting new chunk ", info.messageHeader);
    });
    messageBuilder.on("chunk", (messageChunk) => {
        console.log(index_1.messageHeaderToString(messageChunk));
    });
    let totalLength = 0;
    packets.forEach((packet) => {
        if (packet instanceof Array) {
            packet = Buffer.from(packet);
        }
        totalLength += packet.length;
        // console.log(sprintf(" adding packet size : %5d l=%d", packet.length, totalLength));
        messageBuilder.feed(packet);
    });
}
exports.verify_multi_chunk_message = verify_multi_chunk_message;
function verify_single_chunk_message(packet) {
    verify_multi_chunk_message([packet]);
}
exports.verify_single_chunk_message = verify_single_chunk_message;
//# sourceMappingURL=verify_message_chunk.js.map