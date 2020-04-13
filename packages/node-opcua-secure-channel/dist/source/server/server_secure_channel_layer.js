"use strict";
/**
 * @module node-opcua-secure-channel
 */
// tslint:disable:variable-name
// tslint:disable:no-empty
// tslint:disable:no-console
// tslint:disable:max-line-length
// tslint:disable:no-shadowed-variable
// tslint:disable:no-var-requires
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = require("chalk");
const crypto = require("crypto");
const events_1 = require("events");
const _ = require("underscore");
const util_1 = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_packet_analyzer_1 = require("node-opcua-packet-analyzer");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_utils_1 = require("node-opcua-utils");
const message_builder_1 = require("../message_builder");
const message_chunker_1 = require("../message_chunker");
const security_policy_1 = require("../security_policy");
const services_1 = require("../services");
const node_opcua_certificate_manager_1 = require("node-opcua-certificate-manager");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const doTraceMessages = process.env.DEBUG && process.env.DEBUG.indexOf("TRACE") >= 0;
let gLastChannelId = 0;
function getNextChannelId() {
    gLastChannelId += 1;
    return gLastChannelId;
}
const doPerfMonitoring = false;
function _dump_transaction_statistics(stats) {
    if (stats) {
        console.log("                Bytes Read : ", stats.bytesRead);
        console.log("             Bytes Written : ", stats.bytesWritten);
        console.log("   time to receive request : ", stats.lap_reception / 1000, " sec");
        console.log("   time to process request : ", stats.lap_processing / 1000, " sec");
        console.log("   time to send response   : ", stats.lap_emission / 1000, " sec");
    }
}
// istanbul ignore next
function dump_request(request, requestId, channelId) {
    console.log(chalk_1.default.cyan("xxxx   <<<< ---------------------------------------- "), chalk_1.default.yellow(request.schema.name), "requestId", requestId, "channelId=", channelId);
    console.log(request.toString());
    console.log(chalk_1.default.cyan("xxxx   <<<< ---------------------------------------- \n"));
}
function isValidSecurityPolicy(securityPolicy) {
    switch (securityPolicy) {
        case security_policy_1.SecurityPolicy.None:
        case security_policy_1.SecurityPolicy.Basic128Rsa15:
        case security_policy_1.SecurityPolicy.Basic256:
        case security_policy_1.SecurityPolicy.Basic256Sha256:
            return node_opcua_status_code_1.StatusCodes.Good;
        default:
            return node_opcua_status_code_1.StatusCodes.BadSecurityPolicyRejected;
    }
}
/**
 * @class ServerSecureChannelLayer
 * @extends EventEmitter
 * @uses MessageBuilder
 * @uses MessageChunker
 */
class ServerSecureChannelLayer extends events_1.EventEmitter {
    constructor(options, transport) {
        super();
        /**
         * the channel message security policy
         */
        this.securityPolicy = security_policy_1.SecurityPolicy.Invalid;
        this._on_response = null;
        this.__verifId = {};
        this._abort_has_been_called = false;
        this.endpoint = null;
        this._remoteAddress = "";
        this._remotePort = 0;
        this.receiverCertificate = null;
        this.receiverPublicKey = null;
        this.receiverPublicKeyLength = 0;
        this.clientCertificate = null;
        this.clientNonce = null;
        this.transport = transport;
        this.__hash = getNextChannelId();
        node_opcua_assert_1.assert(this.__hash > 0);
        this.channelId = null;
        this.revisedLifetime = 0;
        this.parent = options.parent;
        this.protocolVersion = 0;
        this.lastTokenId = 0;
        this.timeout = options.timeout || 30000; // connection timeout
        this.defaultSecureTokenLifetime = options.defaultSecureTokenLifetime || 600000;
        // uninitialized securityToken
        this.securityToken = new node_opcua_service_secure_channel_1.ChannelSecurityToken({
            channelId: this.__hash,
            revisedLifetime: 0,
            tokenId: 0
        });
        node_opcua_assert_1.assert(this.securityToken.channelId > 0);
        this.serverNonce = null; // will be created when needed
        this.messageBuilder = new message_builder_1.MessageBuilder({
            name: "server",
            objectFactory: options.objectFactory,
            privateKey: this.getPrivateKey()
        });
        this.messageBuilder.on("error", (err) => {
            // istanbul ignore next
            if (doDebug) {
                debugLog(chalk_1.default.red("xxxxx error "), err.message.yellow, err.stack);
                debugLog(chalk_1.default.red("xxxxx Server is now closing socket, without further notice"));
            }
            // close socket immediately
            this.close(undefined);
        });
        // at first use a anonymous connection
        this.securityHeader = new services_1.AsymmetricAlgorithmSecurityHeader({
            receiverCertificateThumbprint: null,
            securityPolicyUri: "http://opcfoundation.org/UA/SecurityPolicy#None",
            senderCertificate: null
        });
        this.messageChunker = new message_chunker_1.MessageChunker({
            securityHeader: this.securityHeader // for OPN
        });
        this._tick0 = 0;
        this._tick1 = 0;
        this._tick2 = 0;
        this._tick3 = 0;
        this._bytesRead_before = 0;
        this._bytesWritten_before = 0;
        this.securityMode = node_opcua_service_secure_channel_1.MessageSecurityMode.Invalid;
        this.timeoutId = null;
        this._securityTokenTimeout = null;
        this._transactionsCount = 0;
        this.sessionTokens = {};
        // xx #422 self.setMaxListeners(200); // increase the number of max listener
    }
    get securityTokenCount() {
        node_opcua_assert_1.assert(_.isNumber(this.lastTokenId));
        return this.lastTokenId;
    }
    get remoteAddress() {
        return this.transport.remoteAddress;
    }
    get remotePort() {
        return this.transport.remotePort;
    }
    /**
     *
     */
    get aborted() {
        return this._abort_has_been_called;
    }
    /**
     * the number of bytes read so far by this channel
     */
    get bytesRead() {
        return this.transport ? this.transport.bytesRead : 0;
    }
    /**
     * the number of bytes written so far by this channel
     */
    get bytesWritten() {
        return this.transport ? this.transport.bytesWritten : 0;
    }
    get transactionsCount() {
        return this._transactionsCount;
    }
    /**
     * true when the secure channel has been opened successfully
     *
     */
    get isOpened() {
        return !!this.clientCertificate;
    }
    /**
     * true when the secure channel is assigned to a active session
     */
    get hasSession() {
        return Object.keys(this.sessionTokens).length > 0;
    }
    get certificateManager() {
        return this.parent.certificateManager;
    }
    /**
     * The unique hash key to identify this secure channel
     * @property hashKey
     */
    get hashKey() {
        return this.__hash;
    }
    dispose() {
        debugLog("ServerSecureChannelLayer#dispose");
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
        node_opcua_assert_1.assert(!this.timeoutId, "timeout must have been cleared");
        node_opcua_assert_1.assert(!this._securityTokenTimeout, "_securityTokenTimeout must have been cleared");
        node_opcua_assert_1.assert(this.messageBuilder, "dispose already called ?");
        this.parent = null;
        this.serverNonce = null;
        this.objectFactory = undefined;
        if (this.messageBuilder) {
            this.messageBuilder.dispose();
            // xx this.messageBuilder = null;
        }
        this.securityHeader = null;
        if (this.messageChunker) {
            this.messageChunker.dispose();
            // xx this.messageChunker = null;
        }
        this.channelId = 0xdeadbeef;
        this.timeoutId = null;
        this.sessionTokens = null;
        this.removeAllListeners();
    }
    abruptlyInterrupt() {
        this.transport.dispose();
    }
    /**
     * the endpoint associated with this secure channel
     *
     */
    getEndpointDescription(securityMode, securityPolicy) {
        if (!this.parent) {
            return null; // throw new Error("getEndpointDescription - no parent");
        }
        return this.parent.getEndpointDescription(this.securityMode, securityPolicy);
    }
    setSecurity(securityMode, securityPolicy) {
        // TODO verify that the endpoint really supports this mode
        this.messageBuilder.setSecurity(securityMode, securityPolicy);
    }
    /**
     * @method getCertificateChain
     * @return the X509 DER form certificate
     */
    getCertificateChain() {
        if (!this.parent) {
            throw new Error("expecting a valid parent");
        }
        return this.parent.getCertificateChain();
    }
    /**
     * @method getCertificate
     * @return  the X509 DER form certificate
     */
    getCertificate() {
        if (!this.parent) {
            throw new Error("expecting a valid parent");
        }
        return this.parent.getCertificate();
    }
    getSignatureLength() {
        const chain = this.getCertificateChain();
        const firstCertificateInChain = node_opcua_crypto_1.split_der(chain)[0];
        const cert = node_opcua_crypto_1.exploreCertificateInfo(firstCertificateInChain);
        return cert.publicKeyLength; // 1024 bits = 128Bytes or 2048=256Bytes
    }
    /**
     * @method getPrivateKey
     * @return the privateKey
     */
    getPrivateKey() {
        if (!this.parent) {
            return "<invalid>";
            // throw new Error("getPrivateKey : cannot get PrivateKey");
        }
        return this.parent.getPrivateKey();
    }
    /**
     * @method init
     * @async
     * @param socket
     * @param callback
     */
    init(socket, callback) {
        this.transport.timeout = this.timeout;
        this.transport.init(socket, (err) => {
            if (err) {
                callback(err);
            }
            else {
                // bind low level TCP transport to messageBuilder
                this.transport.on("message", (messageChunk) => {
                    node_opcua_assert_1.assert(this.messageBuilder);
                    this.messageBuilder.feed(messageChunk);
                });
                debugLog("ServerSecureChannelLayer : Transport layer has been initialized");
                debugLog("... now waiting for OpenSecureChannelRequest...");
                ServerSecureChannelLayer.registry.register(this);
                this._wait_for_open_secure_channel_request(callback, this.timeout);
            }
        });
        // detect transport closure
        this._transport_socket_close_listener = ( /* err?: Error*/) => {
            this._abort();
        };
        this.transport.on("socket_closed", this._transport_socket_close_listener);
    }
    /**
     * @method send_response
     * @async
     * @param msgType
     * @param response
     * @param message
     * @param callback
     */
    send_response(msgType, response, message, callback) {
        const request = message.request;
        const requestId = message.requestId;
        if (this.aborted) {
            debugLog("channel has been terminated , cannot send responses");
            return callback && callback(new Error("Aborted"));
        }
        // istanbul ignore next
        if (doDebug) {
            node_opcua_assert_1.assert(response.schema);
            node_opcua_assert_1.assert(request.schema);
            node_opcua_assert_1.assert(requestId > 0);
            // verify that response for a given requestId is only sent once.
            if (!this.__verifId) {
                this.__verifId = {};
            }
            node_opcua_assert_1.assert(!this.__verifId[requestId], " response for requestId has already been sent !! - Internal Error");
            this.__verifId[requestId] = requestId;
        }
        if (doPerfMonitoring) {
            // record tick : send response received.
            this._tick2 = node_opcua_utils_1.get_clock_tick();
        }
        node_opcua_assert_1.assert(this.securityToken);
        let options = {
            channelId: this.securityToken.channelId,
            chunkSize: this.transport.receiveBufferSize,
            requestId,
            tokenId: this.securityToken.tokenId
        };
        const securityOptions = msgType === "OPN" ? this._get_security_options_for_OPN() : this._get_security_options_for_MSG();
        options = _.extend(options, securityOptions);
        response.responseHeader.requestHandle = request.requestHeader.requestHandle;
        /* istanbul ignore next */
        if (0 && doDebug) {
            console.log(" options ", options);
            node_opcua_packet_analyzer_1.analyze_object_binary_encoding(response);
        }
        /* istanbul ignore next */
        if (doTraceMessages) {
            console.log(chalk_1.default.cyan.bold("xxxx   >>>> ---------------------------------------- "), chalk_1.default.green.bold(response.schema.name), requestId);
            console.log(response.toString());
            console.log(chalk_1.default.cyan.bold("xxxx   >>>> ----------------------------------------|\n"));
        }
        if (this._on_response) {
            this._on_response(msgType, response, message);
        }
        this._transactionsCount += 1;
        this.messageChunker.chunkSecureMessage(msgType, options, response, (messageChunk) => {
            return this._send_chunk(callback, messageChunk);
        });
    }
    /**
     *
     * send a ServiceFault response
     * @method send_error_and_abort
     * @async
     * @param statusCode  {StatusCode} the status code
     * @param description {String}
     * @param message     {String}
     * @param callback
     */
    send_error_and_abort(statusCode, description, message, callback) {
        node_opcua_assert_1.assert(message.request.schema);
        node_opcua_assert_1.assert(message.requestId > 0);
        node_opcua_assert_1.assert(_.isFunction(callback));
        const response = new services_1.ServiceFault({
            responseHeader: { serviceResult: statusCode }
        });
        response.responseHeader.stringTable = [description];
        this.send_response("MSG", response, message, () => {
            this.close(callback);
        });
    }
    /**
     * Abruptly close a Server SecureChannel ,by terminating the underlying transport.
     *
     *
     * @method close
     * @async
     * @param callback
     */
    close(callback) {
        debugLog("ServerSecureChannelLayer#close");
        // close socket
        this.transport.disconnect(() => {
            this._abort();
            if (_.isFunction(callback)) {
                callback();
            }
        });
    }
    has_endpoint_for_security_mode_and_policy(securityMode, securityPolicy) {
        if (!this.parent) {
            return true;
        }
        const endpoint_desc = this.getEndpointDescription(securityMode, securityPolicy);
        return endpoint_desc !== null;
    }
    _stop_security_token_watch_dog() {
        if (this._securityTokenTimeout) {
            clearTimeout(this._securityTokenTimeout);
            this._securityTokenTimeout = null;
        }
    }
    _start_security_token_watch_dog() {
        // install securityToken timeout watchdog
        this._securityTokenTimeout = setTimeout(() => {
            console.log(" Security token has really expired and shall be discarded !!!! (lifetime is = ", this.securityToken.revisedLifetime, ")");
            console.log(" Server will now refuse message with token ", this.securityToken.tokenId);
            this._securityTokenTimeout = null;
        }, this.securityToken.revisedLifetime * 120 / 100);
    }
    _add_new_security_token() {
        this._stop_security_token_watch_dog();
        this.lastTokenId += 1;
        this.channelId = this.__hash;
        node_opcua_assert_1.assert(this.channelId > 0);
        const securityToken = new node_opcua_service_secure_channel_1.ChannelSecurityToken({
            channelId: this.channelId,
            createdAt: new Date(),
            revisedLifetime: this.revisedLifetime,
            tokenId: this.lastTokenId // todo ?
        });
        node_opcua_assert_1.assert(!node_opcua_service_secure_channel_1.hasTokenExpired(securityToken));
        node_opcua_assert_1.assert(_.isFinite(securityToken.revisedLifetime));
        this.securityToken = securityToken;
        debugLog("SecurityToken", securityToken.tokenId);
        this._start_security_token_watch_dog();
    }
    _prepare_security_token(openSecureChannelRequest) {
        delete this.securityToken;
        if (openSecureChannelRequest.requestType === services_1.SecurityTokenRequestType.Renew) {
            this._stop_security_token_watch_dog();
        }
        else if (openSecureChannelRequest.requestType === services_1.SecurityTokenRequestType.Issue) {
            // TODO
        }
        else {
            // Invalid requestType
        }
        this._add_new_security_token();
    }
    _set_lifetime(requestedLifetime) {
        node_opcua_assert_1.assert(_.isFinite(requestedLifetime));
        // revised lifetime
        this.revisedLifetime = requestedLifetime;
        if (this.revisedLifetime === 0) {
            this.revisedLifetime = this.defaultSecureTokenLifetime;
        }
        else {
            this.revisedLifetime = Math.min(this.defaultSecureTokenLifetime, this.revisedLifetime);
        }
        // xx console.log('requestedLifetime,self.defaultSecureTokenLifetime, self.revisedLifetime',requestedLifetime,self.defaultSecureTokenLifetime, self.revisedLifetime);
    }
    _stop_open_channel_watch_dog() {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId);
            this.timeoutId = null;
        }
    }
    _cleanup_pending_timers() {
        // there is no need for the security token expiration event to trigger anymore
        this._stop_security_token_watch_dog();
        this._stop_open_channel_watch_dog();
    }
    _cancel_wait_for_open_secure_channel_request_timeout() {
        this._stop_open_channel_watch_dog();
    }
    _install_wait_for_open_secure_channel_request_timeout(callback, timeout) {
        node_opcua_assert_1.assert(_.isFinite(timeout));
        node_opcua_assert_1.assert(_.isFunction(callback));
        this.timeoutId = setTimeout(() => {
            this.timeoutId = null;
            const err = new Error("Timeout waiting for OpenChannelRequest (timeout was " + timeout + " ms)");
            debugLog(err.message);
            this.close(() => {
                callback(err);
            });
        }, timeout);
    }
    _on_initial_open_secure_channel_request(callback, request, msgType, requestId, channelId) {
        /* istanbul ignore next */
        if (doTraceMessages) {
            dump_request(request, requestId, channelId);
        }
        node_opcua_assert_1.assert(_.isFunction(callback));
        if (!(this.messageBuilder && this.messageBuilder.sequenceHeader && this.messageBuilder.securityHeader)) {
            throw new Error("internal Error");
        }
        // check that the request is a OpenSecureChannelRequest
        /* istanbul ignore next */
        if (doDebug) {
            debugLog(this.messageBuilder.sequenceHeader.toString());
            debugLog(this.messageBuilder.securityHeader.toString());
        }
        this._cancel_wait_for_open_secure_channel_request_timeout();
        requestId = this.messageBuilder.sequenceHeader.requestId;
        node_opcua_assert_1.assert(requestId > 0);
        const message = {
            request,
            requestId,
            securityHeader: this.messageBuilder.securityHeader
        };
        this.clientSecurityHeader = message.securityHeader;
        this._on_initial_OpenSecureChannelRequest(message, callback);
    }
    _wait_for_open_secure_channel_request(callback, timeout) {
        this._install_wait_for_open_secure_channel_request_timeout(callback, timeout);
        this.messageBuilder.once("message", (request, msgType, requestId, channelId) => {
            this._on_initial_open_secure_channel_request(callback, request, msgType, requestId, channelId);
        });
    }
    _send_chunk(callback, messageChunk) {
        if (messageChunk) {
            this.transport.write(messageChunk);
        }
        else {
            if (doPerfMonitoring) {
                // record tick 3 : transaction completed.
                this._tick3 = node_opcua_utils_1.get_clock_tick();
            }
            if (callback) {
                setImmediate(callback);
            }
            if (doPerfMonitoring) {
                this._record_transaction_statistics();
                /* istanbul ignore next */
                if (doDebug) {
                    // dump some statistics about transaction ( time and sizes )
                    _dump_transaction_statistics(this.last_transaction_stats);
                }
            }
            this.emit("transaction_done");
        }
    }
    _get_security_options_for_OPN() {
        // install sign & sign-encrypt behavior
        if (this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.Sign || this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.SignAndEncrypt) {
            const cryptoFactory = this.messageBuilder.cryptoFactory;
            if (!cryptoFactory) {
                throw new Error("Internal Error");
            }
            node_opcua_assert_1.assert(cryptoFactory, "ServerSecureChannelLayer must have a crypto strategy");
            node_opcua_assert_1.assert(this.receiverPublicKeyLength >= 0);
            const receiverPublicKey = this.receiverPublicKey;
            if (!receiverPublicKey) {
                throw new Error("Invalid receiverPublicKey");
            }
            const options = {
                cipherBlockSize: this.receiverPublicKeyLength,
                plainBlockSize: this.receiverPublicKeyLength - cryptoFactory.blockPaddingSize,
                signatureLength: this.getSignatureLength(),
                encryptBufferFunc: (chunk) => {
                    return cryptoFactory.asymmetricEncrypt(chunk, receiverPublicKey);
                },
                signBufferFunc: (chunk) => {
                    const signed = cryptoFactory.asymmetricSign(chunk, this.getPrivateKey());
                    node_opcua_assert_1.assert(signed.length === options.signatureLength);
                    return signed;
                }
            };
            return options; // partial
        }
        return null;
    }
    _get_security_options_for_MSG() {
        if (this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
            return null;
        }
        const cryptoFactory = this.messageBuilder.cryptoFactory;
        /* istanbul ignore next */
        if (!cryptoFactory || !this.derivedKeys) {
            return null;
        }
        node_opcua_assert_1.assert(cryptoFactory, "ServerSecureChannelLayer must have a crypto strategy");
        node_opcua_assert_1.assert(this.derivedKeys.derivedServerKeys);
        const derivedServerKeys = this.derivedKeys.derivedServerKeys;
        if (!derivedServerKeys) {
            return null;
        }
        return security_policy_1.getOptionsForSymmetricSignAndEncrypt(this.securityMode, derivedServerKeys);
    }
    /**
     * _process_certificates extracts client public keys from client certificate
     *  and store them in self.receiverPublicKey and self.receiverCertificate
     *  it also caches self.receiverPublicKeyLength.
     *
     *  so they can be used by security channel.
     *
     * @method _process_certificates
     * @param message the message coming from the client
     * @param callback
     * @private
     * @async
     */
    _process_certificates(message, callback) {
        const asymmSecurityHeader = message.securityHeader;
        // verify certificate
        const certificate = asymmSecurityHeader ? asymmSecurityHeader.senderCertificate : null;
        this.checkCertificateCallback(certificate, (err, statusCode) => {
            if (err) {
                return callback(err);
            }
            node_opcua_assert_1.assert(statusCode, "expecting status code");
            if (statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                return callback(null, statusCode);
            }
            this.receiverPublicKey = null;
            this.receiverPublicKeyLength = 0;
            this.receiverCertificate = asymmSecurityHeader ? asymmSecurityHeader.senderCertificate : null;
            // get the clientCertificate for convenience
            this.clientCertificate = this.receiverCertificate;
            // ignore receiverCertificate that have a zero length
            /* istanbul ignore next */
            if (this.receiverCertificate && this.receiverCertificate.length === 0) {
                this.receiverCertificate = null;
            }
            if (this.receiverCertificate) {
                // extract public key
                node_opcua_crypto_1.extractPublicKeyFromCertificate(this.receiverCertificate, (err, key) => {
                    if (!err) {
                        if (key) {
                            this.receiverPublicKey = key;
                            this.receiverPublicKeyLength = node_opcua_crypto_1.rsa_length(key);
                        }
                        callback(null, node_opcua_status_code_1.StatusCodes.Good);
                    }
                    else {
                        callback(err);
                    }
                });
            }
            else {
                this.receiverPublicKey = null;
                callback(null, node_opcua_status_code_1.StatusCodes.Good);
            }
        });
    }
    /**
     * @method _prepare_security_header
     * @param request
     * @param message
     * @return {AsymmetricAlgorithmSecurityHeader}
     * @private
     */
    _prepare_security_header(request, message) {
        let securityHeader = null;
        // senderCertificate:
        //    The X509v3 certificate assigned to the sending application instance.
        //    This is a DER encoded blob.
        //    This indicates what private key was used to sign the MessageChunk.
        //    This field shall be null if the message is not signed.
        // receiverCertificateThumbprint:
        //    The thumbprint of the X509v3 certificate assigned to the receiving application
        //    The thumbprint is the SHA1 digest of the DER encoded form of the certificate.
        //    This indicates what public key was used to encrypt the MessageChunk
        //   This field shall be null if the message is not encrypted.
        switch (request.securityMode) {
            case node_opcua_service_secure_channel_1.MessageSecurityMode.None:
                securityHeader = new services_1.AsymmetricAlgorithmSecurityHeader({
                    receiverCertificateThumbprint: null,
                    securityPolicyUri: "http://opcfoundation.org/UA/SecurityPolicy#None",
                    senderCertificate: null // message not signed
                });
                break;
            case node_opcua_service_secure_channel_1.MessageSecurityMode.Sign:
            case node_opcua_service_secure_channel_1.MessageSecurityMode.SignAndEncrypt:
            default: {
                // get the thumbprint of the client certificate
                const thumbprint = this.receiverCertificate
                    ? node_opcua_crypto_1.makeSHA1Thumbprint(this.receiverCertificate)
                    : null;
                if (!this.clientSecurityHeader) {
                    throw new Error("Internal");
                }
                const asymmClientSecurityHeader = this.clientSecurityHeader;
                securityHeader = new services_1.AsymmetricAlgorithmSecurityHeader({
                    receiverCertificateThumbprint: thumbprint,
                    securityPolicyUri: asymmClientSecurityHeader.securityPolicyUri,
                    senderCertificate: this.getCertificateChain() // certificate of the private key used to sign the message
                });
            }
        }
        return securityHeader;
    }
    checkCertificateCallback(certificate, callback) {
    }
    checkCertificate(certificate) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!certificate) {
                return node_opcua_status_code_1.StatusCodes.Good;
            }
            if (!this.certificateManager) {
                return node_opcua_certificate_manager_1.checkCertificateValidity(certificate);
            }
            return yield this.certificateManager.checkCertificate(certificate);
        });
    }
    _handle_OpenSecureChannelRequest(message, callback) {
        const request = message.request;
        const requestId = message.requestId;
        node_opcua_assert_1.assert(request.schema.name === "OpenSecureChannelRequest");
        node_opcua_assert_1.assert(requestId !== 0 && requestId > 0);
        this.clientNonce = request.clientNonce;
        this._set_lifetime(request.requestedLifetime);
        this._prepare_security_token(request);
        let serviceResult = node_opcua_status_code_1.StatusCodes.Good;
        const cryptoFactory = this.messageBuilder.cryptoFactory;
        if (cryptoFactory) {
            // serverNonce: A random number that shall not be used in any other request. A new
            //    serverNonce shall be generated for each time a SecureChannel is renewed.
            //    This parameter shall have a length equal to key size used for the symmetric
            //    encryption algorithm that is identified by the securityPolicyUri.
            this.serverNonce = crypto.randomBytes(cryptoFactory.symmetricKeyLength);
            if (this.clientNonce.length !== this.serverNonce.length) {
                console.log(chalk_1.default.red("warning client Nonce length doesn't match server nonce length"), this.clientNonce.length, " !== ", this.serverNonce.length);
                // what can we do
                // - just ignore it ?
                // - or adapt serverNonce length to clientNonce Length ?
                // xx self.serverNonce = crypto.randomBytes(self.clientNonce.length);
                // - or adapt clientNonce length to serverNonce Length ?
                // xx self.clientNonce = self.clientNonce.slice(0,self.serverNonce.length);
                //
                // - or abort connection ? << LET BE SAFE AND CHOOSE THIS ONE !
                serviceResult = node_opcua_status_code_1.StatusCodes.BadSecurityModeRejected; // ToDo check code
            }
            // expose derivedKey to use for symmetric sign&encrypt
            // to help us decrypting and verifying messages received from client
            this.derivedKeys = security_policy_1.computeDerivedKeys(cryptoFactory, this.serverNonce, this.clientNonce);
        }
        const derivedClientKeys = this.derivedKeys ? this.derivedKeys.derivedClientKeys : null;
        this.messageBuilder.pushNewToken(this.securityToken, derivedClientKeys);
        // let prepare self.securityHeader;
        this.securityHeader = this._prepare_security_header(request, message);
        // xx const asymmHeader = this.securityHeader as AsymmetricAlgorithmSecurityHeader;
        node_opcua_assert_1.assert(this.securityHeader);
        const derivedServerKeys = this.derivedKeys ? this.derivedKeys.derivedServerKeys : undefined;
        this.messageChunker.update({
            // for OPN
            securityHeader: this.securityHeader,
            // derived keys for symmetric encryption of standard MSG
            // to sign and encrypt MSG sent to client
            derivedKeys: derivedServerKeys
        });
        const response = new services_1.OpenSecureChannelResponse({
            responseHeader: { serviceResult },
            securityToken: this.securityToken,
            serverNonce: this.serverNonce || undefined,
            serverProtocolVersion: this.protocolVersion
        });
        let description;
        // If the SecurityMode is not None then the Server shall verify that a SenderCertificate and a
        // ReceiverCertificateThumbprint were specified in the SecurityHeader.
        if (this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
            if (!this.clientSecurityHeader) {
                throw new Error("Internal Error");
            }
            if (!this._check_receiverCertificateThumbprint(this.clientSecurityHeader)) {
                description =
                    "Server#OpenSecureChannelRequest : Invalid receiver certificate thumbprint : the thumbprint doesn't match server certificate !";
                console.log(chalk_1.default.cyan(description));
                response.responseHeader.serviceResult = node_opcua_status_code_1.StatusCodes.BadCertificateInvalid;
            }
        }
        this.send_response("OPN", response, message, ( /*err*/) => {
            const responseHeader = response.responseHeader;
            if (responseHeader.serviceResult !== node_opcua_status_code_1.StatusCodes.Good) {
                console.log("OpenSecureChannelRequest Closing communication ", responseHeader.serviceResult.toString());
                this.close();
            }
            callback();
        });
    }
    _abort() {
        debugLog("ServerSecureChannelLayer#_abort");
        if (this._abort_has_been_called) {
            debugLog("Warning => ServerSecureChannelLayer#_abort has already been called");
            return;
        }
        ServerSecureChannelLayer.registry.unregister(this);
        this._abort_has_been_called = true;
        this._cleanup_pending_timers();
        /**
         * notify the observers that the SecureChannel has aborted.
         * the reason could be :
         *   - a CloseSecureChannelRequest has been received.
         *   - a invalid message has been received
         * the event is sent after the underlying transport layer has been closed.
         *
         * @event abort
         */
        this.emit("abort");
        debugLog("ServerSecureChannelLayer emitted abort event");
    }
    _record_transaction_statistics() {
        this._bytesRead_before = this._bytesRead_before || 0;
        this._bytesWritten_before = this._bytesWritten_before || 0;
        this.last_transaction_stats = {
            bytesRead: this.bytesRead - this._bytesRead_before,
            bytesWritten: this.bytesWritten - this._bytesWritten_before,
            lap_reception: this._tick1 - this._tick0,
            lap_processing: this._tick2 - this._tick1,
            lap_emission: this._tick3 - this._tick2
        };
        // final operation in statistics
        this._bytesRead_before = this.bytesRead;
        this._bytesWritten_before = this.bytesWritten;
    }
    _on_common_message(request, msgType, requestId, channelId) {
        /* istanbul ignore next */
        if (doTraceMessages) {
            dump_request(request, requestId, channelId);
        }
        if (this.messageBuilder.sequenceHeader === null) {
            throw new Error("Internal Error");
        }
        requestId = this.messageBuilder.sequenceHeader.requestId;
        const message = {
            channel: this,
            request,
            requestId
        };
        if (msgType === "CLO" && request.schema.name === "CloseSecureChannelRequest") {
            this.close();
        }
        else if (msgType === "OPN" && request.schema.name === "OpenSecureChannelRequest") {
            // intercept client request to renew security Token
            this._handle_OpenSecureChannelRequest(message, ( /* err?: Error*/) => {
            });
        }
        else {
            if (request.schema.name === "CloseSecureChannelRequest") {
                console.log("WARNING : RECEIVED a CloseSecureChannelRequest with MSGTYPE=" + msgType);
                this.close();
            }
            else {
                if (doPerfMonitoring) {
                    // record tick 1 : after message has been received, before message processing
                    this._tick1 = node_opcua_utils_1.get_clock_tick();
                }
                if (this.securityToken && channelId !== this.securityToken.channelId) {
                    // response = new ServiceFault({responseHeader: {serviceResult: certificate_status}});
                    debugLog("Invalid channelId detected =", channelId, " <> ", this.securityToken.channelId);
                    return this.send_error_and_abort(node_opcua_status_code_1.StatusCodes.BadCommunicationError, "Invalid Channel Id specified " + this.securityToken.channelId, message, () => {
                    });
                }
                /**
                 * notify the observer that a OPCUA message has been received.
                 * It is up to one observer to call send_response or send_error_and_abort to complete
                 * the transaction.
                 *
                 * @event message
                 * @param message
                 */
                this.emit("message", message);
            }
        }
    }
    /**
     * @method _check_receiverCertificateThumbprint
     * verify that the receiverCertificateThumbprint send by the client
     * matching the CertificateThumbPrint of the server
     * @param clientSecurityHeader
     * @return true if the receiver certificate thumbprint matches the server certificate
     * @private
     */
    _check_receiverCertificateThumbprint(clientSecurityHeader) {
        if (clientSecurityHeader instanceof node_opcua_service_secure_channel_1.SymmetricAlgorithmSecurityHeader) {
            return false;
        }
        if (clientSecurityHeader.receiverCertificateThumbprint) {
            // check if the receiverCertificateThumbprint is my certificate thumbprint
            const serverCertificateChain = this.getCertificateChain();
            const myCertificateThumbPrint = node_opcua_crypto_1.makeSHA1Thumbprint(serverCertificateChain);
            const thisIsMyCertificate = myCertificateThumbPrint.toString("hex") ===
                clientSecurityHeader.receiverCertificateThumbprint.toString("hex");
            if (doDebug && !thisIsMyCertificate) {
                debugLog("receiverCertificateThumbprint do not match server certificate", myCertificateThumbPrint.toString("hex") + " <> "
                    + clientSecurityHeader.receiverCertificateThumbprint.toString("hex"));
            }
            return thisIsMyCertificate;
        }
        return true;
    }
    // Bad_CertificateHostNameInvalid            The HostName used to connect to a Server does not match a HostName in the
    //                                           Certificate.
    // Bad_CertificateIssuerRevocationUnknown    It was not possible to determine if the Issuer Certificate has been revoked.
    // Bad_CertificateIssuerUseNotAllowed        The Issuer Certificate may not be used for the requested operation.
    // Bad_CertificateIssuerTimeInvalid          An Issuer Certificate has expired or is not yet valid.
    // Bad_CertificateIssuerRevoked              The Issuer Certificate has been revoked.
    // Bad_CertificateInvalid                    The certificate provided as a parameter is not valid.
    // Bad_CertificateRevocationUnknown          It was not possible to determine if the Certificate has been revoked.
    // Bad_CertificateRevoked                    The Certificate has been revoked.
    // Bad_CertificateTimeInvalid                The Certificate has expired or is not yet valid.
    // Bad_CertificateUriInvalid                 The URI specified in the ApplicationDescription does not match the URI in the Certificate.
    // Bad_CertificateUntrusted                  The Certificate is not trusted.
    // Bad_CertificateUseNotAllowed              The Certificate may not be used for the requested operation.
    // Bad_RequestTypeInvalid     The security token request type is not valid.
    // Bad_SecurityModeRejected   The security mode does not meet the requirements set by the Server.
    // Bad_SecurityPolicyRejected The security policy does not meet the requirements set by the Server.
    // Bad_SecureChannelIdInvalid
    // Bad_NonceInvalid
    _send_error(statusCode, description, message, callback) {
        // turn of security mode as we haven't manage to set it to
        this.securityMode = node_opcua_service_secure_channel_1.MessageSecurityMode.None;
        // unexpected message type ! let close the channel
        const err = new Error(description);
        this.send_error_and_abort(statusCode, description, message, () => {
            callback(err); // OK
        });
    }
    _on_initial_OpenSecureChannelRequest(message, callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        const request = message.request;
        const requestId = message.requestId;
        node_opcua_assert_1.assert(requestId > 0);
        node_opcua_assert_1.assert(_.isFinite(request.requestHeader.requestHandle));
        let description;
        // expecting a OpenChannelRequest as first communication message
        if (!(request instanceof services_1.OpenSecureChannelRequest)) {
            description = "Expecting OpenSecureChannelRequest";
            console.log(chalk_1.default.red("ERROR"), "BadCommunicationError: expecting a OpenChannelRequest as first communication message");
            return this._send_error(node_opcua_status_code_1.StatusCodes.BadCommunicationError, description, message, callback);
        }
        const asymmetricSecurityHeader = this.messageBuilder.securityHeader;
        const securityPolicy = message.securityHeader ? security_policy_1.fromURI(asymmetricSecurityHeader.securityPolicyUri) : security_policy_1.SecurityPolicy.Invalid;
        // check security header
        const securityPolicyStatus = isValidSecurityPolicy(securityPolicy);
        if (securityPolicyStatus !== node_opcua_status_code_1.StatusCodes.Good) {
            description = " Unsupported securityPolicyUri " + asymmetricSecurityHeader.securityPolicyUri;
            return this._send_error(securityPolicyStatus, description, message, callback);
        }
        // check certificate
        this.securityMode = request.securityMode;
        this.securityPolicy = securityPolicy;
        this.messageBuilder.securityMode = this.securityMode;
        const hasEndpoint = this.has_endpoint_for_security_mode_and_policy(this.securityMode, securityPolicy);
        if (!hasEndpoint) {
            // there is no
            description =
                " This server doesn't not support  " + securityPolicy.toString() + " " + this.securityMode.toString();
            return this._send_error(node_opcua_status_code_1.StatusCodes.BadSecurityPolicyRejected, description, message, callback);
        }
        this.endpoint = this.getEndpointDescription(this.securityMode, securityPolicy);
        this.messageBuilder
            .on("message", (request, msgType, requestId, channelId) => {
            this._on_common_message(request, msgType, requestId, channelId);
        })
            .on("start_chunk", () => {
            if (doPerfMonitoring) {
                // record tick 0: when the first chunk is received
                this._tick0 = node_opcua_utils_1.get_clock_tick();
            }
        });
        // handle initial OpenSecureChannelRequest
        this._process_certificates(message, (err, statusCode) => {
            if (err) {
                description = "Internal Error " + err.message;
                return this._send_error(node_opcua_status_code_1.StatusCodes.BadInternalError, description, message, callback);
            }
            if (!statusCode) {
                node_opcua_assert_1.assert(false);
            }
            if (statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                const description = "Sender Certificate Error";
                console.log(chalk_1.default.cyan(description), chalk_1.default.bgRed.yellow(statusCode.toString()));
                // OPCUA specification v1.02 part 6 page 42 $6.7.4
                // If an error occurs after the  Server  has verified  Message  security  it  shall  return a  ServiceFault  instead
                // of a OpenSecureChannel  response. The  ServiceFault  Message  is described in  Part  4,   7.28.
                return this._send_error(statusCode, "", message, callback);
            }
            this._handle_OpenSecureChannelRequest(message, callback);
        });
    }
}
exports.ServerSecureChannelLayer = ServerSecureChannelLayer;
const node_opcua_object_registry_1 = require("node-opcua-object-registry");
ServerSecureChannelLayer.registry = new node_opcua_object_registry_1.ObjectRegistry({});
ServerSecureChannelLayer.prototype.checkCertificateCallback =
    util_1.callbackify(ServerSecureChannelLayer.prototype.checkCertificate);
//# sourceMappingURL=server_secure_channel_layer.js.map