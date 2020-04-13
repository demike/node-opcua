"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const source_1 = require("../source");
// tslint:disable:no-var-requires
const getFixture = require("node-opcua-test-fixtures").getFixture;
function construct_makeMessageChunkSignatureForTest() {
    const privateKey = fs.readFileSync(getFixture("certs/server_key_1024.pem")).toString("ascii");
    return (chunk) => {
        const options = {
            algorithm: "RSA-SHA256",
            privateKey,
            signatureLength: 128,
        };
        const buf = node_opcua_crypto_1.makeMessageChunkSignature(chunk, options); // Buffer
        node_opcua_assert_1.assert(buf instanceof Buffer, "expecting a Buffer");
        return buf;
    };
}
exports.makeMessageChunkSignatureForTest = construct_makeMessageChunkSignatureForTest();
function construct_verifyMessageChunkSignatureForTest() {
    const publicKey = fs.readFileSync(getFixture("certs/server_public_key_1024.pub")).toString("ascii");
    return (chunk) => {
        node_opcua_assert_1.assert(chunk instanceof Buffer);
        const options = {
            algorithm: "RSA-SHA256",
            publicKey,
            signatureLength: 128
        };
        return node_opcua_crypto_1.verifyChunkSignature(chunk, options);
    };
}
exports.construct_verifyMessageChunkSignatureForTest = construct_verifyMessageChunkSignatureForTest;
exports.verifyMessageChunkSignatureForTest = construct_verifyMessageChunkSignatureForTest();
function performMessageChunkManagerTest(options) {
    options = options || {};
    const securityHeader = new node_opcua_service_secure_channel_1.SymmetricAlgorithmSecurityHeader();
    const bodySize = 32;
    const headerSize = 12 + securityHeader.binaryStoreSize();
    options.signatureLength = options.signatureLength || 0; // 128 bytes for signature
    options.chunkSize = bodySize + options.signatureLength + headerSize + 8; // bodySize useful bytes
    options.requestId = 1;
    const sequenceNumberGenerator = new source_1.SequenceNumberGenerator();
    const msgChunkManager = new source_1.SecureMessageChunkManager("HEL", options, securityHeader, sequenceNumberGenerator);
    const chunks = [];
    let chunkCounter = 0;
    function collect_chunk(chunk) {
        const chunkCopy = Buffer.allocUnsafe(chunk.length);
        chunk.copy(chunkCopy, 0, 0, chunk.length);
        // append the copy to our chunk collection
        chunks.push(chunkCopy);
    }
    msgChunkManager.on("chunk", (chunk, final) => {
        collect_chunk(chunk);
        chunkCounter += 1;
        if (!final) {
            // all packets shall be 'chunkSize'  byte long, except last
            chunk.length.should.equal(options.chunkSize);
        }
        else {
            // last packet is smaller
            // chunk.length.should.equal(  20 +/*padding*/  options.headerSize + options.signatureLength);
            chunkCounter.should.eql(5);
        }
    });
    // feed chunk-manager one byte at a time
    const n = (bodySize) * 4 + 12;
    const buf = Buffer.alloc(1);
    for (let i = 0; i < n; i += 1) {
        buf.writeUInt8(i % 256, 0);
        msgChunkManager.write(buf, 1);
    }
    // write this single buffer
    msgChunkManager.end();
    chunks.length.should.equal(5);
    // checking final flags ...
    chunks.forEach((chunk) => {
        chunk.slice(0, 3).toString().should.eql("HEL");
    });
    // check length
    chunks[0].slice(4, 8).readUInt32LE(0).should.eql(options.chunkSize);
    chunks[1].slice(4, 8).readUInt32LE(0).should.eql(options.chunkSize);
    chunks[2].slice(4, 8).readUInt32LE(0).should.eql(options.chunkSize);
    chunks[3].slice(4, 8).readUInt32LE(0).should.eql(options.chunkSize);
    chunks[chunks.length - 1].slice(4, 8).readUInt32LE(0).should.eql(12 + options.signatureLength + headerSize + 8);
    // check final car
    chunks[0].readUInt8(3).should.equal("C".charCodeAt(0));
    chunks[1].readUInt8(3).should.equal("C".charCodeAt(0));
    chunks[2].readUInt8(3).should.equal("C".charCodeAt(0));
    chunks[3].readUInt8(3).should.equal("C".charCodeAt(0));
    chunks[chunks.length - 1].readUInt8(3).should.equal("F".charCodeAt(0));
    if (options.verifyBufferFunc) {
        chunks.forEach(options.verifyBufferFunc);
    }
}
exports.performMessageChunkManagerTest = performMessageChunkManagerTest;
//# sourceMappingURL=signature_helpers.js.map