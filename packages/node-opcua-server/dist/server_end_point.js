"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-server
 */
// tslint:disable:no-console
const async = require("async");
const chalk_1 = require("chalk");
const events_1 = require("events");
const net = require("net");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_hostname_1 = require("node-opcua-hostname");
const node_opcua_secure_channel_1 = require("node-opcua-secure-channel");
const node_opcua_service_endpoints_1 = require("node-opcua-service-endpoints");
const node_opcua_service_endpoints_2 = require("node-opcua-service-endpoints");
const node_opcua_service_endpoints_3 = require("node-opcua-service-endpoints");
const source_1 = require("../../node-opcua-transport/dist/source");
const WebSocket = require("ws");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const errorLog = node_opcua_debug_1.make_errorLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const default_transportProfileUri = "http://opcfoundation.org/UA-Profile/Transport/uatcp-uasc-uabinary";
function dumpChannelInfo(channels) {
    function dumpChannel(channel) {
        console.log("------------------------------------------------------");
        console.log("            channelId = ", channel.channelId);
        console.log("             timeout  = ", channel.timeout);
        console.log("        remoteAddress = ", channel.remoteAddress);
        console.log("        remotePort    = ", channel.remotePort);
        console.log("");
        console.log("        bytesWritten  = ", channel.bytesWritten);
        console.log("        bytesRead     = ", channel.bytesRead);
        const socket = channel.transport._socket;
        if (!socket) {
            console.log(" SOCKET IS CLOSED");
        }
    }
    for (const channel of channels) {
        dumpChannel(channel);
    }
}
const emptyCertificate = Buffer.alloc(0);
const emptyPrivateKeyPEM = "";
let OPCUAServerEndPointCounter = 0;
/**
 * OPCUAServerEndPoint a Server EndPoint.
 * A sever end point is listening to one port
 * note:
 *   see OPCUA Release 1.03 part 4 page 108 7.1 ApplicationDescription
 */
class OPCUAServerEndPoint extends events_1.EventEmitter {
    constructor(options) {
        super();
        this._started = false;
        this._counter = OPCUAServerEndPointCounter++;
        node_opcua_assert_1.assert(!options.hasOwnProperty("certificate"), "expecting a certificateChain instead");
        node_opcua_assert_1.assert(options.hasOwnProperty("certificateChain"), "expecting a certificateChain");
        node_opcua_assert_1.assert(options.hasOwnProperty("privateKey"));
        this.certificateManager = options.certificateManager;
        options.port = options.port || 0;
        this.port = parseInt(options.port.toString(), 10);
        node_opcua_assert_1.assert(_.isNumber(this.port));
        this._certificateChain = options.certificateChain;
        this._privateKey = options.privateKey;
        this._channels = {};
        this.defaultSecureTokenLifetime = options.defaultSecureTokenLifetime || 600000;
        this.maxConnections = options.maxConnections || 20;
        this.timeout = options.timeout || 30000;
        this._setup_server();
        this._endpoints = [];
        this.objectFactory = options.objectFactory;
        this.bytesWrittenInOldChannels = 0;
        this.bytesReadInOldChannels = 0;
        this.transactionsCountOldChannels = 0;
        this.securityTokenCountOldChannels = 0;
        this.serverInfo = options.serverInfo;
        node_opcua_assert_1.assert(_.isObject(this.serverInfo));
    }
    dispose() {
        this._certificateChain = emptyCertificate;
        this._privateKey = emptyPrivateKeyPEM;
        node_opcua_assert_1.assert(Object.keys(this._channels).length === 0, "OPCUAServerEndPoint channels must have been deleted");
        this._channels = {};
        this.serverInfo = new node_opcua_service_endpoints_3.ApplicationDescription({});
        this._endpoints = [];
        node_opcua_assert_1.assert(this._endpoints.length === 0, "endpoints must have been deleted");
        this._endpoints = [];
        this._listen_callback = null;
        this.removeAllListeners();
    }
    toString() {
        const privateKey1 = node_opcua_crypto_1.convertPEMtoDER(this.getPrivateKey());
        const txt = " end point" + this._counter +
            " port = " + this.port +
            " l = " + this._endpoints.length +
            " " + node_opcua_crypto_1.makeSHA1Thumbprint(this.getCertificateChain()).toString("hex") +
            " " + node_opcua_crypto_1.makeSHA1Thumbprint(privateKey1).toString("hex");
        return txt;
    }
    getChannels() {
        return _.values(this._channels);
    }
    /**
     * Returns the X509 DER form of the server certificate
     */
    getCertificate() {
        return node_opcua_crypto_1.split_der(this.getCertificateChain())[0];
    }
    /**
     * Returns the X509 DER form of the server certificate
     */
    getCertificateChain() {
        return this._certificateChain;
    }
    /**
     * the private key
     */
    getPrivateKey() {
        return this._privateKey;
    }
    /**
     * The number of active channel on this end point.
     */
    get currentChannelCount() {
        return Object.keys(this._channels).length;
    }
    /**
     * @method getEndpointDescription
     * @param securityMode
     * @param securityPolicy
     * @return endpoint_description {EndpointDescription|null}
     */
    getEndpointDescription(securityMode, securityPolicy, endpointUrl) {
        const endpoints = this.endpointDescriptions();
        const arr = _.filter(endpoints, matching_endpoint.bind(this, securityMode, securityPolicy, endpointUrl));
        if (!(arr.length === 0 || arr.length === 1)) {
            errorLog("Several matching endpoints have been found : ");
            for (const a of arr) {
                errorLog("   ", a.endpointUrl, node_opcua_secure_channel_1.MessageSecurityMode[securityMode], securityPolicy);
            }
        }
        return arr.length === 0 ? null : arr[0];
    }
    addEndpointDescription(securityMode, securityPolicy, options) {
        if (!options) {
            options = { hostname: node_opcua_hostname_1.getFullyQualifiedDomainName() };
        }
        options.allowAnonymous = (options.allowAnonymous === undefined) ? true : options.allowAnonymous;
        // istanbul ignore next
        if (securityMode === node_opcua_secure_channel_1.MessageSecurityMode.None && securityPolicy !== node_opcua_secure_channel_1.SecurityPolicy.None) {
            throw new Error(" invalid security ");
        }
        // istanbul ignore next
        if (securityMode !== node_opcua_secure_channel_1.MessageSecurityMode.None && securityPolicy === node_opcua_secure_channel_1.SecurityPolicy.None) {
            throw new Error(" invalid security ");
        }
        //
        const port = this.port;
        // resource Path is a string added at the end of the url such as "/UA/Server"
        const resourcePath = (options.resourcePath || "").replace(/\\/g, "/");
        node_opcua_assert_1.assert(resourcePath.length === 0 || resourcePath.charAt(0) === "/", "resourcePath should start with /");
        const hostname = options.hostname || node_opcua_hostname_1.getFullyQualifiedDomainName();
        const endpointUrl = `opc.tcp://${hostname}:${port}${resourcePath}`;
        const endpoint_desc = this.getEndpointDescription(securityMode, securityPolicy, endpointUrl);
        // istanbul ignore next
        if (endpoint_desc) {
            throw new Error(" endpoint already exist");
        }
        // now build endpointUrl
        this._endpoints.push(_makeEndpointDescription({
            endpointUrl,
            hostname,
            port,
            server: this.serverInfo,
            serverCertificateChain: this.getCertificateChain(),
            securityMode,
            securityPolicy,
            allowAnonymous: options.allowAnonymous,
            allowUnsecurePassword: options.allowUnsecurePassword,
            resourcePath: options.resourcePath,
            restricted: !!options.restricted
        }));
    }
    addRestrictedEndpointDescription(options) {
        options = _.clone(options);
        options.restricted = true;
        return this.addEndpointDescription(node_opcua_secure_channel_1.MessageSecurityMode.None, node_opcua_secure_channel_1.SecurityPolicy.None, options);
    }
    addStandardEndpointDescriptions(options) {
        options = options || {};
        options.securityModes = options.securityModes || defaultSecurityModes;
        options.securityPolicies = options.securityPolicies || defaultSecurityPolicies;
        const defaultHostname = options.hostname || node_opcua_hostname_1.getFullyQualifiedDomainName();
        let hostnames = [defaultHostname];
        options.alternateHostname = options.alternateHostname || [];
        if (typeof options.alternateHostname === "string") {
            options.alternateHostname = [options.alternateHostname];
        }
        hostnames = _.uniq(hostnames.concat(options.alternateHostname));
        for (const alternateHostname of hostnames) {
            const optionsE = options;
            optionsE.hostname = alternateHostname;
            if (options.securityModes.indexOf(node_opcua_secure_channel_1.MessageSecurityMode.None) >= 0) {
                this.addEndpointDescription(node_opcua_secure_channel_1.MessageSecurityMode.None, node_opcua_secure_channel_1.SecurityPolicy.None, optionsE);
            }
            else {
                if (!options.disableDiscovery) {
                    this.addRestrictedEndpointDescription(optionsE);
                }
            }
            for (const securityMode of options.securityModes) {
                if (securityMode === node_opcua_secure_channel_1.MessageSecurityMode.None) {
                    continue;
                }
                for (const securityPolicy of options.securityPolicies) {
                    if (securityPolicy === node_opcua_secure_channel_1.SecurityPolicy.None) {
                        continue;
                    }
                    this.addEndpointDescription(securityMode, securityPolicy, optionsE);
                }
            }
        }
    }
    /**
     * returns the list of end point descriptions.
     */
    endpointDescriptions() {
        return this._endpoints;
    }
    killClientSockets(callback) {
        for (const channel of this.getChannels()) {
            const hacked_channel = channel;
            if (hacked_channel.transport && hacked_channel.transport._socket) {
                // hacked_channel.transport._socket.close();
                hacked_channel.transport._socket.destroy();
                hacked_channel.transport._socket.emit("error", new Error("EPIPE"));
            }
        }
        callback();
    }
    suspendConnection(callback) {
        if (!this._started) {
            return callback(new Error("Connection already suspended !!"));
        }
        // Stops the server from accepting new connections and keeps existing connections.
        // (note from nodejs doc: This function is asynchronous, the server is finally closed
        // when all connections are ended and the server emits a 'close' event.
        // The optional callback will be called once the 'close' event occurs.
        // Unlike that event, it will be called with an Error as its only argument
        // if the server was not open when it was closed.
        this._close_server();
        this._started = false;
        callback();
    }
    restoreConnection(callback) {
        this.listen(callback);
    }
    abruptlyInterruptChannels() {
        const _channels = _.values(this._channels);
        for (const channel of _channels) {
            channel.abruptlyInterrupt();
        }
    }
    /**
     * @method shutdown
     * @async
     */
    shutdown(callback) {
        debugLog("OPCUAServerEndPoint#shutdown ");
        if (this._started) {
            // make sure we don't accept new connection any more ...
            this.suspendConnection(() => {
                // shutdown all opened channels ...
                const _channels = _.values(this._channels);
                async.each(_channels, (channel, callback1) => {
                    this.shutdown_channel(channel, callback1);
                }, (err) => {
                    /* istanbul ignore next */
                    if (!(Object.keys(this._channels).length === 0)) {
                        errorLog(" Bad !");
                    }
                    node_opcua_assert_1.assert(Object.keys(this._channels).length === 0, "channel must have unregistered themselves");
                    callback(err || undefined);
                });
            });
        }
        else {
            callback();
        }
    }
    /**
     * @method start
     * @async
     * @param callback
     */
    start(callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        this.listen(callback);
    }
    get bytesWritten() {
        const channels = _.values(this._channels);
        return this.bytesWrittenInOldChannels + channels.reduce((accumulated, channel) => {
            return accumulated + channel.bytesWritten;
        }, 0);
    }
    get bytesRead() {
        const channels = _.values(this._channels);
        return this.bytesReadInOldChannels + channels.reduce((accumulated, channel) => {
            return accumulated + channel.bytesRead;
        }, 0);
    }
    get transactionsCount() {
        const channels = _.values(this._channels);
        return this.transactionsCountOldChannels + channels.reduce((accumulated, channel) => {
            return accumulated + channel.transactionsCount;
        }, 0);
    }
    get securityTokenCount() {
        const channels = _.values(this._channels);
        return this.securityTokenCountOldChannels + channels.reduce((accumulated, channel) => {
            return accumulated + channel.securityTokenCount;
        }, 0);
    }
    get activeChannelCount() {
        return Object.keys(this._channels).length;
    }
    _preregisterChannel(channel) {
        // _preregisterChannel is used to keep track of channel for which
        // that are in early stage of the hand shaking process.
        // e.g HEL/ACK and OpenSecureChannel may not have been received yet
        // as they will need to be interrupted when OPCUAServerEndPoint is closed
        node_opcua_assert_1.assert(this._started, "OPCUAServerEndPoint must be started");
        node_opcua_assert_1.assert(!this._channels.hasOwnProperty(channel.hashKey), " channel already preregistered!");
        this._channels[channel.hashKey] = channel;
        channel._unpreregisterChannelEvent = () => {
            debugLog("Channel received an abort event during the preregistration phase");
            this._un_pre_registerChannel(channel);
            channel.dispose();
        };
        channel.on("abort", channel._unpreregisterChannelEvent);
    }
    _un_pre_registerChannel(channel) {
        if (!this._channels[channel.hashKey]) {
            debugLog("Already un preregistered ?", channel.hashKey);
            return;
        }
        delete this._channels[channel.hashKey];
        node_opcua_assert_1.assert(_.isFunction(channel._unpreregisterChannelEvent));
        channel.removeListener("abort", channel._unpreregisterChannelEvent);
        channel._unpreregisterChannelEvent = null;
    }
    /**
     * @method _registerChannel
     * @param channel
     * @private
     */
    _registerChannel(channel) {
        if (this._started) {
            debugLog(chalk_1.default.red("_registerChannel = "), "channel.hashKey = ", channel.hashKey);
            node_opcua_assert_1.assert(!this._channels[channel.hashKey]);
            this._channels[channel.hashKey] = channel;
            /**
             * @event newChannel
             * @param channel
             */
            this.emit("newChannel", channel);
            channel.on("abort", () => {
                this._unregisterChannel(channel);
            });
        }
        else {
            debugLog("OPCUAServerEndPoint#_registerChannel called when end point is shutdown !");
            debugLog("  -> channel will be forcefully terminated");
            channel.close();
            channel.dispose();
        }
    }
    /**
     * @method _unregisterChannel
     * @param channel
     * @private
     */
    _unregisterChannel(channel) {
        debugLog("_un-registerChannel channel.hashKey", channel.hashKey);
        if (!this._channels.hasOwnProperty(channel.hashKey)) {
            return;
        }
        node_opcua_assert_1.assert(this._channels.hasOwnProperty(channel.hashKey), "channel is not registered");
        /**
         * @event closeChannel
         * @param channel
         */
        this.emit("closeChannel", channel);
        // keep trace of statistics data from old channel for our own accumulated stats.
        this.bytesWrittenInOldChannels += channel.bytesWritten;
        this.bytesReadInOldChannels += channel.bytesRead;
        this.transactionsCountOldChannels += channel.transactionsCount;
        delete this._channels[channel.hashKey];
        // istanbul ignore next
        if (doDebug) {
            this._dump_statistics();
            debugLog("un-registering channel  - Count = ", this.currentChannelCount);
        }
        /// channel.dispose();
    }
    _end_listen(err) {
        node_opcua_assert_1.assert(_.isFunction(this._listen_callback));
        this._listen_callback(err);
        this._listen_callback = null;
    }
    /**
     *  shutdown_channel
     * @param channel
     * @param inner_callback
     */
    shutdown_channel(channel, inner_callback) {
        node_opcua_assert_1.assert(_.isFunction(inner_callback));
        channel.once("close", () => {
            // xx console.log(" ON CLOSED !!!!");
        });
        channel.close(() => {
            this._unregisterChannel(channel);
            setImmediate(inner_callback);
        });
    }
    /**
     * @private
     */
    _prevent_DDOS_Attack(establish_connection) {
        const nbConnections = this.activeChannelCount;
        if (nbConnections >= this.maxConnections) {
            // istanbul ignore next
            if (doDebug) {
                console.log(chalk_1.default.bgRed.white("PREVENTING DOS ATTACK => Closing unused channels"));
            }
            const unused_channels = _.filter(this.getChannels(), (channel1) => {
                return !channel1.isOpened && !channel1.hasSession;
            });
            if (unused_channels.length === 0) {
                // all channels are in used , we cannot get any
                // istanbul ignore next
                if (doDebug) {
                    console.log("  - all channel are used !!!!");
                    dumpChannelInfo(this.getChannels());
                }
                setImmediate(establish_connection);
                return;
            }
            // istanbul ignore next
            if (doDebug) {
                console.log("   - Unused channels that can be clobbered", _.map(unused_channels, (channel1) => channel1.hashKey).join(" "));
            }
            const channel = unused_channels[0];
            channel.close(() => {
                // istanbul ignore next
                if (doDebug) {
                    console.log("   _ Unused channel has been closed ", channel.hashKey);
                }
                this._unregisterChannel(channel);
                establish_connection();
            });
        }
        else {
            setImmediate(establish_connection);
        }
    }
}
exports.OPCUAServerEndPoint = OPCUAServerEndPoint;
/**
 * @private
 */
function _makeEndpointDescription(options) {
    node_opcua_assert_1.assert(_.isFinite(options.port), "expecting a valid port number");
    node_opcua_assert_1.assert(options.hasOwnProperty("serverCertificateChain"));
    node_opcua_assert_1.assert(!options.hasOwnProperty("serverCertificate"));
    node_opcua_assert_1.assert(!!options.securityMode); // s.MessageSecurityMode
    node_opcua_assert_1.assert(!!options.securityPolicy);
    node_opcua_assert_1.assert(_.isObject(options.server));
    node_opcua_assert_1.assert(!!options.hostname && (typeof options.hostname === "string"));
    node_opcua_assert_1.assert(_.isBoolean(options.restricted));
    options.securityLevel = (options.securityLevel === undefined) ? 3 : options.securityLevel;
    node_opcua_assert_1.assert(_.isFinite(options.securityLevel), "expecting a valid securityLevel");
    const securityPolicyUri = node_opcua_secure_channel_1.toURI(options.securityPolicy);
    const userIdentityTokens = [];
    if (options.securityPolicy === node_opcua_secure_channel_1.SecurityPolicy.None) {
        if (options.allowUnsecurePassword) {
            userIdentityTokens.push({
                policyId: "username_unsecure",
                tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
                issuedTokenType: null,
                issuerEndpointUrl: null,
                securityPolicyUri: null
            });
        }
        userIdentityTokens.push({
            policyId: "username_basic256",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic256
        });
        userIdentityTokens.push({
            policyId: "username_basic128",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic128Rsa15
        });
        userIdentityTokens.push({
            policyId: "username_basic256Sha256",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic256Sha256
        });
        userIdentityTokens.push({
            policyId: "certificate_basic256Sha256",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.Certificate,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic256Sha256
        });
        // X509
        userIdentityTokens.push({
            policyId: "certificate_basic256",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic256
        });
        userIdentityTokens.push({
            policyId: "certificate_basic128",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic128Rsa15
        });
        userIdentityTokens.push({
            policyId: "certificate_basic256Sha256",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic256Sha256
        });
        userIdentityTokens.push({
            policyId: "certificate_basic256Sha256",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.Certificate,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: node_opcua_secure_channel_1.SecurityPolicy.Basic256Sha256
        });
    }
    else {
        // note:
        //  when channel session security is not "None",
        //  userIdentityTokens can be left to null.
        //  in this case this mean that secure policy will be the same as connection security policy
        userIdentityTokens.push({
            policyId: "usernamePassword",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.UserName,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: null
        });
        userIdentityTokens.push({
            policyId: "certificateX509",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.Certificate,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: null
        });
    }
    if (options.allowAnonymous) {
        userIdentityTokens.push({
            policyId: "anonymous",
            tokenType: node_opcua_service_endpoints_1.UserTokenType.Anonymous,
            issuedTokenType: null,
            issuerEndpointUrl: null,
            securityPolicyUri: null
        });
    }
    // return the endpoint object
    const endpoint = new node_opcua_service_endpoints_2.EndpointDescription({
        endpointUrl: options.endpointUrl,
        server: undefined,
        serverCertificate: options.serverCertificateChain,
        securityMode: options.securityMode,
        securityPolicyUri,
        userIdentityTokens,
        securityLevel: options.securityLevel,
        transportProfileUri: default_transportProfileUri
    });
    endpoint.__defineGetter__("endpointUrl", () => {
        return node_opcua_hostname_1.resolveFullyQualifiedDomainName(options.endpointUrl);
    });
    endpoint.server = options.server;
    endpoint.restricted = options.restricted;
    return endpoint;
}
/**
 * return true if the end point matches security mode and policy
 * @param endpoint
 * @param securityMode
 * @param securityPolicy
 * @internal
 *
 */
function matching_endpoint(securityMode, securityPolicy, endpointUrl, endpoint) {
    node_opcua_assert_1.assert(endpoint instanceof node_opcua_service_endpoints_2.EndpointDescription);
    const endpoint_securityPolicy = node_opcua_secure_channel_1.fromURI(endpoint.securityPolicyUri);
    if (endpointUrl && endpoint.endpointUrl !== endpointUrl) {
        return false;
    }
    return (endpoint.securityMode === securityMode && endpoint_securityPolicy === securityPolicy);
}
const defaultSecurityModes = [
    node_opcua_secure_channel_1.MessageSecurityMode.None,
    node_opcua_secure_channel_1.MessageSecurityMode.Sign,
    node_opcua_secure_channel_1.MessageSecurityMode.SignAndEncrypt
];
const defaultSecurityPolicies = [
    node_opcua_secure_channel_1.SecurityPolicy.Basic128Rsa15,
    node_opcua_secure_channel_1.SecurityPolicy.Basic256,
    // xx UNUSED!!    SecurityPolicy.Basic256Rsa15,
    node_opcua_secure_channel_1.SecurityPolicy.Basic256Sha256
];
class OPCUATCPServerEndPoint extends OPCUAServerEndPoint {
    _setup_server() {
        node_opcua_assert_1.assert(!this._server);
        this._server = net.createServer({ pauseOnConnect: true }, this._on_client_connection.bind(this));
        // xx console.log(" Server with max connections ", self.maxConnections);
        this._server.maxConnections = this.maxConnections + 1; // plus one extra
        this._listen_callback = null;
        this._server.on("connection", (socket) => {
            // istanbul ignore next
            if (doDebug) {
                this._dump_statistics();
                debugLog("server connected  with : " +
                    socket.remoteAddress + ":" + socket.remotePort);
            }
        }).on("close", () => {
            debugLog("server closed : all connections have ended");
        }).on("error", (err) => {
            // this could be because the port is already in use
            debugLog(chalk_1.default.red.bold("server error: "), err.message);
        });
    }
    _on_client_connection(socket) {
        // a client is attempting a connection on the socket
        (socket).setNoDelay(true);
        debugLog("OPCUATCPServerEndPoint#_on_client_connection", this._started);
        if (!this._started) {
            debugLog(chalk_1.default.bgWhite.cyan("OPCUATCPServerEndPoint#_on_client_connection " +
                "SERVER END POINT IS PROBABLY SHUTTING DOWN !!! - Connection is refused"));
            socket.end();
            return;
        }
        const establish_connection = () => {
            const nbConnections = Object.keys(this._channels).length;
            debugLog(" nbConnections ", nbConnections, " self._server.maxConnections", this._server.maxConnections, this.maxConnections);
            if (nbConnections >= this.maxConnections) {
                debugLog(chalk_1.default.bgWhite.cyan("OPCUAServerEndPoint#_on_client_connection " +
                    "The maximum number of connection has been reached - Connection is refused"));
                socket.end();
                socket.destroy();
                return;
            }
            debugLog("OPCUAServerEndPoint._on_client_connection successful => New Channel");
            const channel = new node_opcua_secure_channel_1.ServerSecureChannelLayer({
                defaultSecureTokenLifetime: this.defaultSecureTokenLifetime,
                // objectFactory: this.objectFactory,
                parent: this,
                timeout: this.timeout
            }, new source_1.ServerTCP_transport());
            socket.resume();
            this._preregisterChannel(channel);
            channel.init(socket, (err) => {
                this._un_pre_registerChannel(channel);
                debugLog(chalk_1.default.yellow.bold("Channel#init done"), err);
                if (err) {
                    socket.end();
                }
                else {
                    debugLog("server receiving a client connection");
                    this._registerChannel(channel);
                }
            });
            channel.on("message", (message) => {
                // forward
                this.emit("message", message, channel, this);
            });
        };
        // Each SecureChannel exists until it is explicitly closed or until the last token has expired and the overlap
        // period has elapsed. A Server application should limit the number of SecureChannels.
        // To protect against misbehaving Clients and denial of service attacks, the Server shall close the oldest
        // SecureChannel that has no Session assigned before reaching the maximum number of supported SecureChannels.
        this._prevent_DDOS_Attack(establish_connection);
    }
    _close_server() {
        this._server.close(() => {
            this._started = false;
            debugLog("Connection has been closed !");
        });
    }
    /**
     * @method listen
     * @async
     */
    listen(callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        node_opcua_assert_1.assert(!this._started, "OPCUAServerEndPoint is already listening");
        this._listen_callback = callback;
        this._server.on("error", (err) => {
            debugLog(chalk_1.default.red.bold(" error") + " port = " + this.port, err);
            this._started = false;
            this._end_listen(err);
        });
        this._server.on("listening", () => {
            debugLog("server is listening");
        });
        this._server.listen(this.port, /*"::",*/ (err) => {
            debugLog(chalk_1.default.green.bold("LISTENING TO PORT "), this.port, "err  ", err);
            node_opcua_assert_1.assert(!err, " cannot listen to port ");
            this._started = true;
            this._end_listen();
        });
    }
    _dump_statistics() {
        const self = this;
        self._server.getConnections((err, count) => {
            debugLog(chalk_1.default.cyan("CONCURRENT CONNECTION = "), count);
        });
        debugLog(chalk_1.default.cyan("MAX CONNECTIONS = "), self._server.maxConnections);
    }
    dispose() {
        this._server = undefined;
        super.dispose();
    }
}
exports.OPCUATCPServerEndPoint = OPCUATCPServerEndPoint;
class OPCUAWSServerEndPoint extends OPCUAServerEndPoint {
    listen(callback) {
        node_opcua_assert_1.assert(_.isFunction(callback));
        node_opcua_assert_1.assert(!this._started, "OPCUAWSServerEndPoint is already listening");
        node_opcua_assert_1.assert(!this._server);
        this._server = new WebSocket.Server({
            port: this.port,
            verifyClient: (info) => this._verifyClient(info)
        });
        this._server.setMaxListeners(this.maxConnections + 1); // plus one extra
        this._listen_callback = callback;
        this._server.on("connection", (socket, request) => {
            if (doDebug) {
                this._dump_statistics();
                debugLog("server connected with : " +
                    request.socket.remoteAddress + ":" + request.socket.remotePort);
            }
            this._on_client_connection(socket, request);
        }).on("close", () => {
            debugLog("server closed : all connections have ended");
        }).on("error", (err) => {
            debugLog(chalk_1.default.red.bold(" error") + " port = " + this.port, err);
            this._started = false;
            this._end_listen(err);
        }).on("listening", () => {
            debugLog("server is listening");
        });
        this._started = true;
    }
    _close_server() {
        this._server.close(() => {
            debugLog("Connection has been closed !");
        });
        this._server = undefined;
        this._started = false;
    }
    _setup_server() {
        // nothing to do
    }
    _dump_statistics() {
        throw new Error("Method not implemented.");
    }
    _verifyClient(info) {
        if (!this._started) {
            debugLog(chalk_1.default.bgWhite.cyan("OPCUATCPServerEndPoint#_on_client_connection " +
                "SERVER END POINT IS PROBABLY SHUTTING DOWN !!! - Connection is refused"));
            return false;
        }
        const nbConnections = Object.keys(this._channels).length;
        debugLog(" nbConnections ", nbConnections, " self._server.maxListeners", this._server.getMaxListeners(), this.maxConnections);
        if (nbConnections >= this.maxConnections) {
            return false;
        }
        return true;
    }
    _on_client_connection(socket, request) {
        // a client is attempting a connection on the socket
        debugLog("OPCUATCPServerEndPoint#_on_client_connection", this._started);
        if (!this._started) {
            debugLog(chalk_1.default.bgWhite.cyan("OPCUATCPServerEndPoint#_on_client_connection " +
                "SERVER END POINT IS PROBABLY SHUTTING DOWN !!! - Connection is refused"));
            socket.terminate();
            return;
        }
        const establish_connection = () => {
            const nbConnections = Object.keys(this._channels).length;
            debugLog(" nbConnections ", nbConnections, " self._server.maxListeners", this._server.getMaxListeners(), this.maxConnections);
            if (nbConnections >= this.maxConnections) {
                debugLog(chalk_1.default.bgWhite.cyan("OPCUAServerEndPoint#_on_client_connection " +
                    "The maximum number of connection has been reached - Connection is refused"));
                socket.close(1013 /*try again later */, "The maximum number of connection has been reached - Connection is refused");
                return;
            }
            debugLog("OPCUAServerEndPoint._on_client_connection successful => New Channel");
            const channel = new node_opcua_secure_channel_1.ServerSecureChannelLayer({
                defaultSecureTokenLifetime: this.defaultSecureTokenLifetime,
                // objectFactory: this.objectFactory,
                parent: this,
                timeout: this.timeout
            }, new source_1.ServerWS_transport());
            this._preregisterChannel(channel);
            channel.init(socket, (err) => {
                this._un_pre_registerChannel(channel);
                debugLog(chalk_1.default.yellow.bold("Channel#init done"), err);
                if (err) {
                    socket.terminate();
                }
                else {
                    debugLog("server receiving a client connection");
                    this._registerChannel(channel);
                }
            });
            channel.on("message", (message) => {
                // forward
                this.emit("message", message, channel, this);
            });
        };
        // Each SecureChannel exists until it is explicitly closed or until the last token has expired and the overlap
        // period has elapsed. A Server application should limit the number of SecureChannels.
        // To protect against misbehaving Clients and denial of service attacks, the Server shall close the oldest
        // SecureChannel that has no Session assigned before reaching the maximum number of supported SecureChannels.
        this._prevent_DDOS_Attack(establish_connection);
    }
}
exports.OPCUAWSServerEndPoint = OPCUAWSServerEndPoint;
//# sourceMappingURL=server_end_point.js.map