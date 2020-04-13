"use strict";
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
/**
 * @module node-opcua-server-discovery
 */
const chalk_1 = require("chalk");
const fs = require("fs");
const path = require("path");
const _ = require("underscore");
const url = require("url");
const util_1 = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_common_1 = require("node-opcua-common");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_hostname_1 = require("node-opcua-hostname");
const node_opcua_server_1 = require("node-opcua-server");
const node_opcua_service_discovery_1 = require("node-opcua-service-discovery");
const node_opcua_service_endpoints_1 = require("node-opcua-service-endpoints");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const mdns_responder_1 = require("./mdns_responder");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
function constructFilename(p) {
    const filename = path.join(__dirname, "..", p);
    return filename;
}
function hasCapabilities(serverCapabilities, serverCapabilityFilter) {
    if (serverCapabilities == null) {
        return true; // filter is empty => no filtering should take place
    }
    if (serverCapabilityFilter.length === 0) {
        return true; // filter is empty => no filtering should take place
    }
    return !!serverCapabilities.join(" ").match(serverCapabilityFilter);
}
class OPCUADiscoveryServer extends node_opcua_server_1.OPCUABaseServer {
    constructor(options) {
        const default_certificate_file = constructFilename("certificates/server_selfsigned_cert_2048.pem");
        options.certificateFile = options.certificateFile || default_certificate_file;
        node_opcua_assert_1.assert(fs.existsSync(options.certificateFile));
        const default_private_key_file = constructFilename("certificates/PKI/own/private/private_key.pem");
        options.privateKeyFile = options.privateKeyFile || default_private_key_file;
        node_opcua_assert_1.assert(fs.existsSync(options.certificateFile));
        const defaultApplicationUri = node_opcua_common_1.makeApplicationUrn("%FQDN%", "NodeOPCUA-DiscoveryServer");
        options.serverInfo = options.serverInfo || {};
        const serverInfo = options.serverInfo;
        serverInfo.applicationType = node_opcua_service_endpoints_1.ApplicationType.DiscoveryServer;
        serverInfo.applicationUri = serverInfo.applicationUri || defaultApplicationUri;
        serverInfo.productUri = serverInfo.productUri || "NodeOPCUA-DiscoveryServer";
        serverInfo.applicationName = serverInfo.applicationName || { text: "NodeOPCUA-DiscoveryServer", locale: null };
        serverInfo.gatewayServerUri = serverInfo.gatewayServerUri || "";
        serverInfo.discoveryProfileUri = serverInfo.discoveryProfileUri || "";
        serverInfo.discoveryUrls = serverInfo.discoveryUrls || [];
        super(options);
        this.bonjourHolder = new node_opcua_service_discovery_1.BonjourHolder();
        const port = options.port || 4840;
        this.capabilitiesForMDNS = ["LDS"];
        this.registeredServers = {};
        this.mDnsResponder = undefined;
        // see OPC UA Spec 1.2 part 6 : 7.4 Well Known Addresses
        // opc.tcp://localhost:4840/UADiscovery
        this._delayInit = () => {
            const endPoint = new node_opcua_server_1.OPCUATCPServerEndPoint({
                port,
                certificateChain: this.getCertificateChain(),
                certificateManager: this.serverCertificateManager,
                privateKey: this.getPrivateKey(),
                serverInfo: this.serverInfo
            });
            endPoint.addStandardEndpointDescriptions();
            this.endpoints.push(endPoint);
            endPoint.on("message", (message, channel) => {
                if (doDebug) {
                    debugLog(" RECEIVE MESSAGE", message.request.constructor.name);
                }
                this.on_request(message, channel);
            });
        };
    }
    start(done) {
        node_opcua_assert_1.assert(!this.mDnsResponder);
        node_opcua_assert_1.assert(_.isArray(this.capabilitiesForMDNS));
        util_1.callbackify(node_opcua_hostname_1.extractFullyQualifiedDomainName)((err1, fqdn) => {
            if (this._delayInit) {
                this._delayInit();
                this._delayInit = undefined;
            }
            super.start((err) => {
                if (err) {
                    return done(err);
                }
                this.mDnsResponder = new mdns_responder_1.MDNSResponder();
                // declare discovery server in bonjour
                this.bonjourHolder._announcedOnMulticastSubnetWithCallback({
                    capabilities: this.capabilitiesForMDNS,
                    name: this.serverInfo.applicationUri,
                    path: "/DiscoveryServer",
                    port: this.endpoints[0].port
                }, (err2) => {
                    done(err2);
                });
            });
        });
    }
    shutdown(done) {
        if (this.mDnsResponder) {
            this.mDnsResponder.dispose();
            this.mDnsResponder = undefined;
        }
        debugLog("stopping announcement of LDS on mDNS");
        this.bonjourHolder._stop_announcedOnMulticastSubnetWithCallback(() => {
            debugLog("stopping announcement of LDS on mDNS - DONE");
            debugLog("Shutting down Discovery Server");
            super.shutdown(done);
        });
    }
    /**
     * returns the number of registered servers
     */
    get registeredServerCount() {
        return Object.keys(this.registeredServers).length;
    }
    getServers(channel) {
        this.serverInfo.discoveryUrls = this.getDiscoveryUrls();
        const servers = [this.serverInfo];
        for (const registered_server of Object.values(this.registeredServers)) {
            const serverInfo = registered_server.serverInfo;
            servers.push(serverInfo);
        }
        return servers;
    }
    _on_RegisterServer2Request(message, channel) {
        node_opcua_assert_1.assert(message.request instanceof node_opcua_service_discovery_1.RegisterServer2Request);
        const request = message.request;
        node_opcua_assert_1.assert(request.schema.name === "RegisterServer2Request");
        request.discoveryConfiguration = request.discoveryConfiguration || [];
        this.__internalRegisterServerWithCallback(node_opcua_service_discovery_1.RegisterServer2Response, request.server, request.discoveryConfiguration, (err, response) => {
            node_opcua_assert_1.assert(response instanceof node_opcua_service_discovery_1.RegisterServer2Response);
            channel.send_response("MSG", response, message);
        });
    }
    _on_RegisterServerRequest(message, channel) {
        node_opcua_assert_1.assert(message.request instanceof node_opcua_service_discovery_1.RegisterServerRequest);
        const request = message.request;
        node_opcua_assert_1.assert(request.schema.name === "RegisterServerRequest");
        this.__internalRegisterServerWithCallback(node_opcua_service_discovery_1.RegisterServerResponse, request.server, undefined, (err, response) => {
            node_opcua_assert_1.assert(response instanceof node_opcua_service_discovery_1.RegisterServerResponse);
            channel.send_response("MSG", response, message);
        });
    }
    _on_FindServersOnNetworkRequest(message, channel) {
        // from OPCUA 1.04 part 4
        // This Service returns the Servers known to a Discovery Server. Unlike FindServer, this Service is
        // only implemented by Discovery Servers.
        // The Client may reduce the number of results returned by specifying filter criteria. An empty list is
        // returned if no Server matches the criteria specified by the Client.
        // This Service shall not require message security but it may require transport layer security.
        // Each time the Discovery Server creates or updates a record in its cache it shall assign a
        // monotonically increasing identifier to the record. This allows Clients to request records in batches
        // by specifying the identifier for the last record received in the last call to FindServersOnNetwork.
        // To support this the Discovery Server shall return records in numerical order starting from the
        // lowest record identifier. The Discovery Server shall also return the last time the counter was reset
        // for example due to a restart of the Discovery Server. If a Client detects that this time is more
        // recent than the last time the Client called the Service it shall call the Service again with a
        // startingRecordId of 0.
        // This Service can be used without security and it is therefore vulnerable to Denial Of Service
        // (DOS) attacks. A Server should minimize the amount of processing required to send the response
        // for this Service. This can be achieved by preparing the result in advance
        node_opcua_assert_1.assert(message.request instanceof node_opcua_service_discovery_1.FindServersOnNetworkRequest);
        const request = message.request;
        node_opcua_assert_1.assert(request.schema.name === "FindServersOnNetworkRequest");
        function sendError(statusCode) {
            const response1 = new node_opcua_service_discovery_1.FindServersOnNetworkResponse({ responseHeader: { serviceResult: statusCode } });
            return channel.send_response("MSG", response1, message);
        }
        //     startingRecordId         Counter Only records with an identifier greater than this number will be
        //                              returned.
        //                              Specify 0 to start with the first record in the cache.
        //     maxRecordsToReturn       UInt32 The maximum number of records to return in the response.
        //                              0 indicates that there is no limit.
        //     serverCapabilityFilter[] String List of Server capability filters. The set of allowed server capabilities
        //                              are defined in Part 12.
        //                              Only records with all of the specified server capabilities are
        //                              returned.
        //                              The comparison is case insensitive.
        //                              If this list is empty then no filtering is performed
        // ------------------------
        // The last time the counters were reset.
        const lastCounterResetTime = new Date();
        //  servers[] ServerOnNetwork List of DNS service records that meet criteria specified in the
        // request. This list is empty if no Servers meet the criteria
        const servers = [];
        request.serverCapabilityFilter = request.serverCapabilityFilter || [];
        const serverCapabilityFilter = request.serverCapabilityFilter.map((x) => x.toUpperCase()).sort().join(" ");
        debugLog(" startingRecordId = ", request.startingRecordId);
        if (this.mDnsResponder) {
            for (const server of this.mDnsResponder.registeredServers) {
                if (server.recordId <= request.startingRecordId) {
                    continue;
                }
                if (!hasCapabilities(server.serverCapabilities, serverCapabilityFilter)) {
                    continue;
                }
                servers.push(server);
                if (servers.length === request.maxRecordsToReturn) {
                    break;
                }
            }
        }
        const response = new node_opcua_service_discovery_1.FindServersOnNetworkResponse({
            lastCounterResetTime,
            servers
        });
        channel.send_response("MSG", response, message);
    }
    __internalRegisterServerWithCallback(RegisterServerXResponse /* RegisterServer2Response | RegisterServerResponse */, rawServer, discoveryConfigurations, callback) {
        return __awaiter(this, void 0, void 0, function* () {
            callback(new Error("internal Error"));
        });
    }
    __internalRegisterServer(RegisterServerXResponse /* RegisterServer2Response | RegisterServerResponse */, rawServer, discoveryConfigurations) {
        return __awaiter(this, void 0, void 0, function* () {
            const server = rawServer;
            if (!discoveryConfigurations) {
                discoveryConfigurations = [new node_opcua_service_discovery_1.MdnsDiscoveryConfiguration({
                        mdnsServerName: undefined,
                        serverCapabilities: ["NA"]
                    })];
            }
            function sendError(statusCode) {
                debugLog(chalk_1.default.red("_on_RegisterServer(2)Request error"), statusCode.toString());
                const response1 = new RegisterServerXResponse({
                    responseHeader: { serviceResult: statusCode }
                });
                return response1;
            }
            function _stop_announcedOnMulticastSubnet(conf) {
                return __awaiter(this, void 0, void 0, function* () {
                    const b = (conf.bonjourHolder);
                    yield b._stop_announcedOnMulticastSubnet();
                    conf.bonjourHolder = undefined;
                });
            }
            function _announcedOnMulticastSubnet(conf, announcement) {
                return __awaiter(this, void 0, void 0, function* () {
                    let b = (conf.bonjourHolder);
                    if (b) {
                        if (node_opcua_service_discovery_1.sameAnnouncement(b.announcement, announcement)) {
                            debugLog("Configuration ", conf.mdnsServerName, " has not changed !");
                            // nothing to do
                            return;
                        }
                        else {
                            debugLog("Configuration ", conf.mdnsServerName, " HAS changed !");
                            debugLog(" Was ", b.announcement);
                            debugLog(" is  ", announcement);
                        }
                        yield _stop_announcedOnMulticastSubnet(conf);
                    }
                    b = new node_opcua_service_discovery_1.BonjourHolder();
                    (conf.bonjourHolder) = b;
                    yield b._announcedOnMulticastSubnet(announcement);
                });
            }
            function dealWithDiscoveryConfiguration(previousConfMap, server1, serverInfo, discoveryConfiguration) {
                return __awaiter(this, void 0, void 0, function* () {
                    // mdnsServerName     String     The name of the Server when it is announced via mDNS.
                    //                               See Part 12 for the details about mDNS. This string shall be less than 64 bytes.
                    //                               If not specified the first element of the serverNames array is used
                    //                               (truncated to 63 bytes if necessary).
                    // serverCapabilities [] String  The set of Server capabilities supported by the Server.
                    //                               A Server capability is a short identifier for a feature
                    //                               The set of allowed Server capabilities are defined in Part 12.
                    discoveryConfiguration.mdnsServerName = discoveryConfiguration.mdnsServerName || server1.serverNames[0].text;
                    serverInfo.discoveryUrls = serverInfo.discoveryUrls || [];
                    const endpointUrl = serverInfo.discoveryUrls[0];
                    const parsedUrl = url.parse(endpointUrl);
                    discoveryConfiguration.serverCapabilities = discoveryConfiguration.serverCapabilities || [];
                    const announcement = {
                        capabilities: discoveryConfiguration.serverCapabilities.map((x) => x) || ["DA"],
                        name: discoveryConfiguration.mdnsServerName,
                        path: parsedUrl.pathname || "/",
                        port: parseInt(parsedUrl.port, 10)
                    };
                    if (previousConfMap[discoveryConfiguration.mdnsServerName]) {
                        // configuration already exists
                        debugLog("Configuration ", discoveryConfiguration.mdnsServerName, " already exists !");
                        const prevConf = previousConfMap[discoveryConfiguration.mdnsServerName];
                        delete previousConfMap[discoveryConfiguration.mdnsServerName];
                        discoveryConfiguration.bonjourHolder = prevConf.bonjourHolder;
                    }
                    // let's announce the server on the  multicast DNS
                    yield _announcedOnMulticastSubnet(discoveryConfiguration, announcement);
                    return node_opcua_status_code_1.StatusCodes.Good;
                });
            }
            // check serverType is valid
            if (!_isValidServerType(server.serverType)) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadInvalidArgument);
            }
            if (!server.serverUri) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadInvalidArgument);
            }
            // BadServerUriInvalid
            // TODO
            server.serverNames = server.serverNames || [];
            // BadServerNameMissing
            if (server.serverNames.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadServerNameMissing);
            }
            // BadDiscoveryUrlMissing
            server.discoveryUrls = server.discoveryUrls || [];
            if (server.discoveryUrls.length === 0) {
                return sendError(node_opcua_status_code_1.StatusCodes.BadDiscoveryUrlMissing);
            }
            const key = server.serverUri;
            let configurationResults = null;
            if (server.isOnline) {
                debugLog(chalk_1.default.cyan(" registering server : "), chalk_1.default.yellow(server.serverUri));
                // prepare serverInfo which will be used by FindServers
                const serverInfo = {
                    applicationName: server.serverNames[0],
                    applicationType: server.serverType,
                    applicationUri: server.serverUri,
                    discoveryUrls: server.discoveryUrls,
                    gatewayServerUri: server.gatewayServerUri,
                    productUri: server.productUri
                    // XXX ?????? serverInfo.discoveryProfileUri = serverInfo.discoveryProfileUri;
                };
                const previousConfMap = [];
                if (this.registeredServers[key]) {
                    // server already exists and must only be updated
                    const previousServer = this.registeredServers[key];
                    for (const conf of previousServer.discoveryConfiguration) {
                        previousConfMap[conf.mdnsServerName] = conf;
                    }
                }
                this.registeredServers[key] = server;
                // xx server.semaphoreFilePath = server.semaphoreFilePath;
                // xx server.serverNames = server.serverNames;
                server.serverInfo = serverInfo;
                server.discoveryConfiguration = discoveryConfigurations;
                node_opcua_assert_1.assert(discoveryConfigurations);
                configurationResults = [];
                for (const conf of discoveryConfigurations) {
                    const statusCode = yield dealWithDiscoveryConfiguration(previousConfMap, server, serverInfo, conf);
                    configurationResults.push(statusCode);
                }
                // now also unregister unprocessed
                if (Object.keys(previousConfMap).length !== 0) {
                    debugLog(" Warning some conf need to be removed !");
                }
            }
            else {
                // server is announced offline
                if (key in this.registeredServers) {
                    const server1 = this.registeredServers[key];
                    debugLog(chalk_1.default.cyan("unregistering server : "), chalk_1.default.yellow(server1.serverUri));
                    configurationResults = [];
                    discoveryConfigurations = server1.discoveryConfiguration || [];
                    for (const conf of discoveryConfigurations) {
                        yield _stop_announcedOnMulticastSubnet(conf);
                        configurationResults.push(node_opcua_status_code_1.StatusCodes.Good);
                    }
                    delete this.registeredServers[key];
                }
            }
            const response = new RegisterServerXResponse({
                configurationResults
            });
            return response;
        });
    }
}
exports.OPCUADiscoveryServer = OPCUADiscoveryServer;
/*== private
 * returns true if the serverType can be added to a discovery server.
 * @param serverType
 * @return {boolean}
 * @private
 */
function _isValidServerType(serverType) {
    switch (serverType) {
        case node_opcua_service_endpoints_1.ApplicationType.Client:
            return false;
        case node_opcua_service_endpoints_1.ApplicationType.Server:
        case node_opcua_service_endpoints_1.ApplicationType.ClientAndServer:
        case node_opcua_service_endpoints_1.ApplicationType.DiscoveryServer:
            return true;
    }
    return false;
}
OPCUADiscoveryServer.prototype.__internalRegisterServerWithCallback =
    util_1.callbackify(OPCUADiscoveryServer.prototype.__internalRegisterServer);
const thenify = require("thenify");
const opts = { multiArgs: false };
OPCUADiscoveryServer.prototype.start = thenify.withCallback(OPCUADiscoveryServer.prototype.start, opts);
OPCUADiscoveryServer.prototype.shutdown = thenify.withCallback(OPCUADiscoveryServer.prototype.shutdown, opts);
//# sourceMappingURL=opcua_discovery_server.js.map