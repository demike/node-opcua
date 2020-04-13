"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-server
 */
// tslint:disable:no-console
// tslint:disable:max-line-length
// tslint:disable:unified-signatures
const async = require("async");
const chalk_1 = require("chalk");
const crypto = require("crypto");
const _ = require("underscore");
const util_1 = require("util");
const node_opcua_hostname_1 = require("node-opcua-hostname");
const node_opcua_assert_1 = require("node-opcua-assert");
const utils = require("node-opcua-utils");
const node_opcua_address_space_1 = require("node-opcua-address-space");
const node_opcua_certificate_manager_1 = require("node-opcua-certificate-manager");
const node_opcua_common_1 = require("node-opcua-common");
const node_opcua_crypto_1 = require("node-opcua-crypto");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_object_registry_1 = require("node-opcua-object-registry");
const node_opcua_secure_channel_1 = require("node-opcua-secure-channel");
const node_opcua_service_browse_1 = require("node-opcua-service-browse");
const node_opcua_service_call_1 = require("node-opcua-service-call");
const node_opcua_service_endpoints_1 = require("node-opcua-service-endpoints");
const node_opcua_service_history_1 = require("node-opcua-service-history");
const node_opcua_service_node_management_1 = require("node-opcua-service-node-management");
const node_opcua_service_query_1 = require("node-opcua-service-query");
const node_opcua_service_read_1 = require("node-opcua-service-read");
const node_opcua_service_register_node_1 = require("node-opcua-service-register-node");
const node_opcua_service_session_1 = require("node-opcua-service-session");
const node_opcua_service_subscription_1 = require("node-opcua-service-subscription");
const node_opcua_service_translate_browse_path_1 = require("node-opcua-service-translate-browse-path");
const node_opcua_service_write_1 = require("node-opcua-service-write");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_types_1 = require("node-opcua-types");
const node_opcua_variant_1 = require("node-opcua-variant");
const node_opcua_variant_2 = require("node-opcua-variant");
const base_server_1 = require("./base_server");
const factory_1 = require("./factory");
const monitored_item_1 = require("./monitored_item");
const register_server_manager_1 = require("./register_server_manager");
const register_server_manager_hidden_1 = require("./register_server_manager_hidden");
const register_server_manager_mdns_only_1 = require("./register_server_manager_mdns_only");
const server_end_point_1 = require("./server_end_point");
const server_engine_1 = require("./server_engine");
// tslint:disable-next-line:no-var-requires
const package_info = require("../package.json");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const errorLog = node_opcua_debug_1.make_errorLog(__filename);
const warningLog = errorLog;
const default_maxAllowedSessionNumber = 10;
const default_maxConnectionsPerEndpoint = 10;
function g_sendError(channel, message, ResponseClass, statusCode) {
    const response = new ResponseClass({
        responseHeader: { serviceResult: statusCode }
    });
    return channel.send_response("MSG", response, message);
}
const default_build_info = {
    manufacturerName: "Node-OPCUA : MIT Licence ( see http://node-opcua.github.io/)",
    productName: "NODEOPCUA-SERVER",
    productUri: null,
    softwareVersion: package_info.version
    // xx buildDate: fs.statSync(package_json_file).mtime
};
const minSessionTimeout = 100; // 100 milliseconds
const defaultSessionTimeout = 1000 * 30; // 30 seconds
const maxSessionTimeout = 1000 * 60 * 50; // 50 minutes
function _adjust_session_timeout(sessionTimeout) {
    let revisedSessionTimeout = sessionTimeout || defaultSessionTimeout;
    revisedSessionTimeout = Math.min(revisedSessionTimeout, maxSessionTimeout);
    revisedSessionTimeout = Math.max(revisedSessionTimeout, minSessionTimeout);
    return revisedSessionTimeout;
}
function channel_has_session(channel, session) {
    if (session.channel === channel) {
        node_opcua_assert_1.assert(channel.sessionTokens.hasOwnProperty(session.authenticationToken.toString()));
        return true;
    }
    return false;
}
function moveSessionToChannel(session, channel) {
    debugLog("moveSessionToChannel sessionId", session.nodeId, " channelId=", channel.channelId);
    if (session.publishEngine) {
        session.publishEngine.cancelPendingPublishRequestBeforeChannelChange();
    }
    session._detach_channel();
    session._attach_channel(channel);
    node_opcua_assert_1.assert(session.channel.channelId === channel.channelId);
}
function _attempt_to_close_some_old_unactivated_session(server) {
    const session = server.engine.getOldestUnactivatedSession();
    if (session) {
        server.engine.closeSession(session.authenticationToken, false, "Forcing");
    }
}
function getRequiredEndpointInfo(endpoint) {
    node_opcua_assert_1.assert(endpoint instanceof node_opcua_types_1.EndpointDescription);
    // It is recommended that Servers only include the endpointUrl, securityMode,
    // securityPolicyUri, userIdentityTokens, transportProfileUri and securityLevel with all
    // other parameters set to null. Only the recommended parameters shall be verified by
    // the client.
    const e = new node_opcua_types_1.EndpointDescription({
        endpointUrl: endpoint.endpointUrl,
        securityLevel: endpoint.securityLevel,
        securityMode: endpoint.securityMode,
        securityPolicyUri: endpoint.securityPolicyUri,
        transportProfileUri: endpoint.transportProfileUri,
        userIdentityTokens: endpoint.userIdentityTokens
    });
    // reduce even further by explicitly setting unwanted members to null
    e.server = null;
    e.serverCertificate = null;
    return e;
}
// serverUri  String This value is only specified if the EndpointDescription has a gatewayServerUri.
//            This value is the applicationUri from the EndpointDescription which is the applicationUri for the
//            underlying Server. The type EndpointDescription is defined in 7.10.
function _serverEndpointsForCreateSessionResponse(server, serverUri) {
    serverUri = ""; // unused then
    // The Server shall return a set of EndpointDescriptions available for the serverUri specified in the request.
    // It is recommended that Servers only include the endpointUrl, securityMode,
    // securityPolicyUri, userIdentityTokens, transportProfileUri and securityLevel with all other parameters
    // set to null. Only the recommended parameters shall be verified by the client.
    return server._get_endpoints()
        // xx .filter(onlyforUri.bind(null,serverUri)
        .map(getRequiredEndpointInfo);
}
function adjustSecurityPolicy(channel, userTokenPolicy_securityPolicyUri) {
    // check that userIdentityToken
    let securityPolicy = node_opcua_secure_channel_1.fromURI(userTokenPolicy_securityPolicyUri);
    // if the security policy is not specified we use the session security policy
    if (securityPolicy === node_opcua_secure_channel_1.SecurityPolicy.Invalid) {
        securityPolicy = node_opcua_secure_channel_1.fromURI(channel.clientSecurityHeader.securityPolicyUri);
        node_opcua_assert_1.assert(securityPolicy !== node_opcua_secure_channel_1.SecurityPolicy.Invalid);
    }
    return securityPolicy;
}
function findUserTokenByPolicy(endpoint_description, policyId) {
    node_opcua_assert_1.assert(endpoint_description instanceof node_opcua_types_1.EndpointDescription);
    const r = _.filter(endpoint_description.userIdentityTokens, (userIdentity) => {
        node_opcua_assert_1.assert(userIdentity.tokenType !== undefined);
        return userIdentity.policyId === policyId;
    });
    return r.length === 0 ? null : r[0];
}
function findUserTokenPolicy(endpoint_description, userTokenType) {
    node_opcua_assert_1.assert(endpoint_description instanceof node_opcua_types_1.EndpointDescription);
    const r = _.filter(endpoint_description.userIdentityTokens, (userIdentity) => {
        node_opcua_assert_1.assert(userIdentity.tokenType !== undefined);
        return userIdentity.tokenType === userTokenType;
    });
    return r.length === 0 ? null : r[0];
}
function createAnonymousIdentityToken(endpoint_desc) {
    node_opcua_assert_1.assert(endpoint_desc instanceof node_opcua_types_1.EndpointDescription);
    const userTokenPolicy = findUserTokenPolicy(endpoint_desc, node_opcua_service_endpoints_1.UserTokenType.Anonymous);
    if (!userTokenPolicy) {
        throw new Error("Cannot find ANONYMOUS user token policy in end point description");
    }
    return new node_opcua_service_session_1.AnonymousIdentityToken({ policyId: userTokenPolicy.policyId });
}
function sameIdentityToken(token1, token2) {
    if (token1 instanceof node_opcua_service_session_1.UserNameIdentityToken) {
        if (!(token2 instanceof node_opcua_service_session_1.UserNameIdentityToken)) {
            return false;
        }
        if (token1.userName !== token2.userName) {
            return false;
        }
        if (token1.password.toString("hex") !== token2.password.toString("hex")) {
            return false;
        }
    }
    else if (token1 instanceof node_opcua_service_session_1.AnonymousIdentityToken) {
        if (!(token2 instanceof node_opcua_service_session_1.AnonymousIdentityToken)) {
            return false;
        }
        if (token1.policyId !== token2.policyId) {
            return false;
        }
        return true;
    }
    node_opcua_assert_1.assert(false, " Not implemented yet");
    return false;
}
function thumbprint(certificate) {
    return certificate ? certificate.toString("base64") : "";
}
/*=== private
 *
 * perform the read operation on a given node for a monitored item.
 * this method DOES NOT apply to Variable Values attribute
 *
 * @param self
 * @param oldValue
 * @param node
 * @param itemToMonitor
 * @private
 */
function monitoredItem_read_and_record_value(self, context, oldValue, node, itemToMonitor, callback) {
    node_opcua_assert_1.assert(self instanceof monitored_item_1.MonitoredItem);
    node_opcua_assert_1.assert(oldValue instanceof node_opcua_data_value_1.DataValue);
    node_opcua_assert_1.assert(itemToMonitor.attributeId === node_opcua_data_model_1.AttributeIds.Value);
    const dataValue = node.readAttribute(context, itemToMonitor.attributeId, itemToMonitor.indexRange, itemToMonitor.dataEncoding);
    callback(null, dataValue);
}
/*== private
 * @method monitoredItem_read_and_record_value_async
 * this method applies to Variable Values attribute
 * @param self
 * @param oldValue
 * @param node
 * @param itemToMonitor
 * @private
 */
function monitoredItem_read_and_record_value_async(self, context, oldValue, node, itemToMonitor, callback) {
    node_opcua_assert_1.assert(context instanceof node_opcua_address_space_1.SessionContext);
    node_opcua_assert_1.assert(itemToMonitor.attributeId === node_opcua_data_model_1.AttributeIds.Value);
    node_opcua_assert_1.assert(self instanceof monitored_item_1.MonitoredItem);
    node_opcua_assert_1.assert(oldValue instanceof node_opcua_data_value_1.DataValue);
    // do it asynchronously ( this is only valid for value attributes )
    node_opcua_assert_1.assert(itemToMonitor.attributeId === node_opcua_data_model_1.AttributeIds.Value);
    node.readValueAsync(context, (err, dataValue) => {
        callback(err, dataValue);
    });
}
function build_scanning_node_function(context, addressSpace, monitoredItem, itemToMonitor) {
    node_opcua_assert_1.assert(context instanceof node_opcua_address_space_1.SessionContext);
    node_opcua_assert_1.assert(itemToMonitor instanceof node_opcua_service_read_1.ReadValueId);
    const node = addressSpace.findNode(itemToMonitor.nodeId);
    /* istanbul ignore next */
    if (!node) {
        errorLog(" INVALID NODE ID  , ", itemToMonitor.nodeId.toString());
        node_opcua_debug_1.dump(itemToMonitor);
        return (oldData, callback) => {
            callback(null, new node_opcua_data_value_1.DataValue({
                statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdUnknown,
                value: { dataType: node_opcua_variant_1.DataType.Null, value: 0 }
            }));
        };
    }
    ///// !!monitoredItem.setNode(node);
    if (itemToMonitor.attributeId === node_opcua_data_model_1.AttributeIds.Value) {
        const monitoredItem_read_and_record_value_func = (itemToMonitor.attributeId === node_opcua_data_model_1.AttributeIds.Value && _.isFunction(node.readValueAsync)) ?
            monitoredItem_read_and_record_value_async :
            monitoredItem_read_and_record_value;
        return function (oldDataValue, callback) {
            node_opcua_assert_1.assert(this instanceof monitored_item_1.MonitoredItem);
            node_opcua_assert_1.assert(oldDataValue instanceof node_opcua_data_value_1.DataValue);
            node_opcua_assert_1.assert(_.isFunction(callback));
            monitoredItem_read_and_record_value_func(this, context, oldDataValue, node, itemToMonitor, callback);
        };
    }
    else {
        // Attributes, other than the  Value  Attribute, are only monitored for a change in value.
        // The filter is not used for these  Attributes. Any change in value for these  Attributes
        // causes a  Notification  to be  generated.
        // only record value when it has changed
        return function (oldDataValue, callback) {
            const self = this;
            node_opcua_assert_1.assert(self instanceof monitored_item_1.MonitoredItem);
            node_opcua_assert_1.assert(oldDataValue instanceof node_opcua_data_value_1.DataValue);
            node_opcua_assert_1.assert(_.isFunction(callback));
            const newDataValue = node.readAttribute(null, itemToMonitor.attributeId);
            callback(null, newDataValue);
        };
    }
}
function prepareMonitoredItem(context, addressSpace, monitoredItem) {
    const itemToMonitor = monitoredItem.itemToMonitor;
    const readNodeFunc = build_scanning_node_function(context, addressSpace, monitoredItem, itemToMonitor);
    monitoredItem.samplingFunc = readNodeFunc;
}
function isMonitoringModeValid(monitoringMode) {
    node_opcua_assert_1.assert(node_opcua_types_1.MonitoringMode.Invalid !== undefined);
    return monitoringMode !== node_opcua_types_1.MonitoringMode.Invalid &&
        monitoringMode <= node_opcua_types_1.MonitoringMode.Reporting;
}
/**
 * @method registerServer
 * @async
 * @param discoveryServerEndpointUrl
 * @param isOnline
 * @param outer_callback
 */
function _registerServer(discoveryServerEndpointUrl, isOnline, outer_callback) {
    node_opcua_assert_1.assert(typeof discoveryServerEndpointUrl === "string");
    node_opcua_assert_1.assert(_.isBoolean(isOnline));
    const self = this;
    if (!self.registerServerManager) {
        throw new Error("Internal Error");
    }
    self.registerServerManager.discoveryServerEndpointUrl = discoveryServerEndpointUrl;
    if (isOnline) {
        self.registerServerManager.start(outer_callback);
    }
    else {
        self.registerServerManager.stop(outer_callback);
    }
}
function _installRegisterServerManager(self) {
    node_opcua_assert_1.assert(self instanceof OPCUAServer);
    node_opcua_assert_1.assert(!self.registerServerManager);
    /* istanbul ignore next */
    if (!self.registerServerMethod) {
        throw new Error("Internal Error");
    }
    switch (self.registerServerMethod) {
        case RegisterServerMethod.HIDDEN:
            self.registerServerManager = new register_server_manager_hidden_1.RegisterServerManagerHidden({
                server: self
            });
            break;
        case RegisterServerMethod.MDNS:
            self.registerServerManager = new register_server_manager_mdns_only_1.RegisterServerManagerMDNSONLY({
                server: self
            });
            break;
        case RegisterServerMethod.LDS:
            self.registerServerManager = new register_server_manager_1.RegisterServerManager({
                discoveryServerEndpointUrl: self.discoveryServerEndpointUrl,
                server: self
            });
            break;
        /* istanbul ignore next */
        default:
            throw new Error("Invalid switch");
    }
    self.registerServerManager.on("serverRegistrationPending", () => {
        /**
         * emitted when the server is trying to registered the LDS
         * but when the connection to the lds has failed
         * serverRegistrationPending is sent when the backoff signal of the
         * connection process is raised
         * @event serverRegistrationPending
         */
        debugLog("serverRegistrationPending");
        self.emit("serverRegistrationPending");
    });
    self.registerServerManager.on("serverRegistered", () => {
        /**
         * emitted when the server is successfully registered to the LDS
         * @event serverRegistered
         */
        debugLog("serverRegistered");
        self.emit("serverRegistered");
    });
    self.registerServerManager.on("serverRegistrationRenewed", () => {
        /**
         * emitted when the server has successfully renewed its registration to the LDS
         * @event serverRegistrationRenewed
         */
        debugLog("serverRegistrationRenewed");
        self.emit("serverRegistrationRenewed");
    });
    self.registerServerManager.on("serverUnregistered", () => {
        debugLog("serverUnregistered");
        /**
         * emitted when the server is successfully unregistered to the LDS
         * ( for instance during shutdown)
         * @event serverUnregistered
         */
        self.emit("serverUnregistered");
    });
}
var RegisterServerMethod;
(function (RegisterServerMethod) {
    RegisterServerMethod[RegisterServerMethod["HIDDEN"] = 1] = "HIDDEN";
    RegisterServerMethod[RegisterServerMethod["MDNS"] = 2] = "MDNS";
    RegisterServerMethod[RegisterServerMethod["LDS"] = 3] = "LDS"; // the server registers itself to the LDS or LDS-ME (Local Discovery Server)
})(RegisterServerMethod = exports.RegisterServerMethod || (exports.RegisterServerMethod = {}));
var TransportType;
(function (TransportType) {
    TransportType[TransportType["TCP"] = 1] = "TCP";
    TransportType[TransportType["WEBSOCKET"] = 2] = "WEBSOCKET";
})(TransportType = exports.TransportType || (exports.TransportType = {}));
/**
 *
 */
class OPCUAServer extends base_server_1.OPCUABaseServer {
    constructor(options) {
        super(options);
        /**
         * false if anonymouse connection are not allowed
         */
        this.allowAnonymous = false;
        this.protocolVersion = 0;
        options = options || {};
        this.options = options;
        options.transportType = options.transportType || TransportType.TCP;
        /**
         * @property maxAllowedSessionNumber
         */
        this.maxAllowedSessionNumber = options.maxAllowedSessionNumber || default_maxAllowedSessionNumber;
        /**
         * @property maxConnectionsPerEndpoint
         */
        this.maxConnectionsPerEndpoint = options.maxConnectionsPerEndpoint || default_maxConnectionsPerEndpoint;
        // build Info
        let buildInfo = _.clone(default_build_info);
        buildInfo = _.extend(buildInfo, options.buildInfo);
        // repair product name
        buildInfo.productUri = buildInfo.productUri || this.serverInfo.productUri;
        this.serverInfo.productUri = this.serverInfo.productUri || buildInfo.productUri;
        this.userManager = options.userManager || {};
        if (!_.isFunction(this.userManager.isValidUser)) {
            this.userManager.isValidUser = ( /*userName,password*/) => {
                return false;
            };
        }
        this.nonce = this.makeServerNonce();
        this.protocolVersion = 0;
        options.allowAnonymous = (options.allowAnonymous === undefined) ? true : !!options.allowAnonymous;
        /**
         * @property allowAnonymous
         */
        this.allowAnonymous = options.allowAnonymous;
        this.discoveryServerEndpointUrl = options.discoveryServerEndpointUrl || "opc.tcp://%FQDN%:4840";
        node_opcua_assert_1.assert(typeof this.discoveryServerEndpointUrl === "string");
        this.serverInfo.applicationType = node_opcua_service_endpoints_1.ApplicationType.Server;
        this.capabilitiesForMDNS = options.capabilitiesForMDNS || ["NA"];
        this.registerServerMethod = options.registerServerMethod || RegisterServerMethod.HIDDEN;
        _installRegisterServerManager(this);
        if (!options.userCertificateManager) {
            this.userCertificateManager = new node_opcua_certificate_manager_1.OPCUACertificateManager({
                name: "UserPKI"
            });
        }
        else {
            this.userCertificateManager = options.userCertificateManager;
        }
        // note: we need to delay initialization of endpoint as certain resources
        // such as %FQDN% might not be ready yet at this stage
        this._delayInit = () => {
            /* istanbul ignore next */
            if (!options) {
                throw new Error("Internal Error");
            }
            // to check => this.serverInfo.applicationName = this.serverInfo.productName || buildInfo.productName;
            // note: applicationUri is handled in a special way
            this.engine = new server_engine_1.ServerEngine({
                applicationUri: () => this.serverInfo.applicationUri,
                buildInfo,
                isAuditing: options.isAuditing,
                serverCapabilities: options.serverCapabilities
            });
            this.objectFactory = new factory_1.Factory(this.engine);
            const endpointDefinitions = options.alternateEndpoints || [];
            endpointDefinitions.push({
                port: options.port || 26543,
                allowAnonymous: options.allowAnonymous,
                alternateHostname: options.alternateHostname,
                disableDiscovery: options.disableDiscovery,
                securityModes: options.securityModes,
                securityPolicies: options.securityPolicies
            });
            // todo  should self.serverInfo.productUri  match self.engine.buildInfo.productUri ?
            const createEndpoint = (port1, transportType, options1) => {
                // add the tcp/ip endpoint with no security
                let transportConstructor = (transportType === TransportType.TCP) ? server_end_point_1.OPCUATCPServerEndPoint : server_end_point_1.OPCUAWSServerEndPoint;
                const endPoint = new transportConstructor({
                    port: port1,
                    certificateManager: this.serverCertificateManager,
                    certificateChain: this.getCertificateChain(),
                    privateKey: this.getPrivateKey(),
                    defaultSecureTokenLifetime: options1.defaultSecureTokenLifetime || 600000,
                    timeout: options1.timeout || 10000,
                    maxConnections: this.maxConnectionsPerEndpoint,
                    objectFactory: this.objectFactory,
                    serverInfo: this.serverInfo
                });
                return endPoint;
            };
            function createEndpointDescriptions(options2) {
                /* istanbul ignore next */
                if (!options) {
                    throw new Error("internal error");
                }
                /* istanbul ignore next */
                if (!options2.hasOwnProperty("port") || !_.isFinite(options2.port)) {
                    throw new Error("expecting a valid port");
                }
                const port = options2.port + 0;
                options2.transportType = options2.transportType || TransportType.TCP;
                const endPoint = createEndpoint(port, options2.transportType, options);
                options2.alternateHostname = options2.alternateHostname || [];
                const alternateHostname = (options2.alternateHostname instanceof Array) ? options2.alternateHostname : [options2.alternateHostname];
                const allowAnonymous = (options2.allowAnonymous === undefined) ? true : !!options2.allowAnonymous;
                endPoint.addStandardEndpointDescriptions({
                    allowAnonymous,
                    securityModes: options2.securityModes,
                    securityPolicies: options2.securityPolicies,
                    alternateHostname,
                    disableDiscovery: !!options2.disableDiscovery,
                    // xx                hostname,
                    resourcePath: options.resourcePath || ""
                });
                return endPoint;
            }
            for (const eee of endpointDefinitions) {
                const endPoint = createEndpointDescriptions(eee);
                this.endpoints.push(endPoint);
                endPoint.on("message", (message, channel) => {
                    this.on_request(message, channel);
                });
                endPoint.on("error", (err) => {
                    errorLog("OPCUAServer endpoint error", err);
                    // set serverState to ServerState.Failed;
                    this.engine.setServerState(node_opcua_common_1.ServerState.Failed);
                    this.shutdown(() => {
                        /* empty */
                    });
                });
            }
        };
    }
    /**
     * total number of bytes written  by the server since startup
     */
    get bytesWritten() {
        return this.endpoints.reduce((accumulated, endpoint) => {
            return accumulated + endpoint.bytesWritten;
        }, 0);
    }
    /**
     * total number of bytes read  by the server since startup
     */
    get bytesRead() {
        return this.endpoints.reduce((accumulated, endpoint) => {
            return accumulated + endpoint.bytesRead;
        }, 0);
    }
    /**
     * Number of transactions processed by the server since startup
     */
    get transactionsCount() {
        return this.endpoints.reduce((accumulated, endpoint) => {
            return accumulated + endpoint.transactionsCount;
        }, 0);
    }
    /**
     * The server build info
     */
    get buildInfo() {
        return this.engine.buildInfo;
    }
    /**
     * the number of connected channel on all existing end points
     */
    get currentChannelCount() {
        // TODO : move to base
        const self = this;
        return self.endpoints.reduce((currentValue, endPoint) => {
            return currentValue + endPoint.currentChannelCount;
        }, 0);
    }
    /**
     * The number of active subscriptions from all sessions
     */
    get currentSubscriptionCount() {
        return this.engine ? this.engine.currentSubscriptionCount : 0;
    }
    /**
     * the number of session activation requests that have been rejected
     */
    get rejectedSessionCount() {
        return this.engine ? this.engine.rejectedSessionCount : 0;
    }
    /**
     * the number of request that have been rejected
     */
    get rejectedRequestsCount() {
        return this.engine ? this.engine.rejectedRequestsCount : 0;
    }
    /**
     * the number of sessions that have been aborted
     */
    get sessionAbortCount() {
        return this.engine ? this.engine.sessionAbortCount : 0;
    }
    /**
     * the publishing interval count
     */
    get publishingIntervalCount() {
        return this.engine ? this.engine.publishingIntervalCount : 0;
    }
    /**
     * the number of sessions currently active
     */
    get currentSessionCount() {
        return this.engine ? this.engine.currentSessionCount : 0;
    }
    /**
     * true if the server has been initialized
     *
     */
    get initialized() {
        return this.engine && this.engine.addressSpace !== null;
    }
    /**
     * is the server auditing ?
     */
    get isAuditing() {
        return this.engine ? this.engine.isAuditing : false;
    }
    initialize(...args) {
        const done = args[0];
        node_opcua_assert_1.assert(!this.initialized, "server is already initialized"); // already initialized ?
        util_1.callbackify(node_opcua_hostname_1.extractFullyQualifiedDomainName)((err) => {
            /* istanbul ignore else */
            if (this._delayInit) {
                this._delayInit();
                this._delayInit = undefined;
            }
            OPCUAServer.registry.register(this);
            this.engine.initialize(this.options, () => {
                setImmediate(() => {
                    this.emit("post_initialize");
                    done();
                });
            });
        });
    }
    start(...args) {
        const done = args[0];
        const self = this;
        const tasks = [];
        tasks.push(util_1.callbackify(node_opcua_hostname_1.extractFullyQualifiedDomainName));
        if (!self.initialized) {
            tasks.push((callback) => {
                self.initialize(callback);
            });
        }
        tasks.push((callback) => {
            base_server_1.OPCUABaseServer.prototype.start.call(self, (err) => {
                if (err) {
                    self.shutdown((/*err2*/ err2) => {
                        callback(err);
                    });
                }
                else {
                    // we start the registration process asynchronously
                    // as we want to make server immediately available
                    self.registerServerManager.start(() => {
                        /* empty */
                    });
                    setImmediate(callback);
                }
            });
        });
        async.series(tasks, done);
    }
    shutdown(...args) {
        const timeout = (args.length === 1) ? 1000 : args[0];
        const callback = (args.length === 1 ? args[0] : args[1]);
        node_opcua_assert_1.assert(_.isFunction(callback));
        debugLog("OPCUAServer#shutdown (timeout = ", timeout, ")");
        /* istanbul ignore next */
        if (!this.engine) {
            return callback();
        }
        node_opcua_assert_1.assert(this.engine);
        if (!this.engine.serverStatus) {
            // server may have been shot down already  , or may have fail to start !!
            const err = new Error("OPCUAServer#shutdown failure ! server doesn't seems to be started yet");
            return callback(err);
        }
        this.engine.setServerState(node_opcua_common_1.ServerState.Shutdown);
        debugLog("OPCUServer is now unregistering itself from  the discovery server " + this.buildInfo);
        this.registerServerManager.stop((err) => {
            debugLog("OPCUServer unregistered from discovery server", err);
            setTimeout(() => {
                this.engine.shutdown();
                debugLog("OPCUAServer#shutdown: started");
                base_server_1.OPCUABaseServer.prototype.shutdown.call(this, (err1) => {
                    debugLog("OPCUAServer#shutdown: completed");
                    this.dispose();
                    callback(err1);
                });
            }, timeout);
        });
    }
    dispose() {
        for (const endpoint of this.endpoints) {
            endpoint.dispose();
        }
        this.endpoints = [];
        this.removeAllListeners();
        if (this.registerServerManager) {
            this.registerServerManager.dispose();
            this.registerServerManager = undefined;
        }
        OPCUAServer.registry.unregister(this);
        /* istanbul ignore next */
        if (this.engine) {
            this.engine.dispose();
        }
    }
    raiseEvent(eventType, options) {
        /* istanbul ignore next */
        if (!this.engine.addressSpace) {
            errorLog("addressSpace missing");
            return;
        }
        const server = this.engine.addressSpace.findNode("Server");
        /* istanbul ignore next */
        if (!server) {
            // xx throw new Error("OPCUAServer#raiseEvent : cannot find Server object");
            return;
        }
        let eventTypeNode = eventType;
        if (typeof (eventType) === "string") {
            eventTypeNode = this.engine.addressSpace.findEventType(eventType);
        }
        /* istanbul ignore else */
        if (eventTypeNode) {
            return server.raiseEvent(eventTypeNode, options);
        }
        else {
            console.warn(" cannot find event type ", eventType);
        }
    }
    /**
     * create and register a new session
     * @internal
     */
    createSession(options) {
        /* istanbul ignore next */
        if (!this.engine) {
            throw new Error("Internal Error");
        }
        return this.engine.createSession(options);
    }
    /**
     * retrieve a session by authentication token
     * @internal
     */
    getSession(authenticationToken, activeOnly) {
        return this.engine ? this.engine.getSession(authenticationToken, activeOnly) : null;
    }
    /**
     *
     * @param channel
     * @param clientCertificate
     * @param clientNonce
     * @internal
     */
    computeServerSignature(channel, clientCertificate, clientNonce) {
        return node_opcua_secure_channel_1.computeSignature(clientCertificate, clientNonce, this.getPrivateKey(), channel.messageBuilder.securityPolicy);
    }
    /**
     *
     * @param session
     * @param channel
     * @param clientSignature
     * @internal
     */
    verifyClientSignature(session, channel, clientSignature) {
        const clientCertificate = channel.receiverCertificate;
        const securityPolicy = channel.messageBuilder.securityPolicy;
        const serverCertificateChain = this.getCertificateChain();
        const result = node_opcua_secure_channel_1.verifySignature(serverCertificateChain, session.nonce, clientSignature, clientCertificate, securityPolicy);
        return result;
    }
    isValidUserNameIdentityToken(channel, session, userTokenPolicy, userIdentityToken, userTokenSignature, callback) {
        node_opcua_assert_1.assert(userIdentityToken instanceof node_opcua_service_session_1.UserNameIdentityToken);
        const securityPolicy = adjustSecurityPolicy(channel, userTokenPolicy.securityPolicyUri);
        if (securityPolicy === node_opcua_secure_channel_1.SecurityPolicy.None) {
            return callback(null, node_opcua_status_code_1.StatusCodes.Good);
        }
        const cryptoFactory = node_opcua_secure_channel_1.getCryptoFactory(securityPolicy);
        /* istanbul ignore next */
        if (!cryptoFactory) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadSecurityPolicyRejected);
        }
        /* istanbul ignore next */
        if (userIdentityToken.encryptionAlgorithm !== cryptoFactory.asymmetricEncryptionAlgorithm) {
            errorLog("invalid encryptionAlgorithm");
            errorLog("userTokenPolicy", userTokenPolicy.toString());
            errorLog("userTokenPolicy", userIdentityToken.toString());
            return callback(null, node_opcua_status_code_1.StatusCodes.BadIdentityTokenInvalid);
        }
        const userName = userIdentityToken.userName;
        const password = userIdentityToken.password;
        if (!userName || !password) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadIdentityTokenInvalid);
        }
        return callback(null, node_opcua_status_code_1.StatusCodes.Good);
    }
    isValidX509IdentityToken(channel, session, userTokenPolicy, userIdentityToken, userTokenSignature, callback) {
        node_opcua_assert_1.assert(userIdentityToken instanceof node_opcua_service_session_1.X509IdentityToken);
        node_opcua_assert_1.assert(callback instanceof Function);
        const securityPolicy = adjustSecurityPolicy(channel, userTokenPolicy.securityPolicyUri);
        const cryptoFactory = node_opcua_secure_channel_1.getCryptoFactory(securityPolicy);
        /* istanbul ignore next */
        if (!cryptoFactory) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadSecurityPolicyRejected);
        }
        if (!userTokenSignature || !userTokenSignature.signature) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadUserSignatureInvalid);
        }
        if (userIdentityToken.policyId !== userTokenPolicy.policyId) {
            errorLog("invalid encryptionAlgorithm");
            errorLog("userTokenPolicy", userTokenPolicy.toString());
            errorLog("userTokenPolicy", userIdentityToken.toString());
            return callback(null, node_opcua_status_code_1.StatusCodes.BadSecurityPolicyRejected);
        }
        const certificate = userIdentityToken.certificateData /* as Certificate*/;
        const nonce = session.nonce;
        const serverCertificate = this.getCertificate();
        node_opcua_assert_1.assert(serverCertificate instanceof Buffer);
        node_opcua_assert_1.assert(certificate instanceof Buffer, "expecting certificate to be a Buffer");
        node_opcua_assert_1.assert(nonce instanceof Buffer, "expecting nonce to be a Buffer");
        node_opcua_assert_1.assert(userTokenSignature.signature instanceof Buffer, "expecting userTokenSignature to be a Buffer");
        // verify proof of possession by checking certificate signature & server nonce correctness
        if (!node_opcua_secure_channel_1.verifySignature(serverCertificate, nonce, userTokenSignature, certificate, securityPolicy)) {
            return callback(null, node_opcua_status_code_1.StatusCodes.BadUserSignatureInvalid);
        }
        // verify if certificate is Valid
        this.userCertificateManager.checkCertificate(certificate, (err, certificateStatus) => {
            /* istanbul ignore next */
            if (err) {
                return callback(err);
            }
            if (node_opcua_status_code_1.StatusCodes.Good !== certificateStatus) {
                node_opcua_assert_1.assert(certificateStatus instanceof node_opcua_status_code_1.StatusCode);
                return callback(null, certificateStatus);
            }
            // verify if certificate is truster or rejected
            // todo: StatusCodes.BadCertificateUntrusted
            // store untrusted certificate to rejected folder
            // todo:
            return callback(null, node_opcua_status_code_1.StatusCodes.Good);
        });
    }
    /**
     * @internal
     */
    userNameIdentityTokenAuthenticateUser(channel, session, userTokenPolicy, userIdentityToken, callback) {
        node_opcua_assert_1.assert(userIdentityToken instanceof node_opcua_service_session_1.UserNameIdentityToken);
        // assert(this.isValidUserNameIdentityToken(channel, session, userTokenPolicy, userIdentityToken));
        const securityPolicy = adjustSecurityPolicy(channel, userTokenPolicy.securityPolicyUri);
        const userName = userIdentityToken.userName;
        let password = userIdentityToken.password;
        // decrypt password if necessary
        if (securityPolicy === node_opcua_secure_channel_1.SecurityPolicy.None) {
            password = password.toString();
        }
        else {
            const serverPrivateKey = this.getPrivateKey();
            const serverNonce = session.nonce;
            node_opcua_assert_1.assert(serverNonce instanceof Buffer);
            const cryptoFactory = node_opcua_secure_channel_1.getCryptoFactory(securityPolicy);
            /* istanbul ignore next */
            if (!cryptoFactory) {
                return callback(new Error(" Unsupported security Policy"));
            }
            const buff = cryptoFactory.asymmetricDecrypt(password, serverPrivateKey);
            const length = buff.readUInt32LE(0) - serverNonce.length;
            password = buff.slice(4, 4 + length).toString("utf-8");
        }
        if (_.isFunction(this.userManager.isValidUserAsync)) {
            this.userManager.isValidUserAsync.call(session, userName, password, callback);
        }
        else {
            const authorized = this.userManager.isValidUser.call(session, userName, password);
            async.setImmediate(() => callback(null, authorized));
        }
    }
    /**
     * @internal
     */
    isValidUserIdentityToken(channel, session, userIdentityToken, userTokenSignature, callback) {
        node_opcua_assert_1.assert(callback instanceof Function);
        /* istanbul ignore next */
        if (!userIdentityToken) {
            throw new Error("Invalid token");
        }
        const endpoint_desc = channel.endpoint;
        node_opcua_assert_1.assert(endpoint_desc instanceof node_opcua_types_1.EndpointDescription);
        const userTokenPolicy = findUserTokenByPolicy(endpoint_desc, userIdentityToken.policyId);
        if (!userTokenPolicy) {
            // cannot find token with this policyId
            return callback(null, node_opcua_status_code_1.StatusCodes.BadIdentityTokenInvalid);
        }
        //
        if (userIdentityToken instanceof node_opcua_service_session_1.UserNameIdentityToken) {
            return this.isValidUserNameIdentityToken(channel, session, userTokenPolicy, userIdentityToken, userTokenSignature, callback);
        }
        if (userIdentityToken instanceof node_opcua_service_session_1.X509IdentityToken) {
            return this.isValidX509IdentityToken(channel, session, userTokenPolicy, userIdentityToken, userTokenSignature, callback);
        }
        return callback(null, node_opcua_status_code_1.StatusCodes.Good);
    }
    /**
     *
     * @internal
     * @param channel
     * @param session
     * @param userIdentityToken
     * @param callback
     * @returns {*}
     */
    isUserAuthorized(channel, session, userIdentityToken, callback) {
        node_opcua_assert_1.assert(userIdentityToken);
        node_opcua_assert_1.assert(_.isFunction(callback));
        const endpoint_desc = channel.endpoint;
        node_opcua_assert_1.assert(endpoint_desc instanceof node_opcua_types_1.EndpointDescription);
        const userTokenPolicy = findUserTokenByPolicy(endpoint_desc, userIdentityToken.policyId);
        node_opcua_assert_1.assert(userTokenPolicy);
        // find if a userToken exists
        if (userIdentityToken instanceof node_opcua_service_session_1.UserNameIdentityToken) {
            return this.userNameIdentityTokenAuthenticateUser(channel, session, userTokenPolicy, userIdentityToken, callback);
        }
        async.setImmediate(callback.bind(null, null, true));
    }
    makeServerNonce() {
        return crypto.randomBytes(32);
    }
    // session services
    _on_CreateSessionRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_session_1.CreateSessionRequest);
        function rejectConnection(statusCode) {
            server.engine._rejectedSessionCount += 1;
            const response1 = new node_opcua_service_session_1.CreateSessionResponse({
                responseHeader: { serviceResult: statusCode }
            });
            channel.send_response("MSG", response1, message);
            // and close !
        }
        // From OPCUA V1.03 Part 4 5.6.2 CreateSession
        // A Server application should limit the number of Sessions. To protect against misbehaving Clients and denial
        // of service attacks, the Server shall close the oldest Session that is not activated before reaching the
        // maximum number of supported Sessions
        if (server.currentSessionCount >= server.maxAllowedSessionNumber) {
            _attempt_to_close_some_old_unactivated_session(server);
        }
        // check if session count hasn't reach the maximum allowed sessions
        if (server.currentSessionCount >= server.maxAllowedSessionNumber) {
            return rejectConnection(node_opcua_status_code_1.StatusCodes.BadTooManySessions);
        }
        // Release 1.03 OPC Unified Architecture, Part 4 page 24 - CreateSession Parameters
        // client should prove a sessionName
        // Session name is a Human readable string that identifies the Session. The Server makes this name and the
        // sessionId visible in its AddressSpace for diagnostic purposes. The Client should provide a name that is
        // unique for the instance of the Client.
        // If this parameter is not specified the Server shall assign a value.
        if (utils.isNullOrUndefined(request.sessionName)) {
            // see also #198
            // let's the server assign a sessionName for this lazy client.
            debugLog("assigning OPCUAServer.fallbackSessionName because client's sessionName is null ", OPCUAServer.fallbackSessionName);
            request.sessionName = OPCUAServer.fallbackSessionName;
        }
        // Duration Requested maximum number of milliseconds that a Session should remain open without activity.
        // If the Client fails to issue a Service request within this interval, then the Server shall automatically
        // terminate the Client Session.
        const revisedSessionTimeout = _adjust_session_timeout(request.requestedSessionTimeout);
        // Release 1.02 page 27 OPC Unified Architecture, Part 4: CreateSession.clientNonce
        // A random number that should never be used in any other request. This number shall have a minimum length of 32
        // bytes. Profiles may increase the required length. The Server shall use this value to prove possession of
        // its application instance Certificate in the response.
        if (!request.clientNonce || request.clientNonce.length < 32) {
            if (channel.securityMode !== node_opcua_secure_channel_1.MessageSecurityMode.None) {
                errorLog(chalk_1.default.red("SERVER with secure connection: Missing or invalid client Nonce "), request.clientNonce && request.clientNonce.toString("hex"));
                return rejectConnection(node_opcua_status_code_1.StatusCodes.BadNonceInvalid);
            }
        }
        function validate_applicationUri(applicationUri, clientCertificate) {
            // if session is insecure there is no need to check certificate information
            if (channel.securityMode === node_opcua_secure_channel_1.MessageSecurityMode.None) {
                return true; // assume correct
            }
            if (!clientCertificate || clientCertificate.length === 0) {
                return true; // can't check
            }
            const e = node_opcua_crypto_1.exploreCertificate(clientCertificate);
            const applicationUriFromCert = e.tbsCertificate.extensions.subjectAltName.uniformResourceIdentifier[0];
            /* istanbul ignore next */
            if (applicationUriFromCert !== applicationUri) {
                errorLog("BadCertificateUriInvalid!");
                errorLog("applicationUri           = ", applicationUri);
                errorLog("applicationUriFromCert   = ", applicationUriFromCert);
            }
            return applicationUriFromCert === applicationUri;
        }
        // check application spoofing
        // check if applicationUri in createSessionRequest matches applicationUri in client Certificate
        if (!validate_applicationUri(request.clientDescription.applicationUri, request.clientCertificate)) {
            return rejectConnection(node_opcua_status_code_1.StatusCodes.BadCertificateUriInvalid);
        }
        function validate_security_endpoint(channel1) {
            let endpoints = server._get_endpoints();
            // ignore restricted endpoints
            endpoints = endpoints.filter((endpoint) => {
                return !endpoint.restricted;
            });
            const endpoints_matching_security_mode = endpoints.filter((e) => {
                return e.securityMode === channel1.securityMode;
            });
            if (endpoints_matching_security_mode.length === 0) {
                return node_opcua_status_code_1.StatusCodes.BadSecurityModeRejected;
            }
            const endpoints_matching_security_policy = endpoints_matching_security_mode.filter((e) => {
                return e.securityPolicyUri === channel1.securityHeader.securityPolicyUri;
            });
            if (endpoints_matching_security_policy.length === 0) {
                return node_opcua_status_code_1.StatusCodes.BadSecurityPolicyRejected;
            }
            return node_opcua_status_code_1.StatusCodes.Good;
        }
        const errStatus = validate_security_endpoint(channel);
        if (errStatus !== node_opcua_status_code_1.StatusCodes.Good) {
            return rejectConnection(errStatus);
        }
        // endpointUrl String The network address that the Client used to access the Session Endpoint.
        //             The HostName portion of the URL should be one of the HostNames for the application that are
        //             specified in the Server’s ApplicationInstanceCertificate (see 7.2). The Server shall raise an
        //             AuditUrlMismatchEventType event if the URL does not match the Server’s HostNames.
        //             AuditUrlMismatchEventType event type is defined in Part 5.
        //             The Server uses this information for diagnostics and to determine the set of
        //             EndpointDescriptions to return in the response.
        function validate_endpointUri() {
            // ToDo: check endpointUrl validity and emit an AuditUrlMismatchEventType event if not
        }
        validate_endpointUri();
        // see Release 1.02  27  OPC Unified Architecture, Part 4
        const session = server.createSession({
            clientDescription: request.clientDescription,
            sessionTimeout: revisedSessionTimeout
        });
        node_opcua_assert_1.assert(session);
        node_opcua_assert_1.assert(session.sessionTimeout === revisedSessionTimeout);
        session.clientDescription = request.clientDescription;
        session.sessionName = request.sessionName;
        // Depending upon on the  SecurityPolicy  and the  SecurityMode  of the  SecureChannel,  the exchange of
        // ApplicationInstanceCertificates   and  Nonces  may be optional and the signatures may be empty. See
        // Part  7  for the definition of  SecurityPolicies  and the handling of these parameters
        // serverNonce:
        // A random number that should never be used in any other request.
        // This number shall have a minimum length of 32 bytes.
        // The Client shall use this value to prove possession of its application instance
        // Certificate in the ActivateSession request.
        // This value may also be used to prove possession of the userIdentityToken it
        // specified in the ActivateSession request.
        //
        // ( this serverNonce will only be used up to the _on_ActivateSessionRequest
        //   where a new nonce will be created)
        session.nonce = server.makeServerNonce();
        session.channelId = channel.channelId;
        session._attach_channel(channel);
        const serverCertificateChain = server.getCertificateChain();
        const hasEncryption = true;
        // If the securityPolicyUri is None and none of the UserTokenPolicies requires encryption
        if (session.channel.securityMode === node_opcua_secure_channel_1.MessageSecurityMode.None) {
            // ToDo: Check that none of our unsecure endpoint has a a UserTokenPolicy that require encryption
            // and set hasEncryption = false under this condition
        }
        const response = new node_opcua_service_session_1.CreateSessionResponse({
            // A identifier which uniquely identifies the session.
            sessionId: session.nodeId,
            // A unique identifier assigned by the Server to the Session.
            // The token used to authenticate the client in subsequent requests.
            authenticationToken: session.authenticationToken,
            revisedSessionTimeout,
            serverNonce: session.nonce,
            // serverCertificate: type ApplicationServerCertificate
            // The application instance Certificate issued to the Server.
            // A Server shall prove possession by using the private key to sign the Nonce provided
            // by the Client in the request. The Client shall verify that this Certificate is the same as
            // the one it used to create the SecureChannel.
            // The ApplicationInstanceCertificate type is defined in OpCUA 1.03 part 4 - $7.2 page 108
            // If the securityPolicyUri is None and none of the UserTokenPolicies requires
            // encryption, the Server shall not send an ApplicationInstanceCertificate and the Client
            // shall ignore the ApplicationInstanceCertificate.
            serverCertificate: hasEncryption ? serverCertificateChain : undefined,
            // The endpoints provided by the server.
            // The Server shall return a set of EndpointDescriptions available for the serverUri
            // specified in the request.[...]
            // The Client shall verify this list with the list from a Discovery Endpoint if it used a Discovery
            // Endpoint to fetch the EndpointDescriptions.
            // It is recommended that Servers only include the endpointUrl, securityMode,
            // securityPolicyUri, userIdentityTokens, transportProfileUri and securityLevel with all
            // other parameters set to null. Only the recommended parameters shall be verified by
            // the client.
            serverEndpoints: _serverEndpointsForCreateSessionResponse(server, request.serverUri),
            // This parameter is deprecated and the array shall be empty.
            serverSoftwareCertificates: null,
            // This is a signature generated with the private key associated with the
            // serverCertificate. This parameter is calculated by appending the clientNonce to the
            // clientCertificate and signing the resulting sequence of bytes.
            // The SignatureAlgorithm shall be the AsymmetricSignatureAlgorithm specified in the
            // SecurityPolicy for the Endpoint.
            // The SignatureData type is defined in 7.30.
            serverSignature: server.computeServerSignature(channel, request.clientCertificate, request.clientNonce),
            // The maximum message size accepted by the server
            // The Client Communication Stack should return a Bad_RequestTooLarge error to the
            // application if a request message exceeds this limit.
            // The value zero indicates that this parameter is not used.
            maxRequestMessageSize: 0x4000000
        });
        server.emit("create_session", session);
        session.on("session_closed", (session1, deleteSubscriptions, reason) => {
            node_opcua_assert_1.assert(_.isString(reason));
            if (server.isAuditing) {
                node_opcua_assert_1.assert(reason === "Timeout" ||
                    reason === "Terminated" ||
                    reason === "CloseSession" ||
                    reason === "Forcing");
                const sourceName = "Session/" + reason;
                server.raiseEvent("AuditSessionEventType", {
                    /* part 5 -  6.4.3 AuditEventType */
                    actionTimeStamp: { dataType: "DateTime", value: new Date() },
                    status: { dataType: "Boolean", value: true },
                    serverId: { dataType: "String", value: "" },
                    // ClientAuditEntryId contains the human-readable AuditEntryId defined in Part 3.
                    clientAuditEntryId: { dataType: "String", value: "" },
                    // The ClientUserId identifies the user of the client requesting an action. The ClientUserId can be
                    // obtained from the UserIdentityToken passed in the ActivateSession call.
                    clientUserId: { dataType: "String", value: "" },
                    sourceName: { dataType: "String", value: sourceName },
                    /* part 5 - 6.4.7 AuditSessionEventType */
                    sessionId: { dataType: "NodeId", value: session1.nodeId }
                });
            }
            server.emit("session_closed", session1, deleteSubscriptions);
        });
        if (server.isAuditing) {
            // ------------------------------------------------------------------------------------------------------
            server.raiseEvent("AuditCreateSessionEventType", {
                /* part 5 -  6.4.3 AuditEventType */
                actionTimeStamp: { dataType: "DateTime", value: new Date() },
                status: { dataType: "Boolean", value: true },
                serverId: { dataType: "String", value: "" },
                // ClientAuditEntryId contains the human-readable AuditEntryId defined in Part 3.
                clientAuditEntryId: { dataType: "String", value: "" },
                // The ClientUserId identifies the user of the client requesting an action. The ClientUserId can be
                // obtained from the UserIdentityToken passed in the ActivateSession call.
                clientUserId: { dataType: "String", value: "" },
                sourceName: { dataType: "String", value: "Session/CreateSession" },
                /* part 5 - 6.4.7 AuditSessionEventType */
                sessionId: { dataType: "NodeId", value: session.nodeId },
                /* part 5 - 6.4.8 AuditCreateSessionEventType */
                // SecureChannelId shall uniquely identify the SecureChannel. The application shall use the same
                // identifier in all AuditEvents related to the Session Service Set (AuditCreateSessionEventType,
                // AuditActivateSessionEventType and their subtypes) and the SecureChannel Service Set
                // (AuditChannelEventType and its subtypes
                secureChannelId: { dataType: "String", value: session.channel.channelId.toString() },
                // Duration
                revisedSessionTimeout: { dataType: "Duration", value: session.sessionTimeout },
                // clientCertificate
                clientCertificate: { dataType: "ByteString", value: session.channel.clientCertificate },
                // clientCertificateThumbprint
                clientCertificateThumbprint: {
                    dataType: "ByteString",
                    value: thumbprint(session.channel.clientCertificate)
                }
            });
        }
        // -----------------------------------------------------------------------------------------------------------
        node_opcua_assert_1.assert(response.authenticationToken);
        channel.send_response("MSG", response, message);
    }
    // TODO : implement this:
    //
    // When the ActivateSession Service is called for the first time then the Server shall reject the request
    // if the SecureChannel is not same as the one associated with the CreateSession request.
    // Subsequent calls to ActivateSession may be associated with different SecureChannels. If this is the
    // case then the Server shall verify that the Certificate the Client used to create the new
    // SecureChannel is the same as the Certificate used to create the original SecureChannel. In addition,
    // the Server shall verify that the Client supplied a UserIdentityToken that is identical to the token
    // currently associated with the Session. Once the Server accepts the new SecureChannel it shall
    // reject requests sent via the old SecureChannel.
    /**
     *
     * @method _on_ActivateSessionRequest
     * @private
     *
     *
     */
    _on_ActivateSessionRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_session_1.ActivateSessionRequest);
        // get session from authenticationToken
        const authenticationToken = request.requestHeader.authenticationToken;
        const session = server.getSession(authenticationToken);
        function rejectConnection(statusCode) {
            server.engine._rejectedSessionCount += 1;
            const response1 = new node_opcua_service_session_1.ActivateSessionResponse({ responseHeader: { serviceResult: statusCode } });
            channel.send_response("MSG", response1, message);
            // and close !
        }
        let response;
        /* istanbul ignore next */
        if (!session) {
            // this may happen when the server has been restarted and a client tries to reconnect, thinking
            // that the previous session may still be active
            debugLog(chalk_1.default.yellow.bold(" Bad Session in  _on_ActivateSessionRequest"), authenticationToken.value.toString("hex"));
            return rejectConnection(node_opcua_status_code_1.StatusCodes.BadSessionIdInvalid);
        }
        // OpcUA 1.02 part 3 $5.6.3.1 ActiveSession Set page 29
        // When the ActivateSession  Service  is called f or the first time then the Server shall reject the request
        // if the  SecureChannel  is not same as the one associated with the  CreateSession  request.
        if (session.status === "new") {
            // xx if (channel.session_nonce !== session.nonce) {
            if (!channel_has_session(channel, session)) {
                // it looks like session activation is being using a channel that is not the
                // one that have been used to create the session
                errorLog(" channel.sessionTokens === " + Object.keys(channel.sessionTokens).join(" "));
                return rejectConnection(node_opcua_status_code_1.StatusCodes.BadSessionNotActivated);
            }
        }
        // OpcUA 1.02 part 3 $5.6.3.1 ActiveSession Set page 29
        // ... Subsequent calls to  ActivateSession  may be associated with different  SecureChannels.  If this is the
        // case then  the  Server  shall verify that the  Certificate  the  Client  used to create the new
        // SecureChannel  is the same as the  Certificate  used to create the original  SecureChannel.
        if (session.status === "active") {
            if (session.channel.channelId !== channel.channelId) {
                warningLog(" Session is being transferred from channel", chalk_1.default.cyan(session.channel.channelId.toString()), " to channel ", chalk_1.default.cyan(channel.channelId.toString()));
                // session is being reassigned to a new Channel,
                // we shall verify that the certificate used to create the Session is the same as the current
                // channel certificate.
                const old_channel_cert_thumbprint = thumbprint(session.channel.clientCertificate);
                const new_channel_cert_thumbprint = thumbprint(channel.clientCertificate);
                if (old_channel_cert_thumbprint !== new_channel_cert_thumbprint) {
                    return rejectConnection(node_opcua_status_code_1.StatusCodes.BadNoValidCertificates); // not sure about this code !
                }
                // ... In addition the Server shall verify that the  Client  supplied a  UserIdentityToken  that is
                // identical to the token currently associated with the  Session reassign session to new channel.
                if (!sameIdentityToken(session.userIdentityToken, request.userIdentityToken)) {
                    return rejectConnection(node_opcua_status_code_1.StatusCodes.BadIdentityChangeNotSupported); // not sure about this code !
                }
            }
            moveSessionToChannel(session, channel);
        }
        else if (session.status === "screwed") {
            // session has been used before being activated => this should be detected and session should be dismissed.
            return rejectConnection(node_opcua_status_code_1.StatusCodes.BadSessionClosed);
        }
        else if (session.status === "closed") {
            warningLog(chalk_1.default.yellow.bold(" Bad Session Closed in  _on_ActivateSessionRequest"), authenticationToken.value.toString("hex"));
            return rejectConnection(node_opcua_status_code_1.StatusCodes.BadSessionClosed);
        }
        // verify clientSignature provided by the client
        if (!server.verifyClientSignature(session, channel, request.clientSignature)) {
            return rejectConnection(node_opcua_status_code_1.StatusCodes.BadApplicationSignatureInvalid);
        }
        // userIdentityToken may be missing , assume anonymous access then
        request.userIdentityToken = request.userIdentityToken || createAnonymousIdentityToken(channel.endpoint);
        // check request.userIdentityToken is correct ( expected type and correctly formed)
        server.isValidUserIdentityToken(channel, session, request.userIdentityToken, request.userTokenSignature, (err, statusCode) => {
            if (statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
                /* istanbul ignore next */
                if (!(statusCode && statusCode instanceof node_opcua_status_code_1.StatusCode)) {
                    const a = 23;
                }
                node_opcua_assert_1.assert(statusCode && statusCode instanceof node_opcua_status_code_1.StatusCode, "expecting statusCode");
                return rejectConnection(statusCode);
            }
            session.userIdentityToken = request.userIdentityToken;
            // check if user access is granted
            server.isUserAuthorized(channel, session, request.userIdentityToken, (err1, authorized) => {
                /* istanbul ignore next */
                if (err1) {
                    return rejectConnection(node_opcua_status_code_1.StatusCodes.BadInternalError);
                }
                if (!authorized) {
                    return rejectConnection(node_opcua_status_code_1.StatusCodes.BadUserAccessDenied);
                }
                else {
                    // extract : OPC UA part 4 - 5.6.3
                    // Once used, a serverNonce cannot be used again. For that reason, the Server returns a new
                    // serverNonce each time the ActivateSession Service is called.
                    session.nonce = server.makeServerNonce();
                    session.status = "active";
                    response = new node_opcua_service_session_1.ActivateSessionResponse({ serverNonce: session.nonce });
                    channel.send_response("MSG", response, message);
                    const userIdentityTokenPasswordRemoved = (userIdentityToken) => {
                        const a = userIdentityToken.clone();
                        // remove password
                        a.password = "*************";
                        return a;
                    };
                    // send OPCUA Event Notification
                    // see part 5 : 6.4.3 AuditEventType
                    //              6.4.7 AuditSessionEventType
                    //              6.4.10 AuditActivateSessionEventType
                    node_opcua_assert_1.assert(session.nodeId); // sessionId
                    // xx assert(session.channel.clientCertificate instanceof Buffer);
                    node_opcua_assert_1.assert(session.sessionTimeout > 0);
                    if (server.isAuditing) {
                        server.raiseEvent("AuditActivateSessionEventType", {
                            /* part 5 -  6.4.3 AuditEventType */
                            actionTimeStamp: { dataType: "DateTime", value: new Date() },
                            status: { dataType: "Boolean", value: true },
                            serverId: { dataType: "String", value: "" },
                            // ClientAuditEntryId contains the human-readable AuditEntryId defined in Part 3.
                            clientAuditEntryId: { dataType: "String", value: "" },
                            // The ClientUserId identifies the user of the client requesting an action.
                            // The ClientUserId can be obtained from the UserIdentityToken passed in the
                            // ActivateSession call.
                            clientUserId: { dataType: "String", value: "cc" },
                            sourceName: { dataType: "String", value: "Session/ActivateSession" },
                            /* part 5 - 6.4.7 AuditSessionEventType */
                            sessionId: { dataType: "NodeId", value: session.nodeId },
                            /* part 5 - 6.4.10 AuditActivateSessionEventType */
                            clientSoftwareCertificates: {
                                arrayType: node_opcua_variant_2.VariantArrayType.Array,
                                dataType: "ExtensionObject" /* SignedSoftwareCertificate */,
                                value: []
                            },
                            // UserIdentityToken reflects the userIdentityToken parameter of the ActivateSession
                            // Service call.
                            // For Username/Password tokens the password should NOT be included.
                            userIdentityToken: {
                                dataType: "ExtensionObject" /*  UserIdentityToken */,
                                value: userIdentityTokenPasswordRemoved(session.userIdentityToken)
                            },
                            // SecureChannelId shall uniquely identify the SecureChannel. The application shall
                            // use the same identifier in all AuditEvents related to the Session Service Set
                            // (AuditCreateSessionEventType, AuditActivateSessionEventType and their subtypes) and
                            // the SecureChannel Service Set (AuditChannelEventType and its subtypes).
                            secureChannelId: { dataType: "String", value: session.channel.channelId.toString() }
                        });
                    }
                }
            });
        });
    }
    prepare(message, channel) {
        const server = this;
        const request = message.request;
        // --- check that session is correct
        const authenticationToken = request.requestHeader.authenticationToken;
        const session = server.getSession(authenticationToken, /*activeOnly*/ true);
        message.session = session;
        if (!session) {
            message.session_statusCode = node_opcua_status_code_1.StatusCodes.BadSessionIdInvalid;
            return;
        }
        // --- check that provided session matches session attached to channel
        if (channel.channelId !== session.channelId) {
            if (!(request instanceof node_opcua_service_session_1.ActivateSessionRequest)) {
                errorLog(chalk_1.default.red.bgWhite("ERROR: channel.channelId !== session.channelId"), channel.channelId, session.channelId);
            }
            message.session_statusCode = node_opcua_status_code_1.StatusCodes.BadSecureChannelIdInvalid;
        }
        else if (channel_has_session(channel, session)) {
            message.session_statusCode = node_opcua_status_code_1.StatusCodes.Good;
        }
        else {
            // session ma y have been moved to a different channel
            message.session_statusCode = node_opcua_status_code_1.StatusCodes.BadSecureChannelIdInvalid;
        }
    }
    /**
     * ensure that action is performed on a valid session object,
     * @method _apply_on_SessionObject
     * @param ResponseClass the constructor of the response Class
     * @param message
     * @param channel
     * @param action_to_perform
     * @param action_to_perform.session {ServerSession}
     * @param action_to_perform.sendResponse
     * @param action_to_perform.sendResponse.response
     * @param action_to_perform.sendError
     * @param action_to_perform.sendError.statusCode
     * @param action_to_perform.sendError.diagnostics
     *
     * @private
     */
    _apply_on_SessionObject(ResponseClass, message, channel, action_to_perform) {
        node_opcua_assert_1.assert(_.isFunction(action_to_perform));
        function sendResponse(response1) {
            node_opcua_assert_1.assert(response1 instanceof ResponseClass);
            if (message.session) {
                message.session.incrementRequestTotalCounter(ResponseClass.name.replace("Response", ""));
            }
            return channel.send_response("MSG", response1, message);
        }
        function sendError(statusCode) {
            if (message.session) {
                message.session.incrementRequestErrorCounter(ResponseClass.name.replace("Response", ""));
            }
            return g_sendError(channel, message, ResponseClass, statusCode);
        }
        let response;
        /* istanbul ignore next */
        if (!message.session || message.session_statusCode !== node_opcua_status_code_1.StatusCodes.Good) {
            const errMessage = "INVALID SESSION  !! ";
            response = new ResponseClass({ responseHeader: { serviceResult: message.session_statusCode } });
            debugLog(chalk_1.default.red.bold(errMessage), chalk_1.default.yellow(message.session_statusCode.toString()), response.constructor.name);
            return sendResponse(response);
        }
        node_opcua_assert_1.assert(message.session_statusCode === node_opcua_status_code_1.StatusCodes.Good);
        // OPC UA Specification 1.02 part 4 page 26
        // When a  Session  is terminated, all outstanding requests on the  Session  are aborted and
        // Bad_SessionClosed  StatusCodes  are returned to the  Client. In addition,   the  Server  deletes the entry
        // for the  Client  from its  SessionDiagnostics Array  Variable  and notifies any other  Clients  who were
        // subscribed to this entry.
        if (message.session.status === "closed") {
            // note : use StatusCodes.BadSessionClosed , for pending message for this session
            return sendError(node_opcua_status_code_1.StatusCodes.BadSessionIdInvalid);
        }
        if (message.session.status !== "active") {
            // mark session as being screwed ! so it cannot be activated anymore
            message.session.status = "screwed";
            // note : use StatusCodes.BadSessionClosed , for pending message for this session
            return sendError(node_opcua_status_code_1.StatusCodes.BadSessionIdInvalid);
        }
        // lets also reset the session watchdog so it doesn't
        // (Sessions are terminated by the Server automatically if the Client fails to issue a Service
        // request on the Session within the timeout period negotiated by the Server in the
        // CreateSession Service response. )
        node_opcua_assert_1.assert(_.isFunction(message.session.keepAlive));
        message.session.keepAlive();
        message.session.incrementTotalRequestCount();
        action_to_perform(message.session, sendResponse, sendError);
    }
    /**
     * @method _apply_on_Subscription
     * @param ResponseClass
     * @param message
     * @param channel
     * @param action_to_perform
     * @private
     */
    _apply_on_Subscription(ResponseClass, message, channel, action_to_perform) {
        node_opcua_assert_1.assert(_.isFunction(action_to_perform));
        const request = message.request;
        node_opcua_assert_1.assert(request.hasOwnProperty("subscriptionId"));
        this._apply_on_SessionObject(ResponseClass, message, channel, (session, sendResponse, sendError) => {
            const subscription = session.getSubscription(request.subscriptionId);
            if (!subscription) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadSubscriptionIdInvalid);
            }
            subscription.resetLifeTimeAndKeepAliveCounters();
            action_to_perform(session, subscription, sendResponse, sendError);
        });
    }
    /**
     * @method _apply_on_SubscriptionIds
     * @param ResponseClass
     * @param message
     * @param channel
     * @param action_to_perform
     * @private
     */
    _apply_on_SubscriptionIds(ResponseClass, message, channel, action_to_perform) {
        node_opcua_assert_1.assert(_.isFunction(action_to_perform));
        const request = message.request;
        node_opcua_assert_1.assert(request.hasOwnProperty("subscriptionIds"));
        this._apply_on_SessionObject(ResponseClass, message, channel, (session, sendResponse, sendError) => {
            const subscriptionIds = request.subscriptionIds;
            if (!request.subscriptionIds || request.subscriptionIds.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            const results = subscriptionIds.map((subscriptionId) => {
                return action_to_perform(session, subscriptionId);
            });
            const response = new ResponseClass({
                results
            });
            sendResponse(response);
        });
    }
    /**
     * @method _apply_on_Subscriptions
     * @param ResponseClass
     * @param message
     * @param channel
     * @param action_to_perform
     * @private
     */
    _apply_on_Subscriptions(ResponseClass, message, channel, action_to_perform) {
        this._apply_on_SubscriptionIds(ResponseClass, message, channel, (session, subscriptionId) => {
            /* istanbul ignore next */
            if (subscriptionId <= 0) {
                return node_opcua_status_code_1.StatusCodes.BadSubscriptionIdInvalid;
            }
            const subscription = session.getSubscription(subscriptionId);
            if (!subscription) {
                return node_opcua_status_code_1.StatusCodes.BadSubscriptionIdInvalid;
            }
            return action_to_perform(session, subscription);
        });
    }
    /**
     * @method _on_CloseSessionRequest
     * @param message
     * @param channel
     * @private
     */
    _on_CloseSessionRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_session_1.CloseSessionRequest);
        let response;
        message.session_statusCode = node_opcua_status_code_1.StatusCodes.Good;
        function sendError(statusCode) {
            return g_sendError(channel, message, node_opcua_service_session_1.CloseSessionResponse, statusCode);
        }
        function sendResponse(response1) {
            channel.send_response("MSG", response1, message);
        }
        // do not use _apply_on_SessionObject
        // this._apply_on_SessionObject(CloseSessionResponse, message, channel, function (session) {
        // });
        const session = message.session;
        if (!session) {
            return sendError(node_opcua_status_code_1.StatusCodes.BadSessionIdInvalid);
        }
        // session has been created but not activated !
        const wasNotActivated = (session.status === "new");
        server.engine.closeSession(request.requestHeader.authenticationToken, request.deleteSubscriptions, "CloseSession");
        if (wasNotActivated) {
            return sendError(node_opcua_status_code_1.StatusCodes.BadSessionNotActivated);
        }
        response = new node_opcua_service_session_1.CloseSessionResponse({});
        sendResponse(response);
    }
    // browse services
    /**
     * @method _on_BrowseRequest
     * @param message
     * @param channel
     * @private
     */
    _on_BrowseRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_browse_1.BrowseRequest);
        const diagnostic = {};
        this._apply_on_SessionObject(node_opcua_service_browse_1.BrowseResponse, message, channel, (session, sendResponse, sendError) => {
            let response;
            // test view
            if (request.view && !request.view.viewId.isEmpty()) {
                let theView = server.engine.addressSpace.findNode(request.view.viewId);
                if (theView && theView.nodeClass !== node_opcua_data_model_1.NodeClass.View) {
                    // Error: theView is not a View
                    diagnostic.localizedText = { text: "Expecting a view here" };
                    theView = null;
                }
                if (!theView) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadViewIdUnknown, diagnostic);
                }
            }
            if (!request.nodesToBrowse || request.nodesToBrowse.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerBrowse > 0) {
                if (request.nodesToBrowse.length > server.engine.serverCapabilities.operationLimits.maxNodesPerBrowse) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            // limit results to requestedMaxReferencesPerNode further so it never exceed a too big number
            const requestedMaxReferencesPerNode = Math.min(9876, request.requestedMaxReferencesPerNode);
            let results = [];
            node_opcua_assert_1.assert(request.nodesToBrowse[0].schema.name === "BrowseDescription");
            results = server.engine.browse(request.nodesToBrowse);
            node_opcua_assert_1.assert(results[0].schema.name === "BrowseResult");
            // handle continuation point and requestedMaxReferencesPerNode
            results = results.map((result) => {
                node_opcua_assert_1.assert(!result.continuationPoint);
                const truncatedResult = session.continuationPointManager.register(requestedMaxReferencesPerNode, result.references || []);
                node_opcua_assert_1.assert(truncatedResult.statusCode === node_opcua_status_code_1.StatusCodes.Good);
                truncatedResult.statusCode = result.statusCode;
                return new node_opcua_types_1.BrowseResult(truncatedResult);
            });
            response = new node_opcua_service_browse_1.BrowseResponse({
                diagnosticInfos: undefined,
                results
            });
            sendResponse(response);
        });
    }
    /**
     * @method _on_BrowseNextRequest
     * @param message
     * @param channel
     * @private
     */
    _on_BrowseNextRequest(message, channel) {
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_browse_1.BrowseNextRequest);
        this._apply_on_SessionObject(node_opcua_service_browse_1.BrowseNextResponse, message, channel, (session, sendResponse, sendError) => {
            let response;
            if (!request.continuationPoints || request.continuationPoints.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            // A Boolean parameter with the following values:
            let results;
            if (request.releaseContinuationPoints) {
                // releaseContinuationPoints = TRUE
                //   passed continuationPoints shall be reset to free resources in
                //   the Server. The continuation points are released and the results
                //   and diagnosticInfos arrays are empty.
                results = request.continuationPoints.map((continuationPoint) => {
                    return session.continuationPointManager.cancel(continuationPoint);
                });
            }
            else {
                // let extract data from continuation points
                // releaseContinuationPoints = FALSE
                //   passed continuationPoints shall be used to get the next set of
                //   browse information.
                results = request.continuationPoints.map((continuationPoint) => {
                    return session.continuationPointManager.getNext(continuationPoint);
                });
            }
            response = new node_opcua_service_browse_1.BrowseNextResponse({
                diagnosticInfos: undefined,
                results
            });
            sendResponse(response);
        });
    }
    // read services
    _on_ReadRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_read_1.ReadRequest);
        this._apply_on_SessionObject(node_opcua_service_read_1.ReadResponse, message, channel, (session, sendResponse, sendError) => {
            const context = new node_opcua_address_space_1.SessionContext({ session, server });
            let response;
            let results = [];
            const timestampsToReturn = request.timestampsToReturn;
            if (timestampsToReturn === node_opcua_service_read_1.TimestampsToReturn.Invalid) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadTimestampsToReturnInvalid);
            }
            if (request.maxAge < 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadMaxAgeInvalid);
            }
            request.nodesToRead = request.nodesToRead || [];
            if (!request.nodesToRead || request.nodesToRead.length <= 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            node_opcua_assert_1.assert(request.nodesToRead[0].schema.name === "ReadValueId");
            // limit size of nodesToRead array to maxNodesPerRead
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerRead > 0) {
                if (request.nodesToRead.length > server.engine.serverCapabilities.operationLimits.maxNodesPerRead) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            // proceed with registered nodes alias resolution
            for (const nodeToRead of request.nodesToRead) {
                nodeToRead.nodeId = session.resolveRegisteredNode(nodeToRead.nodeId);
            }
            // ask for a refresh of asynchronous variables
            server.engine.refreshValues(request.nodesToRead, (err) => {
                node_opcua_assert_1.assert(!err, " error not handled here , fix me");
                results = server.engine.read(context, request);
                node_opcua_assert_1.assert(results[0].schema.name === "DataValue");
                node_opcua_assert_1.assert(results.length === request.nodesToRead.length);
                response = new node_opcua_service_read_1.ReadResponse({
                    diagnosticInfos: undefined,
                    results: undefined
                });
                // set it here for performance
                response.results = results;
                node_opcua_assert_1.assert(response.diagnosticInfos.length === 0);
                sendResponse(response);
            });
        });
    }
    // read services
    _on_HistoryReadRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_history_1.HistoryReadRequest);
        this._apply_on_SessionObject(node_opcua_service_history_1.HistoryReadResponse, message, channel, (session, sendResponse, sendError) => {
            let response;
            const timestampsToReturn = request.timestampsToReturn;
            if (timestampsToReturn === node_opcua_service_read_1.TimestampsToReturn.Invalid) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadTimestampsToReturnInvalid);
            }
            request.nodesToRead = request.nodesToRead || [];
            if (!request.nodesToRead || request.nodesToRead.length <= 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            node_opcua_assert_1.assert(request.nodesToRead[0].schema.name === "HistoryReadValueId");
            // limit size of nodesToRead array to maxNodesPerRead
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerRead > 0) {
                if (request.nodesToRead.length > server.engine.serverCapabilities.operationLimits.maxNodesPerRead) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            // todo : handle
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerHistoryReadData > 0) {
                if (request.nodesToRead.length > server.engine.serverCapabilities.operationLimits.maxNodesPerHistoryReadData) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerHistoryReadEvents > 0) {
                if (request.nodesToRead.length > server.engine.serverCapabilities.operationLimits.maxNodesPerHistoryReadEvents) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            const context = new node_opcua_address_space_1.SessionContext({ session, server });
            // ask for a refresh of asynchronous variables
            server.engine.refreshValues(request.nodesToRead, (err) => {
                node_opcua_assert_1.assert(!err, " error not handled here , fix me"); // TODO
                server.engine.historyRead(context, request, (err1, results) => {
                    if (err1) {
                        return sendError(node_opcua_status_code_1.StatusCodes.BadInternalError);
                    }
                    if (!results) {
                        return sendError(node_opcua_status_code_1.StatusCodes.BadInternalError);
                    }
                    node_opcua_assert_1.assert(results[0].schema.name === "HistoryReadResult");
                    node_opcua_assert_1.assert(results.length === request.nodesToRead.length);
                    response = new node_opcua_service_history_1.HistoryReadResponse({
                        diagnosticInfos: undefined,
                        results
                    });
                    node_opcua_assert_1.assert(response.diagnosticInfos.length === 0);
                    sendResponse(response);
                });
            });
        });
    }
    /*
     // write services
     // OPCUA Specification 1.02 Part 3 : 5.10.4 Write
     // This Service is used to write values to one or more Attributes of one or more Nodes. For constructed
     // Attribute values whose elements are indexed, such as an array, this Service allows Clients to write
     // the entire set of indexed values as a composite, to write individual elements or to write ranges of
     // elements of the composite.
     // The values are written to the data source, such as a device, and the Service does not return until it writes
     // the values or determines that the value cannot be written. In certain cases, the Server will successfully
     // to an intermediate system or Server, and will not know if the data source was updated properly. In these cases,
     // the Server should report a success code that indicates that the write was not verified.
     // In the cases where the Server is able to verify that it has successfully written to the data source,
     // it reports an unconditional success.
     */
    _on_WriteRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_write_1.WriteRequest);
        node_opcua_assert_1.assert(!request.nodesToWrite || _.isArray(request.nodesToWrite));
        this._apply_on_SessionObject(node_opcua_service_write_1.WriteResponse, message, channel, (session, sendResponse, sendError) => {
            let response;
            if (!request.nodesToWrite || request.nodesToWrite.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerWrite > 0) {
                if (request.nodesToWrite.length > server.engine.serverCapabilities.operationLimits.maxNodesPerWrite) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            // proceed with registered nodes alias resolution
            for (const nodeToWrite of request.nodesToWrite) {
                nodeToWrite.nodeId = session.resolveRegisteredNode(nodeToWrite.nodeId);
            }
            const context = new node_opcua_address_space_1.SessionContext({ session, server });
            node_opcua_assert_1.assert(request.nodesToWrite[0].schema.name === "WriteValue");
            server.engine.write(context, request.nodesToWrite, (err, results) => {
                node_opcua_assert_1.assert(!err);
                node_opcua_assert_1.assert(_.isArray(results));
                node_opcua_assert_1.assert(results.length === request.nodesToWrite.length);
                response = new node_opcua_service_write_1.WriteResponse({
                    diagnosticInfos: undefined,
                    results
                });
                sendResponse(response);
            });
        });
    }
    // subscription services
    _on_CreateSubscriptionRequest(message, channel) {
        const server = this;
        const engine = server.engine;
        const addressSpace = engine.addressSpace;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.CreateSubscriptionRequest);
        this._apply_on_SessionObject(node_opcua_service_subscription_1.CreateSubscriptionResponse, message, channel, (session, sendResponse, sendError) => {
            const context = new node_opcua_address_space_1.SessionContext({ session, server });
            if (session.currentSubscriptionCount >= OPCUAServer.MAX_SUBSCRIPTION) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadTooManySubscriptions);
            }
            const subscription = session.createSubscription(request);
            subscription.on("monitoredItem", (monitoredItem) => {
                prepareMonitoredItem(context, addressSpace, monitoredItem);
            });
            const response = new node_opcua_service_subscription_1.CreateSubscriptionResponse({
                revisedLifetimeCount: subscription.lifeTimeCount,
                revisedMaxKeepAliveCount: subscription.maxKeepAliveCount,
                revisedPublishingInterval: subscription.publishingInterval,
                subscriptionId: subscription.id
            });
            sendResponse(response);
        });
    }
    _on_DeleteSubscriptionsRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.DeleteSubscriptionsRequest);
        this._apply_on_SubscriptionIds(node_opcua_service_subscription_1.DeleteSubscriptionsResponse, message, channel, (session, subscriptionId) => {
            const subscription = server.engine.findOrphanSubscription(subscriptionId);
            if (subscription) {
                return server.engine.deleteOrphanSubscription(subscription);
            }
            return session.deleteSubscription(subscriptionId);
        });
    }
    _on_TransferSubscriptionsRequest(message, channel) {
        //
        // sendInitialValue Boolean
        //    A Boolean parameter with the following values:
        //    TRUE      the first Publish response(s) after the TransferSubscriptions call shall
        //              contain the current values of all Monitored Items in the Subscription where
        //              the Monitoring Mode is set to Reporting.
        //    FALSE     the first Publish response after the TransferSubscriptions call shall contain only the value
        //              changes since the last Publish response was sent.
        //    This parameter only applies to MonitoredItems used for monitoring Attribute changes.
        //
        const server = this;
        const engine = server.engine;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.TransferSubscriptionsRequest);
        this._apply_on_SubscriptionIds(node_opcua_service_subscription_1.TransferSubscriptionsResponse, message, channel, (session, subscriptionId) => {
            return engine.transferSubscription(session, subscriptionId, request.sendInitialValues);
        });
    }
    _on_CreateMonitoredItemsRequest(message, channel) {
        const server = this;
        const engine = server.engine;
        const addressSpace = engine.addressSpace;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.CreateMonitoredItemsRequest);
        this._apply_on_Subscription(node_opcua_service_subscription_1.CreateMonitoredItemsResponse, message, channel, (session, subscription, sendResponse, sendError) => {
            const timestampsToReturn = request.timestampsToReturn;
            if (timestampsToReturn === node_opcua_service_read_1.TimestampsToReturn.Invalid) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadTimestampsToReturnInvalid);
            }
            if (!request.itemsToCreate || request.itemsToCreate.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            if (server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall > 0) {
                if (request.itemsToCreate.length > server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            const results = request.itemsToCreate.map(subscription.createMonitoredItem.bind(subscription, addressSpace, timestampsToReturn));
            const response = new node_opcua_service_subscription_1.CreateMonitoredItemsResponse({
                responseHeader: { serviceResult: node_opcua_status_code_1.StatusCodes.Good },
                results
                // ,diagnosticInfos: []
            });
            sendResponse(response);
        });
    }
    _on_ModifySubscriptionRequest(message, channel) {
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.ModifySubscriptionRequest);
        this._apply_on_Subscription(node_opcua_service_subscription_1.ModifySubscriptionResponse, message, channel, (session, subscription, sendResponse, sendError) => {
            subscription.modify(request);
            const response = new node_opcua_service_subscription_1.ModifySubscriptionResponse({
                revisedLifetimeCount: subscription.lifeTimeCount,
                revisedMaxKeepAliveCount: subscription.maxKeepAliveCount,
                revisedPublishingInterval: subscription.publishingInterval
            });
            sendResponse(response);
        });
    }
    _on_ModifyMonitoredItemsRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.ModifyMonitoredItemsRequest);
        this._apply_on_Subscription(node_opcua_service_subscription_1.ModifyMonitoredItemsResponse, message, channel, (session, subscription, sendResponse, sendError) => {
            const timestampsToReturn = request.timestampsToReturn;
            if (timestampsToReturn === node_opcua_service_read_1.TimestampsToReturn.Invalid) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadTimestampsToReturnInvalid);
            }
            if (!request.itemsToModify || request.itemsToModify.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            /* istanbul ignore next */
            if (server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall > 0) {
                if (request.itemsToModify.length > server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            const itemsToModify = request.itemsToModify; // MonitoredItemModifyRequest
            function modifyMonitoredItem(item) {
                const monitoredItemId = item.monitoredItemId;
                const monitoredItem = subscription.getMonitoredItem(monitoredItemId);
                if (!monitoredItem) {
                    return new node_opcua_service_subscription_1.MonitoredItemModifyResult({ statusCode: node_opcua_status_code_1.StatusCodes.BadMonitoredItemIdInvalid });
                }
                // adjust samplingInterval if === -1
                if (item.requestedParameters.samplingInterval === -1) {
                    item.requestedParameters.samplingInterval = subscription.publishingInterval;
                }
                return monitoredItem.modify(timestampsToReturn, item.requestedParameters);
            }
            const results = itemsToModify.map(modifyMonitoredItem);
            const response = new node_opcua_service_subscription_1.ModifyMonitoredItemsResponse({
                results
            });
            sendResponse(response);
        });
    }
    _on_PublishRequest(message, channel) {
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.PublishRequest);
        this._apply_on_SessionObject(node_opcua_service_subscription_1.PublishResponse, message, channel, (session, sendResponse, sendError) => {
            node_opcua_assert_1.assert(session);
            node_opcua_assert_1.assert(session.publishEngine); // server.publishEngine doesn't exists, OPCUAServer has probably shut down already
            session.publishEngine._on_PublishRequest(request, (request1, response) => {
                sendResponse(response);
            });
        });
    }
    _on_SetPublishingModeRequest(message, channel) {
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.SetPublishingModeRequest);
        const publishingEnabled = request.publishingEnabled;
        this._apply_on_Subscriptions(node_opcua_service_subscription_1.SetPublishingModeResponse, message, channel, (session, subscription) => {
            return subscription.setPublishingMode(publishingEnabled);
        });
    }
    _on_DeleteMonitoredItemsRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.DeleteMonitoredItemsRequest);
        this._apply_on_Subscription(node_opcua_service_subscription_1.DeleteMonitoredItemsResponse, message, channel, (session, subscription, sendResponse, sendError) => {
            /* istanbul ignore next */
            if (!request.monitoredItemIds || request.monitoredItemIds.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            /* istanbul ignore next */
            if (server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall > 0) {
                if (request.monitoredItemIds.length > server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            const results = request.monitoredItemIds.map((monitoredItemId) => {
                return subscription.removeMonitoredItem(monitoredItemId);
            });
            const response = new node_opcua_service_subscription_1.DeleteMonitoredItemsResponse({
                diagnosticInfos: undefined,
                results
            });
            sendResponse(response);
        });
    }
    _on_RepublishRequest(message, channel) {
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.RepublishRequest);
        this._apply_on_Subscription(node_opcua_service_subscription_1.RepublishResponse, message, channel, (session, subscription, sendResponse, sendError) => {
            // update diagnostic counter
            subscription.subscriptionDiagnostics.republishRequestCount += 1;
            const retransmitSequenceNumber = request.retransmitSequenceNumber;
            const msgSequence = subscription.getMessageForSequenceNumber(retransmitSequenceNumber);
            if (!msgSequence) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadMessageNotAvailable);
            }
            const response = new node_opcua_service_subscription_1.RepublishResponse({
                notificationMessage: msgSequence.notification,
                responseHeader: {
                    serviceResult: node_opcua_status_code_1.StatusCodes.Good
                }
            });
            sendResponse(response);
        });
    }
    // Bad_NothingToDo
    // Bad_TooManyOperations
    // Bad_SubscriptionIdInvalid
    // Bad_MonitoringModeInvalid
    _on_SetMonitoringModeRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_subscription_1.SetMonitoringModeRequest);
        this._apply_on_Subscription(node_opcua_service_subscription_1.SetMonitoringModeResponse, message, channel, (session, subscription, sendResponse, sendError) => {
            /* istanbul ignore next */
            if (!request.monitoredItemIds || request.monitoredItemIds.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            /* istanbul ignore next */
            if (server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall > 0) {
                if (request.monitoredItemIds.length > server.engine.serverCapabilities.operationLimits.maxMonitoredItemsPerCall) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            const monitoringMode = request.monitoringMode;
            if (!isMonitoringModeValid(monitoringMode)) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadMonitoringModeInvalid);
            }
            const results = request.monitoredItemIds.map((monitoredItemId) => {
                const monitoredItem = subscription.getMonitoredItem(monitoredItemId);
                if (!monitoredItem) {
                    return node_opcua_status_code_1.StatusCodes.BadMonitoredItemIdInvalid;
                }
                monitoredItem.setMonitoringMode(monitoringMode);
                return node_opcua_status_code_1.StatusCodes.Good;
            });
            const response = new node_opcua_service_subscription_1.SetMonitoringModeResponse({
                results
            });
            sendResponse(response);
        });
    }
    // _on_TranslateBrowsePathsToNodeIds service
    _on_TranslateBrowsePathsToNodeIdsRequest(message, channel) {
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_translate_browse_path_1.TranslateBrowsePathsToNodeIdsRequest);
        const server = this;
        this._apply_on_SessionObject(node_opcua_service_translate_browse_path_1.TranslateBrowsePathsToNodeIdsResponse, message, channel, (session, sendResponse, sendError) => {
            if (!request.browsePaths || request.browsePaths.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerTranslateBrowsePathsToNodeIds > 0) {
                if (request.browsePaths.length > server.engine.serverCapabilities.operationLimits.maxNodesPerTranslateBrowsePathsToNodeIds) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            const browsePathsResults = request.browsePaths.map((browsePath) => server.engine.browsePath(browsePath));
            const response = new node_opcua_service_translate_browse_path_1.TranslateBrowsePathsToNodeIdsResponse({
                diagnosticInfos: null,
                results: browsePathsResults
            });
            sendResponse(response);
        });
    }
    // Call Service Result Codes
    // Symbolic Id Description
    // Bad_NothingToDo       See Table 165 for the description of this result code.
    // Bad_TooManyOperations See Table 165 for the description of this result code.
    //
    _on_CallRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_call_1.CallRequest);
        this._apply_on_SessionObject(node_opcua_service_call_1.CallResponse, message, channel, (session, sendResponse, sendError) => {
            let response;
            if (!request.methodsToCall || request.methodsToCall.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadNothingToDo);
            }
            // the MaxNodesPerMethodCall Property indicates the maximum size of the methodsToCall array when
            // a Client calls the Call Service.
            let maxNodesPerMethodCall = server.engine.serverCapabilities.operationLimits.maxNodesPerMethodCall;
            maxNodesPerMethodCall = maxNodesPerMethodCall <= 0 ? 1000 : maxNodesPerMethodCall;
            if (request.methodsToCall.length > maxNodesPerMethodCall) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
            }
            /* jshint validthis: true */
            const addressSpace = server.engine.addressSpace;
            async.map(request.methodsToCall, node_opcua_address_space_1.callMethodHelper.bind(null, server, session, addressSpace), (err, results) => {
                /* istanbul ignore next */
                if (err) {
                    errorLog("ERROR in method Call !! ", err);
                }
                node_opcua_assert_1.assert(_.isArray(results));
                response = new node_opcua_service_call_1.CallResponse({
                    results: results
                });
                sendResponse(response);
            });
        });
    }
    _on_RegisterNodesRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_register_node_1.RegisterNodesRequest);
        this._apply_on_SessionObject(node_opcua_service_register_node_1.RegisterNodesResponse, message, channel, (session, sendResponse, sendError) => {
            let response;
            if (!request.nodesToRegister || request.nodesToRegister.length === 0) {
                response = new node_opcua_service_register_node_1.RegisterNodesResponse({ responseHeader: { serviceResult: node_opcua_status_code_1.StatusCodes.BadNothingToDo } });
                return sendResponse(response);
            }
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerRegisterNodes > 0) {
                if (request.nodesToRegister.length > server.engine.serverCapabilities.operationLimits.maxNodesPerRegisterNodes) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            // A list of NodeIds which the Client shall use for subsequent access operations. The
            // size and order of this list matches the size and order of the nodesToRegister
            // request parameter.
            // The Server may return the NodeId from the request or a new (an alias) NodeId. It
            // is recommended that the Server return a numeric NodeIds for aliasing.
            // In case no optimization is supported for a Node, the Server shall return the
            // NodeId from the request.
            const registeredNodeIds = request.nodesToRegister.map((nodeId) => session.registerNode(nodeId));
            response = new node_opcua_service_register_node_1.RegisterNodesResponse({
                registeredNodeIds
            });
            sendResponse(response);
        });
    }
    _on_UnregisterNodesRequest(message, channel) {
        const server = this;
        const request = message.request;
        node_opcua_assert_1.assert(request instanceof node_opcua_service_register_node_1.UnregisterNodesRequest);
        this._apply_on_SessionObject(node_opcua_service_register_node_1.UnregisterNodesResponse, message, channel, (session, sendResponse, sendError) => {
            let response;
            request.nodesToUnregister = request.nodesToUnregister || [];
            if (!request.nodesToUnregister || request.nodesToUnregister.length === 0) {
                response = new node_opcua_service_register_node_1.UnregisterNodesResponse({ responseHeader: { serviceResult: node_opcua_status_code_1.StatusCodes.BadNothingToDo } });
                return sendResponse(response);
            }
            if (server.engine.serverCapabilities.operationLimits.maxNodesPerRegisterNodes > 0) {
                if (request.nodesToUnregister.length >
                    server.engine.serverCapabilities.operationLimits.maxNodesPerRegisterNodes) {
                    return sendError(node_opcua_status_code_1.StatusCodes.BadTooManyOperations);
                }
            }
            request.nodesToUnregister.map((nodeId) => session.unRegisterNode(nodeId));
            response = new node_opcua_service_register_node_1.UnregisterNodesResponse({});
            sendResponse(response);
        });
    }
    /* istanbul ignore next */
    _on_Cancel(message, channel) {
        return g_sendError(channel, message, node_opcua_types_1.CancelResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
    // NodeManagement Service Set Overview
    // This Service Set defines Services to add and delete AddressSpace Nodes and References between them. All added
    // Nodes continue to exist in the AddressSpace even if the Client that created them disconnects from the Server.
    //
    /* istanbul ignore next */
    _on_AddNodes(message, channel) {
        return g_sendError(channel, message, node_opcua_service_node_management_1.AddNodesResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
    /* istanbul ignore next */
    _on_AddReferences(message, channel) {
        return g_sendError(channel, message, node_opcua_service_node_management_1.AddReferencesResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
    /* istanbul ignore next */
    _on_DeleteNodes(message, channel) {
        return g_sendError(channel, message, node_opcua_service_node_management_1.DeleteNodesResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
    /* istanbul ignore next */
    _on_DeleteReferences(message, channel) {
        return g_sendError(channel, message, node_opcua_service_node_management_1.DeleteReferencesResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
    // Query Service
    /* istanbul ignore next */
    _on_QueryFirst(message, channel) {
        return g_sendError(channel, message, node_opcua_service_query_1.QueryFirstResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
    /* istanbul ignore next */
    _on_QueryNext(message, channel) {
        return g_sendError(channel, message, node_opcua_service_query_1.QueryNextResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
    /* istanbul ignore next */
    _on_HistoryUpdate(message, channel) {
        return g_sendError(channel, message, node_opcua_service_history_1.HistoryUpdateResponse, node_opcua_status_code_1.StatusCodes.BadNotImplemented);
    }
}
exports.OPCUAServer = OPCUAServer;
OPCUAServer.registry = new node_opcua_object_registry_1.ObjectRegistry();
OPCUAServer.fallbackSessionName = "Client didn't provide a meaningful sessionName ...";
/**
 * the maximum number of subscription that can be created per server
 */
OPCUAServer.MAX_SUBSCRIPTION = 50;
// tslint:disable:no-var-requires
const thenify = require("thenify");
const opts = { multiArgs: false };
OPCUAServer.prototype.start = thenify.withCallback(OPCUAServer.prototype.start, opts);
OPCUAServer.prototype.initialize = thenify.withCallback(OPCUAServer.prototype.initialize, opts);
OPCUAServer.prototype.shutdown = thenify.withCallback(OPCUAServer.prototype.shutdown, opts);
//# sourceMappingURL=opcua_server.js.map