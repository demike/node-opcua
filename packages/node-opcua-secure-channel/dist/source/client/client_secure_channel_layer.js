"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-secure-channel
 */
// tslint:disable:variable-name
// tslint:disable:object-literal-shorthand
// tslint:disable:no-console
// tslint:disable:no-var-requires
// tslint:disable:max-line-length
const chalk_1 = require("chalk");
const crypto_1 = require("crypto");
const events_1 = require("events");
const _ = require("underscore");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_binary_stream_1 = require("node-opcua-binary-stream");
const node_opcua_utils_1 = require("node-opcua-utils");
const node_opcua_chunkmanager_1 = require("node-opcua-chunkmanager");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_transport_1 = require("node-opcua-transport");
const message_builder_1 = require("../message_builder");
const message_chunker_1 = require("../message_chunker");
const message_header_to_string_1 = require("../message_header_to_string");
const security_policy_1 = require("../security_policy");
const services_1 = require("../services");
// import * as backoff from "backoff";
const backoff = require("backoff");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const checkChunks = false;
const doTraceMessage = process.env.DEBUG && (process.env.DEBUG.indexOf("TRACE")) >= 0;
const doTraceStatistics = process.env.DEBUG && (process.env.DEBUG.indexOf("STATS")) >= 0;
const doPerfMonitoring = false;
const minTransactionTimeout = 30 * 1000; // 30 sec
const defaultTransactionTimeout = 60 * 1000; // 1 minute
function process_request_callback(requestData, err, response) {
    node_opcua_assert_1.assert(_.isFunction(requestData.callback));
    if (!response && !err && requestData.msgType !== "CLO") {
        // this case happens when CLO is called and when some pending transactions
        // remains in the queue...
        err = new Error(" Connection has been closed by client , but this transaction cannot be honored");
    }
    if (response && response instanceof services_1.ServiceFault) {
        response.responseHeader.stringTable = response.responseHeader.stringTable || [];
        response.responseHeader.stringTable = [response.responseHeader.stringTable.join("\n")];
        err = new Error(" ServiceFault returned by server " + response.toString() + " request = " + requestData.request.toString());
        err.response = response;
        response = undefined;
    }
    const theCallbackFunction = requestData.callback;
    if (!theCallbackFunction) {
        throw new Error("Internal error");
    }
    node_opcua_assert_1.assert((requestData.msgType === "CLO") || ((err && !response) || (!err && response)));
    // let set callback to undefined to prevent callback to be called again
    requestData.callback = undefined;
    theCallbackFunction(err, (!err && response !== null) ? response : undefined);
}
function _dump_transaction_statistics(stats) {
    function w(str) {
        return ("                  " + str).substr(-12);
    }
    console.log(chalk_1.default.green.bold("--------------------------------------------------------------------->> Stats"));
    console.log("   request                   : ", chalk_1.default.yellow(stats.request.schema.name.toString()), " / ", chalk_1.default.yellow(stats.response.schema.name.toString()), " - ", stats.response.responseHeader.serviceResult.toString());
    console.log("   Bytes Read                : ", w(stats.bytesRead), " bytes");
    console.log("   Bytes Written             : ", w(stats.bytesWritten), " bytes");
    console.log("   transaction duration      : ", w(stats.lap_transaction.toFixed(3)), " milliseconds");
    console.log("   time to send request      : ", w((stats.lap_sending_request).toFixed(3)), " milliseconds");
    console.log("   time waiting for response : ", w((stats.lap_waiting_response).toFixed(3)), " milliseconds");
    console.log("   time to receive response  : ", w((stats.lap_receiving_response).toFixed(3)), " milliseconds");
    console.log("   time processing response  : ", w((stats.lap_processing_response).toFixed(3)), " milliseconds");
    console.log(chalk_1.default.green.bold("---------------------------------------------------------------------<< Stats"));
}
function coerceConnectionStrategy(options) {
    options = options || {};
    const maxRetry = (options.maxRetry === undefined) ? 10 : options.maxRetry;
    const initialDelay = options.initialDelay || 10;
    const maxDelay = options.maxDelay || 10000;
    const randomisationFactor = (options.randomisationFactor === undefined) ? 0 : options.randomisationFactor;
    return {
        initialDelay, maxDelay, maxRetry, randomisationFactor
    };
}
exports.coerceConnectionStrategy = coerceConnectionStrategy;
/**
 * a ClientSecureChannelLayer represents the client side of the OPCUA secure channel.
 */
class ClientSecureChannelLayer extends events_1.EventEmitter {
    constructor(options) {
        super();
        this.securityHeader = null;
        this.receiverCertificate = null;
        this.securityToken = null;
        this.serverNonce = null;
        this.derivedKeys = null;
        this.receiverPublicKey = null;
        this.endpointUrl = "";
        if (global.hasResourceLeakDetector && !global.ResourceLeakDetectorStarted) {
            throw new Error("ClientSecureChannelLayer not in ResourceLeakDetectorStarted");
        }
        node_opcua_assert_1.assert(this instanceof ClientSecureChannelLayer);
        this._isOpened = false;
        this._transport = null;
        this._lastRequestId = 0;
        this.parent = options.parent;
        this.clientNonce = null; // will be created when needed
        this.protocolVersion = 0;
        this.messageChunker = new message_chunker_1.MessageChunker({
            derivedKeys: null
        });
        this.defaultSecureTokenLifetime = options.defaultSecureTokenLifetime || 30000;
        this.tokenRenewalInterval = options.tokenRenewalInterval || 0;
        this.securityMode = node_opcua_service_secure_channel_1.coerceMessageSecurityMode(options.securityMode);
        this.securityPolicy = security_policy_1.coerceSecurityPolicy(options.securityPolicy);
        this.serverCertificate = options.serverCertificate ? options.serverCertificate : null;
        if (this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
            node_opcua_assert_1.assert(this.serverCertificate instanceof Buffer, "Expecting a valid certificate when security mode is not None");
            node_opcua_assert_1.assert(this.securityPolicy !== security_policy_1.SecurityPolicy.None, "Security Policy None is not a valid choice");
        }
        this.messageBuilder = new message_builder_1.MessageBuilder({
            name: "client",
            privateKey: this.getPrivateKey() || undefined,
            securityMode: this.securityMode
        });
        this._requests = {};
        this.messageBuilder
            .on("message", (response, msgType, requestId) => this._on_message_received(response, msgType, requestId))
            .on("start_chunk", () => {
            // record tick2: when the first response chunk is received
            // request_data._tick2 = get_clock_tick();
        })
            .on("error", (err, requestId) => {
            //
            debugLog("request id = ", requestId, err);
            let requestData = this._requests[requestId];
            if (doDebug) {
                debugLog(" message was ");
                debugLog(requestData);
            }
            if (!requestData) {
                requestData = this._requests[requestId + 1];
                debugLog(" message was 2:", requestData ? requestData.request.toString() : "<null>");
            }
            // xx console.log(request_data.request.toString());
        });
        this.__in_normal_close_operation = false;
        this._timedout_request_count = 0;
        this._securityTokenTimeoutId = null;
        this.transportTimeout = options.transportTimeout || ClientSecureChannelLayer.defaultTransportTimeout;
        this.channelId = 0;
        this.connectionStrategy = coerceConnectionStrategy(options.connectionStrategy);
    }
    /**
     * true if the secure channel is trying to establish the connection with the server. In this case, the client
     * may be in the middle of the b ackoff connection process.
     *
     */
    get isConnecting() {
        return (!!this.__call);
    }
    get bytesRead() {
        return this._transport ? this._transport.bytesRead : 0;
    }
    get bytesWritten() {
        return this._transport ? this._transport.bytesWritten : 0;
    }
    get transactionsPerformed() {
        return this._lastRequestId;
    }
    get timedOutRequestCount() {
        return this._timedout_request_count;
    }
    getPrivateKey() {
        return this.parent ? this.parent.getPrivateKey() : null;
    }
    getCertificateChain() {
        return this.parent ? this.parent.getCertificateChain() : null;
    }
    isTransactionInProgress() {
        return Object.keys(this._requests).length > 0;
    }
    /**
     * establish a secure channel with the provided server end point.
     *
     * @method create
     * @async
     * @param endpointUrl
     * @param callback the async callback function
     *
     *
     * @example
     *
     *    ```javascript
     *
     *    var secureChannel  = new ClientSecureChannelLayer({});
     *
     *    secureChannel.on("end", function(err) {
     *         console.log("secure channel has ended",err);
     *         if(err) {
     *            console.log(" the connection was closed by an external cause such as server shutdown");
     *        }
     *    });
     *    secureChannel.create("opc.tcp://localhost:1234/UA/Sample", (err) => {
     *         if(err) {
     *              console.log(" cannot establish secure channel" , err);
     *         } else {
     *              console.log("secure channel has been established");
     *         }
     *    });
     *
     *    ```
     */
    create(endpointUrl, callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        if (this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
            if (!this.serverCertificate) {
                return callback(new Error("ClientSecureChannelLayer#create : expecting a  server certificate when securityMode is not None"));
            }
            // take the opportunity of this async method to perform some async pre-processing
            if (!this.receiverPublicKey) {
                node_opcua_crypto_1.extractPublicKeyFromCertificate(this.serverCertificate, (err, publicKey) => {
                    /* istanbul ignore next */
                    if (err) {
                        return callback(err);
                    }
                    if (!publicKey) {
                        throw new Error("Internal Error");
                    }
                    this.receiverPublicKey = publicKey;
                    this.create(endpointUrl, callback);
                });
                return;
            }
        }
        this.endpointUrl = endpointUrl;
        const transport = new node_opcua_transport_1.ClientTCP_transport();
        transport.timeout = this.transportTimeout;
        this._establish_connection(transport, endpointUrl, (err) => {
            if (err) {
                debugLog(chalk_1.default.red("cannot connect to server"));
                transport.dispose();
                return callback(err);
            }
            this._on_connection(transport, callback);
        });
    }
    dispose() {
        this._cancel_security_token_watchdog();
        if (this.__call) {
            this.__call.abort();
        }
    }
    abortConnection(callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        if (this.__call) {
            this.__call.once("abort", () => setTimeout(callback, 20));
            this.__call._cancelBackoff = true;
            this.__call.abort();
        }
        else {
            callback();
        }
    }
    /**
     * perform a OPC-UA message transaction, asynchronously.
     * During a transaction, the client sends a request to the server. The provided callback will be invoked
     * at a later stage with the reply from the server, or the error.
     *
     * preconditions:
     *   - the channel must be opened
     *
     * @example
     *
     *    ```javascript
     *    let secure_channel ; // get a  ClientSecureChannelLayer somehow
     *
     *    const request = new BrowseRequest({...});
     *    secure_channel.performMessageTransaction(request, (err,response) => {
     *       if (err) {
     *         // an error has occurred
     *       } else {
     *          assert(response instanceof BrowseResponse);
     *         // do something with response.
     *       }
     *    });
     *    ```
     *
     */
    performMessageTransaction(request, callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        this._performMessageTransaction("MSG", request, callback);
    }
    isValid() {
        return this._transport !== null && this._transport.isValid();
    }
    isOpened() {
        return this.isValid() && this._isOpened;
    }
    getDisplayName() {
        if (!this.parent) {
            return "";
        }
        return "" + (this.parent.applicationName ? this.parent.applicationName + " " : "") + this.parent.clientName;
    }
    cancelPendingTransactions(callback) {
        node_opcua_assert_1.assert(_.isFunction(callback), "expecting a callback function, but got " + callback);
        // istanbul ignore next
        if (doDebug) {
            debugLog(" PENDING TRANSACTION = ", this.getDisplayName(), Object.keys(this._requests)
                .map((k) => this._requests[k].request.constructor.name).join(""));
        }
        for (const key of Object.keys(this._requests)) {
            // kill timer id
            const transaction = this._requests[key];
            if (transaction.callback) {
                transaction.callback(new Error("Transaction has been canceled because client channel  is being closed"));
            }
        }
        setImmediate(callback);
    }
    /**
     * Close a client SecureChannel ,by sending a CloseSecureChannelRequest to the server.
     *
     *
     * After this call, the connection is closed and no further transaction can be made.
     *
     * @method close
     * @async
     * @param callback
     */
    close(callback) {
        node_opcua_assert_1.assert(_.isFunction(callback), "expecting a callback function, but got " + callback);
        // cancel any pending transaction
        this.cancelPendingTransactions(( /* err?: Error */) => {
            // what the specs says:
            // --------------------
            //   The client closes the connection by sending a CloseSecureChannelRequest and closing the
            //   socket gracefully. When the server receives this message it shall release all resources
            //   allocated for the channel. The server does not send a CloseSecureChannel response
            //
            // ( Note : some servers do  send a CloseSecureChannel though !)
            // there is no need for the security token expiration event to trigger anymore
            this._cancel_security_token_watchdog();
            debugLog("Sending CloseSecureChannelRequest to server");
            const request = new services_1.CloseSecureChannelRequest({});
            this.__in_normal_close_operation = true;
            if (!this._transport || this._transport.__disconnecting__) {
                this.dispose();
                return callback(new Error("Transport disconnected"));
            }
            this._performMessageTransaction("CLO", request, () => {
                this.dispose();
                callback();
            });
        });
    }
    on_transaction_completed(transactionStatistics) {
        /* istanbul ignore next */
        if (doDebug) {
            // dump some statistics about transaction ( time and sizes )
            _dump_transaction_statistics(transactionStatistics);
        }
        this.emit("end_transaction", transactionStatistics);
    }
    _on_message_received(response, msgType, requestId) {
        node_opcua_assert_1.assert(msgType !== "ERR");
        /* istanbul ignore next */
        if (doTraceMessage) {
            console.log(chalk_1.default.cyan.bold("xxxxx  <<<<<< _on_message_received "), requestId, response.schema.name);
        }
        const requestData = this._requests[requestId];
        if (!requestData) {
            console.log(chalk_1.default.cyan.bold("xxxxx  <<<<<< _on_message_received "), requestId, response.schema.name);
            throw new Error(" =>  invalid requestId =" + requestId);
        }
        debugLog(" Deleting self._request_data", requestId);
        delete this._requests[requestId];
        /* istanbul ignore next */
        if (response.responseHeader.requestHandle !== requestData.request.requestHeader.requestHandle) {
            const expected = requestData.request.requestHeader.requestHandle;
            const actual = response.responseHeader.requestHandle;
            const moreInfo = "Class = " + response.schema.name;
            console.log(chalk_1.default.red.bold(" WARNING SERVER responseHeader.requestHandle is invalid" +
                ": expecting 0x" + expected.toString(16) +
                "  but got 0x" + actual.toString(16) + " "), chalk_1.default.yellow(moreInfo));
        }
        requestData.response = response;
        if (doPerfMonitoring) {
            // record tick2 : after response message has been received, before message processing
            requestData._tick2 = this.messageBuilder._tick1;
        }
        requestData.bytesRead = this.messageBuilder.totalMessageSize;
        if (doPerfMonitoring) {
            // record tick3 : after response message has been received, before message processing
            requestData._tick3 = node_opcua_utils_1.get_clock_tick();
        }
        process_request_callback(requestData, null, response);
        if (doPerfMonitoring) {
            // record tick4 after callback
            requestData._tick4 = node_opcua_utils_1.get_clock_tick();
        } // store some statistics
        this._record_transaction_statistics(requestData);
        // notify that transaction is completed
        this.on_transaction_completed(this.last_transaction_stats);
    }
    _record_transaction_statistics(requestData) {
        // ---------------------------------------------------------------------------------------------------------|-
        //      _tick0                _tick1                         _tick2                       _tick3          _tick4
        //          sending request
        //        |---------------------|  waiting response
        //                              |------------------------------|      receiving response
        //                                                             |---------------------------| process.resp
        //                                                                                  |---------------|
        this.last_transaction_stats = {
            bytesRead: requestData.bytesRead,
            bytesWritten: requestData.bytesWritten_after - requestData.bytesWritten_before,
            lap_processing_response: requestData._tick4 - requestData._tick3,
            lap_receiving_response: requestData._tick3 - requestData._tick2,
            lap_sending_request: requestData._tick1 - requestData._tick0,
            lap_transaction: requestData._tick4 - requestData._tick0,
            lap_waiting_response: requestData._tick2 - requestData._tick1,
            request: requestData.request,
            response: requestData.response
        };
        if (doTraceStatistics) {
            _dump_transaction_statistics(this.last_transaction_stats);
        }
    }
    _cancel_pending_transactions(err) {
        if (doDebug && this._requests) {
            debugLog("_cancel_pending_transactions  ", Object.keys(this._requests), this._transport ? this._transport.name : "no transport");
        }
        node_opcua_assert_1.assert(err === null || err === undefined || _.isObject(err), "expecting valid error");
        if (this._requests) {
            Object.keys(this._requests).forEach((key) => {
                const requestData = this._requests[key];
                debugLog("Cancelling pending transaction ", requestData.key, requestData.msgType, requestData.request.schema.name);
                process_request_callback(requestData, err);
            });
        }
        this._requests = {};
    }
    _on_transport_closed(err) {
        debugLog(" =>ClientSecureChannelLayer#_on_transport_closed");
        if (this.__in_normal_close_operation) {
            err = undefined;
        }
        /**
         * notify the observers that the transport connection has ended.
         * The error object is null or undefined if the disconnection was initiated by the ClientSecureChannelLayer.
         * A Error object is provided if the disconnection has been initiated by an external cause.
         *
         * @event close
         * @param err
         */
        this.emit("close", err);
        this._cancel_pending_transactions(err);
        this._transport = null;
    }
    _on_security_token_about_to_expire() {
        if (!this.securityToken) {
            return;
        }
        debugLog(" client: Security Token ", this.securityToken.tokenId, " is about to expired, let's raise lifetime_75 event ");
        /**
         * notify the observer that the secure channel has now reach 75% of its allowed live time and
         * that a new token is going to be requested.
         * @event  lifetime_75
         * @param  securityToken {Object} : the security token that is about to expire.
         *
         */
        this.emit("lifetime_75", this.securityToken);
        this._renew_security_token();
    }
    _cancel_security_token_watchdog() {
        if (this._securityTokenTimeoutId) {
            clearTimeout(this._securityTokenTimeoutId);
            this._securityTokenTimeoutId = null;
        }
    }
    _install_security_token_watchdog() {
        if (!this.securityToken) {
            return;
        }
        // install timer event to raise a 'lifetime_75' when security token is about to expired
        // so that client can request for a new security token
        // note that, for speedup in test,
        // it is possible to tweak this interval for test by specifying a tokenRenewalInterval value
        //
        const lifeTime = this.securityToken.revisedLifetime;
        node_opcua_assert_1.assert(lifeTime !== 0 && lifeTime > 20);
        const percent = 75 / 100.0;
        let timeout = this.tokenRenewalInterval || lifeTime * percent;
        timeout = Math.min(timeout, lifeTime * 75 / 100);
        timeout = Math.max(timeout, 50); // at least one half second !
        if (doDebug) {
            debugLog(chalk_1.default.red.bold(" time until next security token renewal = "), timeout, "( lifetime = ", lifeTime + ") + tokenRenewalInterval" + this.tokenRenewalInterval);
        }
        node_opcua_assert_1.assert(this._securityTokenTimeoutId === null);
        this._securityTokenTimeoutId = setTimeout(() => {
            this._securityTokenTimeoutId = null;
            this._on_security_token_about_to_expire();
        }, timeout);
    }
    _build_client_nonce() {
        if (this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
            return null;
        }
        // create a client Nonce if secure mode is requested
        // Release 1.02 page 23 OPC Unified Architecture, Part 4 Table 7 – OpenSecureChannel Service Parameters
        // clientNonce
        // "This parameter shall have a length equal to key size used for the symmetric
        //  encryption algorithm that is identified by the securityPolicyUri"
        const cryptoFactory = security_policy_1.getCryptoFactory(this.securityPolicy);
        if (!cryptoFactory) {
            // this securityPolicy may not be support yet ... let's return null
            return null;
        }
        node_opcua_assert_1.assert(_.isObject(cryptoFactory));
        return crypto_1.randomBytes(cryptoFactory.symmetricKeyLength);
    }
    _open_secure_channel_request(isInitial, callback) {
        node_opcua_assert_1.assert(this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.Invalid, "invalid security mode");
        // from the specs:
        // The OpenSecureChannel Messages are not signed or encrypted if the SecurityMode is None. The
        // nonces  are ignored and should be set to null. The SecureChannelId and the TokenId are still
        // assigned but no security is applied to Messages exchanged via the channel.
        const msgType = "OPN";
        const requestType = (isInitial) ? services_1.SecurityTokenRequestType.Issue : services_1.SecurityTokenRequestType.Renew;
        this.clientNonce = this._build_client_nonce();
        this._isOpened = !isInitial;
        // OpenSecureChannel
        const msg = new services_1.OpenSecureChannelRequest({
            clientNonce: this.clientNonce,
            clientProtocolVersion: this.protocolVersion,
            requestHeader: {
                auditEntryId: null
            },
            requestType: requestType,
            requestedLifetime: this.defaultSecureTokenLifetime,
            securityMode: this.securityMode
        });
        this._performMessageTransaction(msgType, msg, (err, response) => {
            if (response && response.responseHeader && response.responseHeader.serviceResult !== node_opcua_status_code_1.StatusCodes.Good) {
                err = new Error(response.responseHeader.serviceResult.toString());
            }
            if (!err && response) {
                const openSecureChannelResponse = response;
                // record channelId for future transactions
                this.channelId = openSecureChannelResponse.securityToken.channelId;
                // todo : verify that server certificate is  valid
                // A self-signed application instance certificate does not need to be verified with a CA.
                // todo : verify that Certificate URI matches the ApplicationURI of the server
                node_opcua_assert_1.assert(openSecureChannelResponse.securityToken.tokenId > 0 || msgType === "OPN", "_sendSecureOpcUARequest: invalid token Id ");
                node_opcua_assert_1.assert(openSecureChannelResponse.hasOwnProperty("serverNonce"));
                this.securityToken = openSecureChannelResponse.securityToken;
                this.serverNonce = openSecureChannelResponse.serverNonce;
                if (this.securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
                    // verify that server nonce if provided is at least 32 bytes long
                    /* istanbul ignore next */
                    if (!openSecureChannelResponse.serverNonce) {
                        console.log(" client : server nonce is invalid !");
                        return callback(new Error(" Invalid server nonce"));
                    }
                    // This parameter shall have a length equal to key size used for the symmetric
                    // encryption algorithm that is identified by the securityPolicyUri.
                    if (openSecureChannelResponse.serverNonce.length !== this.clientNonce.length) {
                        console.log(" client : server nonce is invalid !");
                        return callback(new Error(" Invalid server nonce length"));
                    }
                }
                const cryptoFactory = this.messageBuilder.cryptoFactory;
                if (cryptoFactory) {
                    node_opcua_assert_1.assert(this.serverNonce instanceof Buffer);
                    if (!this.serverNonce) {
                        throw new Error("internal error");
                    }
                    this.derivedKeys = security_policy_1.computeDerivedKeys(cryptoFactory, this.serverNonce, this.clientNonce);
                }
                const derivedServerKeys = this.derivedKeys ? this.derivedKeys.derivedServerKeys : null;
                if (doDebug) {
                    debugLog("Server has send a new security Token");
                }
                this.messageBuilder.pushNewToken(this.securityToken, derivedServerKeys);
                this._install_security_token_watchdog();
                this._isOpened = true;
            }
            callback(err || undefined);
        });
    }
    _on_connection(transport, callback) {
        this._transport = transport;
        this._transport.on("message", (messageChunk) => {
            /**
             * notify the observers that ClientSecureChannelLayer has received a message chunk
             * @event receive_chunk
             * @param message_chunk
             */
            this.emit("receive_chunk", messageChunk);
            this._on_receive_message_chunk(messageChunk);
        });
        this._transport.on("close", (err) => this._on_transport_closed(err));
        this._transport.on("connection_break", () => {
            debugLog(chalk_1.default.red("Client => CONNECTION BREAK  <="));
            this._on_transport_closed(new Error("Connection Break"));
        });
        this._transport.on("error", (err) => {
            debugLog(" ERROR", err);
        });
        setImmediate(() => {
            debugLog(chalk_1.default.red("Client now sending OpenSecureChannel"));
            const isInitial = true;
            this._open_secure_channel_request(isInitial, callback);
        });
    }
    _backoff_completion(err, lastError, transport, callback) {
        if (this.__call) {
            // console log =
            transport.numberOfRetry = transport.numberOfRetry || 0;
            transport.numberOfRetry += this.__call.getNumRetries();
            this.__call.removeAllListeners();
            this.__call = null;
            if (err) {
                callback(lastError || err);
            }
            else {
                callback();
            }
        }
    }
    _connect(transport, endpointUrl, _i_callback) {
        if (this.__call && this.__call._cancelBackoff) {
            return;
        }
        const on_connect = (err) => {
            debugLog("Connection => err", err ? err.message : "null");
            // force Backoff to fail if err is not ECONNRESET or ECONNREFUSE
            // this mean that the connection to the server has succeeded but for some reason
            // the server has denied the connection
            // the cause could be:
            //   - invalid protocol version specified by client
            //   - server going to shutdown
            //   - server too busy -
            //   - server shielding itself from a DDOS attack
            if (err) {
                let should_abort = false;
                if (err.message.match(/ECONNRESET/)) {
                    should_abort = true;
                }
                if (err.message.match(/BadProtocolVersionUnsupported/)) {
                    should_abort = true;
                }
                this.lastError = err;
                if (this.__call) {
                    // connection cannot be establish ? if not, abort the backoff process
                    if (should_abort) {
                        debugLog(" Aborting backoff process prematurally - err = ", err.message);
                        this.__call.abort();
                    }
                    else {
                        debugLog(" backoff - keep trying - err = ", err.message);
                    }
                }
            }
            _i_callback(err);
        };
        transport.connect(endpointUrl, on_connect);
    }
    _establish_connection(transport, endpointUrl, callback) {
        transport.protocolVersion = this.protocolVersion;
        this.lastError = undefined;
        if (this.connectionStrategy.maxRetry === 0) {
            debugLog(chalk_1.default.cyan("max Retry === 1 =>  No backoff required -> call the _connect function directly"));
            this.__call = 0;
            return this._connect(transport, endpointUrl, callback);
        }
        const connectFunc = (callback2) => {
            return this._connect(transport, endpointUrl, callback2);
        };
        const completionFunc = (err) => {
            return this._backoff_completion(err, this.lastError, transport, callback);
        };
        this.__call = backoff.call(connectFunc, completionFunc);
        if (this.connectionStrategy.maxRetry >= 0) {
            const maxRetry = Math.max(this.connectionStrategy.maxRetry, 1);
            debugLog(chalk_1.default.cyan("backoff will failed after "), maxRetry);
            this.__call.failAfter(maxRetry);
        }
        else {
            // retry will be infinite
            debugLog(chalk_1.default.cyan("backoff => starting a infinite retry"));
        }
        const onBackoffFunc = (retryCount, delay) => {
            debugLog(chalk_1.default.bgWhite.cyan(" Backoff #"), retryCount, "delay = ", delay, " ms", " maxRetry ", this.connectionStrategy.maxRetry);
            // Do something when backoff starts, e.g. show to the
            // user the delay before next reconnection attempt.
            /**
             * @event backoff
             * @param retryCount: number
             * @param delay: number
             */
            this.emit("backoff", retryCount, delay);
        };
        this.__call.on("backoff", onBackoffFunc);
        this.__call.on("abort", () => {
            debugLog(chalk_1.default.bgWhite.cyan(` abort #   after ${this.__call.getNumRetries()} retries.`));
            // Do something when backoff starts, e.g. show to the
            // user the delay before next reconnection attempt.
            /**
             * @event backoff
             */
            this.emit("abort");
            setImmediate(() => {
                this._backoff_completion(undefined, new Error("Connection abandoned"), transport, callback);
            });
        });
        this.__call.setStrategy(new backoff.ExponentialStrategy(this.connectionStrategy));
        this.__call.start();
    }
    _renew_security_token() {
        debugLog("ClientSecureChannelLayer#_renew_security_token");
        if (!this.isValid()) {
            // this may happen if the communication has been closed by the client or the sever
            console.log("Invalid socket => Communication has been lost, cannot renew token");
            return;
        }
        const isInitial = false;
        this._open_secure_channel_request(isInitial, (err) => {
            /* istanbul ignore else */
            if (!err) {
                debugLog(" token renewed");
                /**
                 * notify the observers that the security has been renewed
                 * @event security_token_renewed
                 */
                this.emit("security_token_renewed");
            }
            else {
                debugLog("ClientSecureChannelLayer: Warning: securityToken hasn't been renewed -> err ", err);
            }
        });
    }
    _on_receive_message_chunk(messageChunk) {
        /* istanbul ignore next */
        if (doDebug) {
            const _stream = new node_opcua_binary_stream_1.BinaryStream(messageChunk);
            const messageHeader = node_opcua_chunkmanager_1.readMessageHeader(_stream);
            debugLog("CLIENT RECEIVED " + chalk_1.default.yellow(JSON.stringify(messageHeader) + ""));
            debugLog("\n" + node_opcua_debug_1.hexDump(messageChunk));
            debugLog(message_header_to_string_1.messageHeaderToString(messageChunk));
        }
        this.messageBuilder.feed(messageChunk);
    }
    /**
     * @method makeRequestId
     * @return  newly generated request id
     * @private
     */
    makeRequestId() {
        this._lastRequestId += 1;
        return this._lastRequestId;
    }
    /**
     * internal version of _performMessageTransaction.
     *
     * @method _performMessageTransaction
     * @private
     *
     * - this method takes a extra parameter : msgType
     * TODO:
     * - this method can be re-entrant, meaning that a new transaction can be started before any pending transaction
     *   is fully completed.
     * - Any error on transport will cause all pending transactions to be cancelled
     *
     * - the method returns a timeout Error if the server fails to return a response within the timeoutHint interval.
     *
     *
     */
    _performMessageTransaction(msgType, request, callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        if (!this.isValid()) {
            return callback(new Error("ClientSecureChannelLayer => Socket is closed !"));
        }
        let localCallback = callback;
        let timeout = request.requestHeader.timeoutHint || defaultTransactionTimeout;
        timeout = Math.max(minTransactionTimeout, timeout);
        let timerId = null;
        let hasTimedOut = false;
        const modified_callback = (err, response) => {
            /* istanbul ignore next */
            if (doDebug) {
                debugLog(chalk_1.default.cyan("------------------- client receiving response"), err);
                if (response) {
                    debugLog(response.toString());
                }
            }
            if (!localCallback) {
                return; // already processed by time  out
            }
            // when response === null we are processing the timeout , therefore there is no need to clearTimeout
            if (!hasTimedOut && timerId) {
                clearTimeout(timerId);
            }
            timerId = null;
            if (!err && response) {
                /**
                 * notify the observers that a server response has been received on the channel
                 * @event  receive_response
                 * @param response {Object} the response object
                 */
                this.emit("receive_response", response);
            }
            node_opcua_assert_1.assert(!err || (err instanceof Error));
            // invoke user callback if it has not been intercepted first ( by a abrupt disconnection for instance )
            try {
                localCallback.call(this, err, response);
            }
            catch (err) {
                console.log("ERROR !!! , please check here !!!! callback may be called twice !! ", err);
                callback(err);
            }
            finally {
                localCallback = null;
            }
        };
        timerId = setTimeout(() => {
            timerId = null;
            console.log(" Timeout .... waiting for response for ", request.constructor.name, request.requestHeader.toString());
            hasTimedOut = true;
            modified_callback(new Error("Transaction has timed out ( timeout = " + timeout + " ms)"));
            this._timedout_request_count += 1;
            /**
             * notify the observer that the response from the request has not been
             * received within the timeoutHint specified
             * @event timed_out_request
             * @param message_chunk {Object}  the message chunk
             */
            this.emit("timed_out_request", request);
        }, timeout);
        const transaction_data = {
            callback: modified_callback,
            msgType: msgType,
            request: request,
            timerId: timerId
        };
        this._internal_perform_transaction(transaction_data);
    }
    /**
     *
     * @param transactionData
     * @param transactionData.msgType
     * @param transactionData.request
     * @param transactionData.callback
     * @private
     */
    _internal_perform_transaction(transactionData) {
        node_opcua_assert_1.assert(_.isFunction(transactionData.callback));
        if (!this._transport) {
            setTimeout(() => {
                transactionData.callback(new Error("Client not connected"));
            }, 100);
            return;
        }
        node_opcua_assert_1.assert(this._transport, " must have a valid transport");
        const msgType = transactionData.msgType;
        const request = transactionData.request;
        node_opcua_assert_1.assert(msgType.length === 3);
        // get a new requestId
        const requestId = this.makeRequestId();
        /* istanbul ignore next */
        if (doTraceMessage) {
            console.log(chalk_1.default.cyan("xxxxx   >>>>>>                     "), requestId, request.schema.name);
        }
        const requestData = {
            callback: transactionData.callback,
            msgType: msgType,
            request: request,
            bytesRead: 0,
            bytesWritten_after: 0,
            bytesWritten_before: this.bytesWritten,
            _tick0: 0,
            _tick1: 0,
            _tick2: 0,
            _tick3: 0,
            _tick4: 0,
            key: "",
            chunk_count: 0
        };
        this._requests[requestId] = requestData;
        if (doPerfMonitoring) {
            const stats = requestData;
            // record tick0 : before request is being sent to server
            stats._tick0 = node_opcua_utils_1.get_clock_tick();
        }
        this._sendSecureOpcUARequest(msgType, request, requestId);
    }
    _send_chunk(requestId, chunk) {
        const requestData = this._requests[requestId];
        if (chunk) {
            /**
             * notify the observer that a message chunk is about to be sent to the server
             * @event send_chunk
             * @param message_chunk {Object}  the message chunk
             */
            this.emit("send_chunk", chunk);
            /* istanbul ignore next */
            if (doDebug && checkChunks) {
                node_opcua_chunkmanager_1.verify_message_chunk(chunk);
                debugLog(chalk_1.default.yellow("CLIENT SEND chunk "));
                debugLog(chalk_1.default.yellow(message_header_to_string_1.messageHeaderToString(chunk)));
                debugLog(chalk_1.default.red(node_opcua_debug_1.hexDump(chunk)));
            }
            node_opcua_assert_1.assert(this._transport);
            this._transport.write(chunk);
            requestData.chunk_count += 1;
        }
        else {
            // last chunk ....
            /* istanbul ignore next */
            if (doDebug) {
                debugLog(chalk_1.default.yellow("CLIENT SEND done."));
            }
            if (requestData) {
                if (doPerfMonitoring) {
                    requestData._tick1 = node_opcua_utils_1.get_clock_tick();
                }
                requestData.bytesWritten_after = this.bytesWritten;
            }
        }
    }
    _construct_security_header() {
        node_opcua_assert_1.assert(this.hasOwnProperty("securityMode"));
        node_opcua_assert_1.assert(this.hasOwnProperty("securityPolicy"));
        this.receiverCertificate = this.serverCertificate ? Buffer.from(this.serverCertificate) : null;
        let securityHeader = null;
        switch (this.securityMode) {
            case node_opcua_service_secure_channel_1.MessageSecurityMode.Sign:
            case node_opcua_service_secure_channel_1.MessageSecurityMode.SignAndEncrypt: {
                node_opcua_assert_1.assert(this.securityPolicy !== security_policy_1.SecurityPolicy.None);
                // get the thumbprint of the client certificate
                const thumbprint = this.receiverCertificate ? node_opcua_crypto_1.makeSHA1Thumbprint(this.receiverCertificate) : null;
                securityHeader = new services_1.AsymmetricAlgorithmSecurityHeader({
                    receiverCertificateThumbprint: thumbprint,
                    securityPolicyUri: security_policy_1.toURI(this.securityPolicy),
                    senderCertificate: this.getCertificateChain() // certificate of the private key used to sign the message
                });
                break;
            }
            default:
                /* istanbul ignore next */
                node_opcua_assert_1.assert(false, "invalid security mode");
        }
        this.securityHeader = securityHeader;
    }
    _get_security_options_for_OPN() {
        if (this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
            return null;
        }
        this._construct_security_header();
        this.messageChunker.securityHeader = this.securityHeader;
        const senderPrivateKey = this.getPrivateKey();
        if (!senderPrivateKey) {
            throw new Error("invalid senderPrivateKey");
        }
        const cryptoFactory = security_policy_1.getCryptoFactory(this.securityPolicy);
        if (!cryptoFactory) {
            return null; // may be a not yet supported security Policy
        }
        node_opcua_assert_1.assert(cryptoFactory, "expecting a cryptoFactory");
        node_opcua_assert_1.assert(_.isFunction(cryptoFactory.asymmetricSign));
        const options = {};
        options.signatureLength = node_opcua_crypto_1.rsa_length(senderPrivateKey);
        options.signBufferFunc = (chunk) => {
            const s = cryptoFactory.asymmetricSign(chunk, senderPrivateKey);
            node_opcua_assert_1.assert(s.length === options.signatureLength);
            return s;
        };
        if (!this.receiverPublicKey) {
            throw new Error(" invalid receiverPublicKey");
        }
        const keyLength = node_opcua_crypto_1.rsa_length(this.receiverPublicKey);
        options.plainBlockSize = keyLength - cryptoFactory.blockPaddingSize;
        options.cipherBlockSize = keyLength;
        const receiverPublicKey = this.receiverPublicKey;
        options.encryptBufferFunc = (chunk) => {
            return cryptoFactory.asymmetricEncrypt(chunk, receiverPublicKey);
        };
        return options;
    }
    _get_security_options_for_MSG() {
        if (this.securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.None) {
            return null;
        }
        if (!this.derivedKeys || !this.derivedKeys.derivedClientKeys) {
            throw new Error("internal error expecting valid derivedKeys");
        }
        const derivedClientKeys = this.derivedKeys.derivedClientKeys;
        node_opcua_assert_1.assert(derivedClientKeys, "expecting valid derivedClientKeys");
        return security_policy_1.getOptionsForSymmetricSignAndEncrypt(this.securityMode, derivedClientKeys);
    }
    _sendSecureOpcUARequest(msgType, request, requestId) {
        const tokenId = this.securityToken ? this.securityToken.tokenId : 0;
        // assert(this.channelId !== 0 , "channel Id cannot be null");
        const options = {
            channelId: this.channelId,
            chunkSize: 0,
            requestId,
            tokenId,
            cipherBlockSize: 0,
            plainBlockSize: 0,
            sequenceHeaderSize: 0,
            signatureLength: 0
        };
        // use chunk size that has been negotiated by the transport layer
        if (this._transport.parameters && this._transport.parameters.sendBufferSize) {
            options.chunkSize = this._transport.parameters.sendBufferSize;
        }
        request.requestHeader.requestHandle = options.requestId;
        request.requestHeader.returnDiagnostics = 0x0;
        /* istanbul ignore next */
        if (doDebug) {
            debugLog(chalk_1.default.yellow.bold("------------------------------------- Client Sending a request"));
            debugLog(" CHANNEL ID ", this.channelId);
            debugLog(request.toString());
        }
        const security_options = (msgType === "OPN") ? this._get_security_options_for_OPN() : this._get_security_options_for_MSG();
        _.extend(options, security_options);
        /**
         * notify the observer that a client request is being sent the server
         * @event send_request
         * @param request {Request}
         */
        this.emit("send_request", request);
        this.messageChunker.chunkSecureMessage(msgType, options, request, (chunk) => this._send_chunk(requestId, chunk));
    }
}
exports.ClientSecureChannelLayer = ClientSecureChannelLayer;
ClientSecureChannelLayer.defaultTransportTimeout = 60 * 1000; // 1 minute
//# sourceMappingURL=client_secure_channel_layer.js.map