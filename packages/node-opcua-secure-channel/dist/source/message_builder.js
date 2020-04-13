"use strict";
/**
 * @module node-opcua-secure-channel
 */
// tslint:disable:variable-name
// tslint:disable:no-console
// tslint:disable:max-line-length
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_factory_1 = require("node-opcua-factory");
const node_opcua_packet_analyzer_1 = require("node-opcua-packet-analyzer");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_transport_1 = require("node-opcua-transport");
const node_opcua_chunkmanager_1 = require("node-opcua-chunkmanager");
const secure_channel_service_1 = require("./secure_channel_service");
const security_policy_1 = require("./security_policy");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const defaultObjectFactory = {
    constructObject: node_opcua_factory_1.constructObject,
    hasConstructor: node_opcua_factory_1.hasConstructor
};
const invalidPrivateKey = "<invalid>";
let counter = 0;
/**
 * @class MessageBuilder
 * @extends MessageBuilderBase
 * @constructor
 *
 * @param options
 * @param options.securityMode {MessageSecurityMode} the security Mode
 * @param [options.objectFactory=factories] a object that provides a constructObject(id) method
 */
class MessageBuilder extends node_opcua_transport_1.MessageBuilderBase {
    constructor(options) {
        super(options);
        options = options || {};
        this.id = (options.name ? options.name : "Id") + counter++;
        this.privateKey = options.privateKey || invalidPrivateKey;
        this.cryptoFactory = null;
        this.securityPolicy = security_policy_1.SecurityPolicy.Invalid; // not known yet
        this.securityMode = options.securityMode || node_opcua_service_secure_channel_1.MessageSecurityMode.Invalid; // not known yet
        this.objectFactory = options.objectFactory || defaultObjectFactory;
        node_opcua_assert_1.assert(_.isFunction(this.objectFactory.constructObject), " the objectFactory must provide a constructObject method");
        this._previousSequenceNumber = -1; // means unknown
        node_opcua_assert_1.assert(_.isFinite(this._previousSequenceNumber));
        this._tokenStack = [];
    }
    setSecurity(securityMode, securityPolicy) {
        node_opcua_assert_1.assert(this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.Invalid, "security already set");
        this.securityPolicy = security_policy_1.coerceSecurityPolicy(securityPolicy);
        this.securityMode = node_opcua_service_secure_channel_1.coerceMessageSecurityMode(securityMode);
        node_opcua_assert_1.assert(this.securityPolicy !== security_policy_1.SecurityPolicy.Invalid);
        node_opcua_assert_1.assert(this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.Invalid);
    }
    dispose() {
        super.dispose();
        // xx this.securityPolicy = undefined;
        // xx this.securityMode = null;
        // xx this.objectFactory = null;
        this.cryptoFactory = null;
        this.securityHeader = undefined;
        this._tokenStack = [];
        this.privateKey = invalidPrivateKey;
    }
    pushNewToken(securityToken, derivedKeys) {
        node_opcua_assert_1.assert(securityToken.hasOwnProperty("tokenId"));
        // TODO: make sure this list doesn't grow indefinitely
        this._tokenStack = this._tokenStack || [];
        node_opcua_assert_1.assert(this._tokenStack.length === 0 || this._tokenStack[0].securityToken.tokenId !== securityToken.tokenId);
        this._tokenStack.push({
            derivedKeys,
            securityToken
        });
        /* istanbul ignore next */
        if (doDebug) {
            debugLog("id=", this.id, chalk_1.default.cyan("Pushing new token with id "), securityToken.tokenId, this.tokenIds());
        }
    }
    _read_headers(binaryStream) {
        super._read_headers(binaryStream);
        node_opcua_assert_1.assert(binaryStream.length === 12);
        const msgType = this.messageHeader.msgType;
        if (msgType === "HEL" || msgType === "ACK") {
            this.securityPolicy = security_policy_1.SecurityPolicy.None;
        }
        else if (msgType === "ERR") {
            // extract Error StatusCode and additional message
            binaryStream.length = 8;
            const errorCode = node_opcua_status_code_1.decodeStatusCode(binaryStream);
            const message = node_opcua_basic_types_1.decodeString(binaryStream);
            /* istanbul ignore next */
            if (doDebug) {
                debugLog(chalk_1.default.red.bold(" ERROR RECEIVED FROM SENDER"), chalk_1.default.cyan(errorCode.toString()), message);
                debugLog(node_opcua_debug_1.hexDump(binaryStream.buffer));
            }
            return true;
        }
        else {
            this.securityHeader = secure_channel_service_1.chooseSecurityHeader(msgType);
            this.securityHeader.decode(binaryStream);
            if (msgType === "OPN") {
                const asymmetricAlgorithmSecurityHeader = this.securityHeader;
                this.securityPolicy = security_policy_1.fromURI(asymmetricAlgorithmSecurityHeader.securityPolicyUri);
                this.cryptoFactory = security_policy_1.getCryptoFactory(this.securityPolicy);
            }
            if (!this._decrypt(binaryStream)) {
                return false;
            }
            this.sequenceHeader = new node_opcua_chunkmanager_1.SequenceHeader();
            this.sequenceHeader.decode(binaryStream);
            /* istanbul ignore next */
            if (doDebug) {
                debugLog(" Sequence Header", this.sequenceHeader);
            }
            this._validateSequenceNumber(this.sequenceHeader.sequenceNumber);
        }
        return true;
    }
    _decodeMessageBody(fullMessageBody) {
        const binaryStream = new node_opcua_binary_stream_1.BinaryStream(fullMessageBody);
        const msgType = this.messageHeader.msgType;
        if (msgType === "ERR") {
            // invalid message type
            this._report_error("ERROR RECEIVED");
            return false;
        }
        if (msgType === "HEL" || msgType === "ACK") {
            // invalid message type
            this._report_error("Invalid message type ( HEL/ACK )");
            return false;
        }
        // read expandedNodeId:
        const id = node_opcua_basic_types_1.decodeExpandedNodeId(binaryStream);
        if (!this.objectFactory.hasConstructor(id)) {
            this._report_error("cannot construct object with nodeID " + id);
            return false;
        }
        let objMessage;
        try {
            // construct the object
            objMessage = this.objectFactory.constructObject(id);
        }
        catch (err) {
            this._report_error("cannot construct object with nodeID " + id);
            return false;
        }
        // construct the object
        if (!objMessage) {
            this._report_error("cannot construct object with nodeID " + id);
            return false;
        }
        else {
            /* istanbul ignore next */
            debugLog("message size =", this.totalMessageSize, " body size =", this.totalBodySize, objMessage.constructor.name);
            if (this._safe_decode_message_body(fullMessageBody, objMessage, binaryStream)) {
                if (!this.sequenceHeader) {
                    throw new Error("internal error");
                }
                try {
                    /**
                     * notify the observers that a full message has been received
                     * @event message
                     * @param  objMessage the decoded message object
                     * @param  msgType the message type ( "HEL","ACK","OPN","CLO" or "MSG" )
                     * @param  the request Id
                     */
                    this.emit("message", objMessage, msgType, this.sequenceHeader.requestId, this.channelId);
                }
                catch (err) {
                    // this code catches a uncaught exception somewhere in one of the event handler
                    // this indicates a bug in the code that uses this class
                    // please check the stack trace to find the problem
                    /* istanbul ignore next */
                    if (doDebug) {
                        debugLog(err);
                    }
                    console.log(chalk_1.default.red("MessageBuilder : ERROR DETECTED IN event handler"));
                    console.log(err.stack);
                }
            }
            else {
                const message = "cannot decode message  for valid object of type " + id.toString() + " " + objMessage.constructor.name;
                console.log(message);
                this._report_error(message);
                return false;
            }
        }
        return true;
    }
    _validateSequenceNumber(sequenceNumber) {
        // checking that sequenceNumber is increasing
        node_opcua_assert_1.assert(_.isFinite(this._previousSequenceNumber));
        node_opcua_assert_1.assert(_.isFinite(sequenceNumber) && sequenceNumber >= 0);
        let expectedSequenceNumber;
        if (this._previousSequenceNumber !== -1) {
            expectedSequenceNumber = this._previousSequenceNumber + 1;
            if (expectedSequenceNumber !== sequenceNumber) {
                const errMessage = "Invalid Sequence Number found ( expected " + expectedSequenceNumber + ", got " + sequenceNumber + ")";
                /* istanbul ignore next */
                debugLog(chalk_1.default.red.bold(errMessage));
                /**
                 * notify the observers that a message with an invalid sequence number has been received.
                 * @event invalid_sequence_number
                 * @param  expected sequence Number
                 * @param  actual sequence Number
                 */
                this.emit("invalid_sequence_number", expectedSequenceNumber, sequenceNumber);
            }
            // todo : handle the case where sequenceNumber wraps back to < 1024
        }
        /* istanbul ignore next */
        if (doDebug) {
            debugLog(chalk_1.default.yellow.bold(" Sequence Number = "), sequenceNumber);
        }
        this._previousSequenceNumber = sequenceNumber;
    }
    _decrypt_OPN(binaryStream) {
        node_opcua_assert_1.assert(this.securityPolicy !== security_policy_1.SecurityPolicy.None);
        node_opcua_assert_1.assert(this.securityPolicy !== security_policy_1.SecurityPolicy.Invalid);
        node_opcua_assert_1.assert(this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None);
        node_opcua_assert_1.assert(this.securityHeader instanceof node_opcua_service_secure_channel_1.AsymmetricAlgorithmSecurityHeader);
        const asymmetricAlgorithmSecurityHeader = this.securityHeader;
        /* istanbul ignore next */
        if (doDebug) {
            debugLog("securityHeader = {");
            debugLog("             securityPolicyId: ", asymmetricAlgorithmSecurityHeader.securityPolicyUri);
            debugLog("             senderCertificate: ", node_opcua_crypto_1.makeSHA1Thumbprint(asymmetricAlgorithmSecurityHeader.senderCertificate).toString("hex"));
            debugLog("};");
        }
        // OpcUA part 2 V 1.02 page 15
        // 4.11 OPC UA Security Related Services
        // [...]
        // The OPC UA Client sends its Public Key in a Digital Certificate and secret information with the
        // OpenSecureChannel service Message to the Server. This Message is secured by applying
        // Asymmetric Encryption with the Server's Public Key and by generating Asymmetric Signatures with
        // the Client's Private Key. However the Digital Certificate is sent unencrypted so that the receiver can
        // use it to verify the Asymmetric Signature.
        // [...]
        //
        /* istanbul ignore next */
        if (doDebug) {
            debugLog(chalk_1.default.cyan("EN------------------------------"));
            // xx debugLog(hexDump(binaryStream.buffer, 32, 0xFFFFFFFF));
            debugLog("---------------------- SENDER CERTIFICATE");
            debugLog("thumbprint ", node_opcua_crypto_1.makeSHA1Thumbprint(asymmetricAlgorithmSecurityHeader.senderCertificate).toString("hex"));
        }
        if (!this.cryptoFactory) {
            this._report_error(" Security Policy " + this.securityPolicy + " is not implemented yet");
            return false;
        }
        // The message has been signed  with sender private key and has been encrypted with receiver public key.
        // We shall decrypt it with the receiver private key.
        const buf = binaryStream.buffer.slice(binaryStream.length);
        if (asymmetricAlgorithmSecurityHeader.receiverCertificateThumbprint) {
            // this mean that the message has been encrypted ....
            node_opcua_assert_1.assert(this.privateKey !== invalidPrivateKey, "expecting a valid private key");
            const decryptedBuffer = this.cryptoFactory.asymmetricDecrypt(buf, this.privateKey);
            // replace decrypted buffer in initial buffer
            decryptedBuffer.copy(binaryStream.buffer, binaryStream.length);
            // adjust length
            binaryStream.buffer = binaryStream.buffer.slice(0, binaryStream.length + decryptedBuffer.length);
            /* istanbul ignore next */
            if (doDebug) {
                debugLog(chalk_1.default.cyan("DE-----------------------------"));
                // debugLog(hexDump(binaryStream.buffer));
                debugLog(chalk_1.default.cyan("-------------------------------"));
                const thumbprint = node_opcua_crypto_1.makeSHA1Thumbprint(asymmetricAlgorithmSecurityHeader.senderCertificate);
                debugLog("Certificate thumbprint:", thumbprint.toString("hex"));
            }
        }
        const cert = node_opcua_crypto_1.exploreCertificateInfo(asymmetricAlgorithmSecurityHeader.senderCertificate);
        // then verify the signature
        const signatureLength = cert.publicKeyLength; // 1024 bits = 128Bytes or 2048=256Bytes or 3072 or 4096
        node_opcua_assert_1.assert(signatureLength === 128 ||
            signatureLength === 256 ||
            signatureLength === 384 ||
            signatureLength === 512);
        const chunk = binaryStream.buffer;
        const signatureIsOK = security_policy_1.asymmetricVerifyChunk(this.cryptoFactory, chunk, asymmetricAlgorithmSecurityHeader.senderCertificate);
        if (!signatureIsOK) {
            /* istanbul ignore next */
            if (doDebug) {
                debugLog(node_opcua_debug_1.hexDump(binaryStream.buffer));
            }
            this._report_error("Sign and Encrypt asymmetricVerify : Invalid packet signature");
            return false;
        }
        // remove signature
        binaryStream.buffer = node_opcua_crypto_1.reduceLength(binaryStream.buffer, signatureLength);
        // remove padding
        if (asymmetricAlgorithmSecurityHeader.receiverCertificateThumbprint) {
            binaryStream.buffer = node_opcua_crypto_1.removePadding(binaryStream.buffer);
        }
        return true; // success
    }
    tokenIds() {
        return this._tokenStack.map((a) => a.securityToken.tokenId);
    }
    _select_matching_token(tokenId) {
        /* istanbul ignore next */
        if (doDebug) {
            debugLog("id=", this.id, " ", chalk_1.default.yellow("_select_matching_token : searching token "), tokenId, "length = ", this._tokenStack.length, this.tokenIds());
        }
        // this method select the security token matching the provided tokenId
        // it also get rid of older security token
        let gotNewToken = false;
        while (this._tokenStack.length) {
            const firstToken = this._tokenStack[0];
            if (firstToken.securityToken.tokenId === tokenId) {
                if (gotNewToken) {
                    this.emit("new_token", tokenId);
                }
                /* istanbul ignore next */
                if (doDebug) {
                    debugLog("id=", this.id, chalk_1.default.red(" found token"), gotNewToken, firstToken.securityToken.tokenId, this.tokenIds());
                }
                return firstToken;
            }
            // remove first
            this._tokenStack.shift();
            /* istanbul ignore next */
            if (doDebug) {
                debugLog("id=", this.id, "Remove first token ", firstToken.securityToken.tokenId, this.tokenIds());
            }
            gotNewToken = true;
        }
        /* istanbul ignore next */
        if (doDebug) {
            debugLog("id=", this.id, " Cannot find token ", tokenId);
        }
        return null;
    }
    _decrypt_MSG(binaryStream) {
        node_opcua_assert_1.assert(this.securityHeader instanceof secure_channel_service_1.SymmetricAlgorithmSecurityHeader);
        node_opcua_assert_1.assert(this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None);
        node_opcua_assert_1.assert(this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.Invalid);
        node_opcua_assert_1.assert(this.securityPolicy !== security_policy_1.SecurityPolicy.None);
        node_opcua_assert_1.assert(this.securityPolicy !== security_policy_1.SecurityPolicy.Invalid);
        const symmetricAlgorithmSecurityHeader = this.securityHeader;
        // Check  security token
        // securityToken may have been renewed
        const securityTokenData = this._select_matching_token(symmetricAlgorithmSecurityHeader.tokenId);
        if (!securityTokenData) {
            this._report_error("Security token data for token " + symmetricAlgorithmSecurityHeader.tokenId + " doesn't exist");
            return false;
        }
        node_opcua_assert_1.assert(securityTokenData.hasOwnProperty("derivedKeys"));
        // SecurityToken may have expired, in this case the MessageBuilder shall reject the message
        if (securityTokenData.securityToken.expired) {
            this._report_error("Security token has expired : tokenId " + securityTokenData.securityToken.tokenId);
            return false;
        }
        // We shall decrypt it with the receiver private key.
        const buf = binaryStream.buffer.slice(binaryStream.length);
        if (!securityTokenData.derivedKeys) {
            console.log("xxxxxxx NO DERIVED KEYX");
            return false;
        }
        const derivedKeys = securityTokenData.derivedKeys;
        node_opcua_assert_1.assert(derivedKeys !== null);
        node_opcua_assert_1.assert(derivedKeys.signatureLength > 0, " must provide a signature length");
        if (this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.SignAndEncrypt) {
            const decryptedBuffer = node_opcua_crypto_1.decryptBufferWithDerivedKeys(buf, derivedKeys);
            // replace decrypted buffer in initial buffer
            decryptedBuffer.copy(binaryStream.buffer, binaryStream.length);
            // adjust length
            binaryStream.buffer = binaryStream.buffer.slice(0, binaryStream.length + decryptedBuffer.length);
            /* istanbul ignore next */
            if (doDebug) {
                debugLog(chalk_1.default.cyan("DE-----------------------------"));
                debugLog(node_opcua_debug_1.hexDump(binaryStream.buffer));
                debugLog(chalk_1.default.cyan("-------------------------------"));
            }
        }
        // now check signature ....
        const chunk = binaryStream.buffer;
        const signatureIsOK = node_opcua_crypto_1.verifyChunkSignatureWithDerivedKeys(chunk, derivedKeys);
        if (!signatureIsOK) {
            this._report_error("_decrypt_MSG : Sign and Encrypt : Invalid packet signature");
            return false;
        }
        // remove signature
        binaryStream.buffer = node_opcua_crypto_1.reduceLength(binaryStream.buffer, derivedKeys.signatureLength);
        if (this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.SignAndEncrypt) {
            // remove padding
            binaryStream.buffer = node_opcua_crypto_1.removePadding(binaryStream.buffer);
        }
        return true;
    }
    _decrypt(binaryStream) {
        if (this.securityPolicy === security_policy_1.SecurityPolicy.Invalid) {
            // this._report_error("SecurityPolicy");
            // return false;
            return true;
        }
        const msgType = this.messageHeader.msgType;
        // check if security is active or not
        if (this.securityPolicy === security_policy_1.SecurityPolicy.None) {
            this.securityMode = node_opcua_service_secure_channel_1.MessageSecurityMode.None;
            node_opcua_assert_1.assert(this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.None, "expecting securityMode = None when securityPolicy is None");
            return true; // nothing to do
        }
        node_opcua_assert_1.assert(this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None);
        if (msgType === "OPN") {
            return this._decrypt_OPN(binaryStream);
        }
        else {
            return this._decrypt_MSG(binaryStream);
        }
    }
    _safe_decode_message_body(fullMessageBody, objMessage, binaryStream) {
        try {
            // de-serialize the object from the binary stream
            const options = this.objectFactory;
            objMessage.decode(binaryStream, options);
        }
        catch (err) {
            console.log(err);
            console.log(err.stack);
            console.log(node_opcua_debug_1.hexDump(fullMessageBody));
            node_opcua_packet_analyzer_1.analyseExtensionObject(fullMessageBody, 0, 0);
            console.log(" ---------------- block");
            let i = 0;
            this.messageChunks.forEach((messageChunk) => {
                console.log(" ---------------- chunk i=", i++);
                console.log(node_opcua_debug_1.hexDump(messageChunk));
            });
            return false;
        }
        return true;
    }
}
exports.MessageBuilder = MessageBuilder;
//# sourceMappingURL=message_builder.js.map