"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
function readMessageHeader(stream) {
    const msgType = String.fromCharCode(stream.readUInt8()) +
        String.fromCharCode(stream.readUInt8()) +
        String.fromCharCode(stream.readUInt8());
    const isFinal = String.fromCharCode(stream.readUInt8());
    const length = stream.readUInt32();
    return { msgType, isFinal, length };
}
exports.readMessageHeader = readMessageHeader;
//# sourceMappingURL=read_message_header.js.map