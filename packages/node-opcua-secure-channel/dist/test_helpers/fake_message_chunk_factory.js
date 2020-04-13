"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const fs = require("fs");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const source_1 = require("../source");
// tslint:disable:no-var-requires
const getFixture = require("node-opcua-test-fixtures").getFixture;
const senderCertificate = node_opcua_crypto_1.readCertificate(getFixture("certs/client_cert_1024.pem"));
const senderPrivateKey = node_opcua_crypto_1.readKeyPem(getFixture("certs/client_key_1024.pem"));
const receiverCertificate = node_opcua_crypto_1.readCertificate(getFixture("certs/server_cert_1024.pem"));
const receiverCertificateThumbprint = node_opcua_crypto_1.makeSHA1Thumbprint(receiverCertificate);
const receiverPublicKey = fs.readFileSync(getFixture("certs/server_public_key_1024.pub", "ascii")).toString();
const sequenceNumberGenerator = new source_1.SequenceNumberGenerator();
function iterateOnSignedMessageChunks(buffer, callback) {
    const params = {
        algorithm: "RSA-SHA1",
        privateKey: senderPrivateKey,
        signatureLength: 128,
    };
    const options = {
        chunkSize: 2048,
        cipherBlockSize: 0,
        plainBlockSize: 0,
        requestId: 10,
        sequenceHeaderSize: 0,
        signBufferFunc: (chunk) => node_opcua_crypto_1.makeMessageChunkSignature(chunk, params),
        signatureLength: 128,
    };
    const securityHeader = new node_opcua_service_secure_channel_1.AsymmetricAlgorithmSecurityHeader({
        receiverCertificateThumbprint: null,
        securityPolicyUri: "http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15",
        senderCertificate,
    });
    const msgChunkManager = new source_1.SecureMessageChunkManager("OPN", options, securityHeader, sequenceNumberGenerator);
    msgChunkManager.on("chunk", (chunk, final) => callback(null, chunk));
    msgChunkManager.write(buffer, buffer.length);
    msgChunkManager.end();
}
exports.iterateOnSignedMessageChunks = iterateOnSignedMessageChunks;
function iterateOnSignedAndEncryptedMessageChunks(buffer, callback) {
    const params = { signatureLength: 128, algorithm: "RSA-SHA1", privateKey: senderPrivateKey };
    const options = {
        chunkSize: 2048,
        cipherBlockSize: 128,
        encryptBufferFunc: (chunk) => node_opcua_crypto_1.publicEncrypt_long(chunk, receiverPublicKey, 128, 11, node_opcua_crypto_1.RSA_PKCS1_PADDING),
        plainBlockSize: 128 - 11,
        requestId: 10,
        sequenceHeaderSize: 0,
        signBufferFunc: (chunk) => node_opcua_crypto_1.makeMessageChunkSignature(chunk, params),
        signatureLength: 128,
    };
    const securityHeader = new node_opcua_service_secure_channel_1.AsymmetricAlgorithmSecurityHeader({
        receiverCertificateThumbprint,
        securityPolicyUri: "http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15",
        senderCertificate,
    });
    const msgChunkManager = new source_1.SecureMessageChunkManager("OPN", options, securityHeader, sequenceNumberGenerator);
    msgChunkManager.on("chunk", (chunk, final) => callback(null, chunk));
    msgChunkManager.write(buffer, buffer.length);
    msgChunkManager.end();
}
exports.iterateOnSignedAndEncryptedMessageChunks = iterateOnSignedAndEncryptedMessageChunks;
const secret = Buffer.from("My Little Secret");
const seed = Buffer.from("My Little Seed");
const globalOptions = {
    signingKeyLength: 16,
    encryptingKeyLength: 16,
    encryptingBlockSize: 16,
    signatureLength: 20,
    algorithm: "aes-128-cbc"
};
exports.derivedKeys = node_opcua_crypto_1.computeDerivedKeys(secret, seed, globalOptions);
function iterateOnSymmetricEncryptedChunk(buffer, callback) {
    const options = {
        chunkSize: 1024,
        encryptBufferFunc: null,
        plainBlockSize: 0,
        requestId: 10,
        signBufferFunc: null,
        signatureLength: 0,
    };
    options.signatureLength = exports.derivedKeys.signatureLength;
    options.signBufferFunc = (chunk) => node_opcua_crypto_1.makeMessageChunkSignatureWithDerivedKeys(chunk, exports.derivedKeys);
    options.plainBlockSize = exports.derivedKeys.encryptingBlockSize;
    options.cipherBlockSize = exports.derivedKeys.encryptingBlockSize;
    options.encryptBufferFunc = (chunk) => node_opcua_crypto_1.encryptBufferWithDerivedKeys(chunk, exports.derivedKeys);
    const securityHeader = new node_opcua_service_secure_channel_1.SymmetricAlgorithmSecurityHeader({
        tokenId: 10
    });
    const msgChunkManager = new source_1.SecureMessageChunkManager("MSG", options, securityHeader, sequenceNumberGenerator);
    msgChunkManager.on("chunk", (chunk, final) => callback(null, chunk));
    msgChunkManager.write(buffer, buffer.length);
    msgChunkManager.end();
}
exports.iterateOnSymmetricEncryptedChunk = iterateOnSymmetricEncryptedChunk;
//# sourceMappingURL=fake_message_chunk_factory.js.map