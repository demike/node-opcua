/// <reference types="node" />
import { EventEmitter } from "events";
import { IUserManager, PseudoVariantBoolean, PseudoVariantByteString, PseudoVariantDateTime, PseudoVariantDuration, PseudoVariantExtensionObject, PseudoVariantExtensionObjectArray, PseudoVariantLocalizedText, PseudoVariantNodeId, PseudoVariantString, RaiseEventData } from "node-opcua-address-space";
import { OPCUACertificateManager } from "node-opcua-certificate-manager";
import { Certificate, Nonce } from "node-opcua-crypto";
import { NodeId } from "node-opcua-nodeid";
import { ObjectRegistry } from "node-opcua-object-registry";
import { Message, MessageSecurityMode, Request, Response, SecurityPolicy, ServerSecureChannelLayer, SignatureData } from "node-opcua-secure-channel";
import { UserNameIdentityToken, X509IdentityToken } from "node-opcua-service-session";
import { StatusCode } from "node-opcua-status-code";
import { ApplicationDescriptionOptions, BuildInfo, UserIdentityToken } from "node-opcua-types";
import { OPCUABaseServer, OPCUABaseServerOptions } from "./base_server";
import { IRegisterServerManager } from "./I_register_server_manager";
import { ServerCapabilitiesOptions } from "./server_capabilities";
import { ServerEngine } from "./server_engine";
import { ServerSession } from "./server_session";
import { Subscription } from "./server_subscription";
export declare type ValidUserFunc = (this: ServerSession, username: string, password: string) => boolean;
export declare type ValidUserAsyncFunc = (this: ServerSession, username: string, password: string, callback: (err: Error | null, isAuthorized?: boolean) => void) => void;
export declare type GetUserRoleFunc = (username: string) => string;
export interface UserManagerOptions extends IUserManager {
    /** synchronous function to check the credentials - can be overruled by isValidUserAsync */
    isValidUser?: ValidUserFunc;
    /** asynchronous function to check if the credentials - overrules isValidUser */
    isValidUserAsync?: ValidUserAsyncFunc;
    /**  synchronous function to return the role of the given user */
    getUserRole?: GetUserRoleFunc;
}
export declare enum RegisterServerMethod {
    HIDDEN = 1,
    MDNS = 2,
    LDS = 3
}
export declare enum TransportType {
    TCP = 1,
    WEBSOCKET = 2
}
export interface OPCUAServerEndpointOptions {
    /**
     * the transport type of this endpoint (default: TCP)
     */
    transportType?: TransportType;
    /**
     * the TCP port to listen to.
     * @default 26543
     */
    port?: number;
    /**
     * the possible security policies that the server will expose
     * @default  [SecurityPolicy.None, SecurityPolicy.Basic128Rsa15, SecurityPolicy.Basic256Sha256]
     */
    securityPolicies?: SecurityPolicy[];
    /**
     * the possible security mode that the server will expose
     * @default [MessageSecurityMode.None, MessageSecurityMode.Sign, MessageSecurityMode.SignAndEncrypt]
     */
    securityModes?: MessageSecurityMode[];
    /**
     * tells if the server default endpoints should allow anonymous connection.
     * @default true
     */
    allowAnonymous?: boolean;
    /** alternate hostname  or IP to use */
    alternateHostname?: string | string[];
    /**
     *  true, if discovery service on unsecure channel shall be disabled
     */
    disableDiscovery?: boolean;
}
export interface OPCUAServerOptions extends OPCUABaseServerOptions, OPCUAServerEndpointOptions {
    alternateEndpoints?: OPCUAServerEndpointOptions[];
    /**
     * the server certificate full path filename
     *
     * the certificate should be in PEM format
     */
    certificateFile?: string;
    /**
     * the server private key full path filename
     *
     * This file should contains the private key that has been used to generate
     * the server certificate file.
     *
     * the private key should be in PEM format
     *
     */
    privateKeyFile?: string;
    /**
     * the default secure token life time in ms.
     */
    defaultSecureTokenLifetime?: number;
    /**
     * the HEL/ACK transaction timeout in ms.
     *
     * Use a large value ( i.e 15000 ms) for slow connections or embedded devices.
     * @default 10000
     */
    timeout?: number;
    /**
     * the maximum number of simultaneous sessions allowed.
     * @default 10
     */
    maxAllowedSessionNumber?: number;
    /**
     * the maximum number authorized simultaneous connections per endpoint
     * @default 10
     */
    maxConnectionsPerEndpoint?: number;
    /**
     * the nodeset.xml file(s) to load
     *
     * node-opcua comes with pre-installed node-set files that can be used
     *
     * example:
     *
     * ``` javascript
     *
     * ```
     */
    nodeset_filename?: string[] | string;
    /**
     * the server Info
     *
     * this object contains the value that will populate the
     * Root/ObjectS/Server/ServerInfo OPCUA object in the address space.
     */
    serverInfo?: ApplicationDescriptionOptions;
    buildInfo?: {
        productName?: string;
        productUri?: string | null;
        manufacturerName?: string;
        softwareVersion?: string;
        buildNumber?: string;
        buildDate?: Date;
    };
    /**
     *  an object that implements user authentication methods
     */
    userManager?: UserManagerOptions;
    /** resource Path is a string added at the end of the url such as "/UA/Server" */
    resourcePath?: string;
    /**
     *
     */
    serverCapabilities?: ServerCapabilitiesOptions;
    /**
     * if server shall raise AuditingEvent
     * @default true
     */
    isAuditing?: boolean;
    /**
     * strategy used by the server to declare itself to a discovery server
     *
     * - HIDDEN: the server doesn't expose itself to the external world
     * - MDNS: the server publish itself to the mDNS Multicast network directly
     * - LDS: the server registers itself to the LDS or LDS-ME (Local Discovery Server)
     *
     *  @default  RegisterServerMethod.HIDDEN - by default the server
     *            will not register itself to the local discovery server
     *
     */
    registerServerMethod?: RegisterServerMethod;
    /**
     *
     * @default "opc.tcp://localhost:4840"]
     */
    discoveryServerEndpointUrl?: string;
    /**
     *
     *  supported server capabilities for the Mutlicast (mDNS)
     *  @default ["NA"]
     *  the possible values are any of node-opcua-discovery.serverCapabilities)
     *
     */
    capabilitiesForMDNS?: string[];
    /**
     * user Certificate Manager
     * this certificate manager holds the X509 certificates used
     * by client that uses X509 certificate token to impersonate a user
     */
    userCertificateManager?: OPCUACertificateManager;
    /**
     * Server Certificate Manager
     *
     * this certificate manager will be used by the server to access
     * and store certificates from the connecting clients
     */
    serverCertificateManager?: OPCUACertificateManager;
}
export interface OPCUAServer {
    /**
     *
     */
    engine: ServerEngine;
    /**
     *
     */
    registerServerMethod: RegisterServerMethod;
    /**
     *
     */
    discoveryServerEndpointUrl: string;
    /**
     *
     */
    registerServerManager?: IRegisterServerManager;
    /**
     *
     */
    capabilitiesForMDNS: string[];
    /**
     *
     */
    userCertificateManager: OPCUACertificateManager;
}
/**
 *
 */
export declare class OPCUAServer extends OPCUABaseServer {
    /**
     * total number of bytes written  by the server since startup
     */
    readonly bytesWritten: number;
    /**
     * total number of bytes read  by the server since startup
     */
    readonly bytesRead: number;
    /**
     * Number of transactions processed by the server since startup
     */
    readonly transactionsCount: number;
    /**
     * The server build info
     */
    readonly buildInfo: BuildInfo;
    /**
     * the number of connected channel on all existing end points
     */
    readonly currentChannelCount: number;
    /**
     * The number of active subscriptions from all sessions
     */
    readonly currentSubscriptionCount: number;
    /**
     * the number of session activation requests that have been rejected
     */
    readonly rejectedSessionCount: number;
    /**
     * the number of request that have been rejected
     */
    readonly rejectedRequestsCount: number;
    /**
     * the number of sessions that have been aborted
     */
    readonly sessionAbortCount: number;
    /**
     * the publishing interval count
     */
    readonly publishingIntervalCount: number;
    /**
     * the number of sessions currently active
     */
    readonly currentSessionCount: number;
    /**
     * true if the server has been initialized
     *
     */
    readonly initialized: boolean;
    /**
     * is the server auditing ?
     */
    readonly isAuditing: boolean;
    static registry: ObjectRegistry;
    static fallbackSessionName: string;
    /**
     * the maximum number of subscription that can be created per server
     */
    static MAX_SUBSCRIPTION: number;
    /**
     * the maximum number of concurrent sessions allowed on the server
     */
    maxAllowedSessionNumber: number;
    /**
     * the maximum number for concurrent connection per end point
     */
    maxConnectionsPerEndpoint: number;
    /**
     * false if anonymouse connection are not allowed
     */
    allowAnonymous: boolean;
    /**
     * the user manager
     */
    userManager: UserManagerOptions;
    private objectFactory?;
    private nonce;
    private protocolVersion;
    private _delayInit?;
    constructor(options?: OPCUAServerOptions);
    /**
     * Initialize the server by installing default node set.
     *
     * and instruct the server to listen to its endpoints.
     *
     * ```javascript
     * const server = new OPCUAServer();
     * await server.initialize();
     *
     * // default server namespace is now initialized
     * // it is a good time to create life instance objects
     * const namespace = server.engine.addressSpace.getOwnNamespace();
     * namespace.addObject({
     *     browseName: "SomeObject",
     *     organizedBy: server.engine.addressSpace.rootFolder.objects
     * });
     *
     * // the addressSpace is now complete
     * // let's now start listening to clients
     * await server.start();
     * ```
     */
    initialize(): Promise<void>;
    initialize(done: () => void): void;
    /**
     * Initiate the server by starting all its endpoints
     * @async
     */
    start(): Promise<void>;
    start(done: () => void): void;
    /**
     * shutdown all server endpoints
     * @method shutdown
     * @async
     * @param  timeout the timeout (in ms) before the server is actually shutdown
     *
     * @example
     *
     * ```javascript
     *    // shutdown immediately
     *    server.shutdown(function(err) {
     *    });
     * ```
     * ```ts
     *   // in typescript with async/await
     *   await server.shutdown();
     * ```
     * ```javascript
     *    // shutdown within 10 seconds
     *    server.shutdown(10000,function(err) {
     *    });
     *   ```
     */
    shutdown(timeout?: number): Promise<void>;
    shutdown(callback: (err?: Error) => void): void;
    shutdown(timeout: number, callback: (err?: Error) => void): void;
    dispose(): void;
    /**
     * create and register a new session
     * @internal
     */
    protected createSession(options: any): ServerSession;
    /**
     * retrieve a session by authentication token
     * @internal
     */
    protected getSession(authenticationToken: NodeId, activeOnly?: boolean): ServerSession | null;
    /**
     *
     * @param channel
     * @param clientCertificate
     * @param clientNonce
     * @internal
     */
    protected computeServerSignature(channel: ServerSecureChannelLayer, clientCertificate: Certificate, clientNonce: Nonce): SignatureData | undefined;
    /**
     *
     * @param session
     * @param channel
     * @param clientSignature
     * @internal
     */
    protected verifyClientSignature(session: ServerSession, channel: ServerSecureChannelLayer, clientSignature: SignatureData): boolean;
    protected isValidUserNameIdentityToken(channel: ServerSecureChannelLayer, session: ServerSession, userTokenPolicy: any, userIdentityToken: UserNameIdentityToken, userTokenSignature: any, callback: (err: Error | null, statusCode?: StatusCode) => void): void;
    protected isValidX509IdentityToken(channel: ServerSecureChannelLayer, session: ServerSession, userTokenPolicy: any, userIdentityToken: X509IdentityToken, userTokenSignature: any, callback: (err: Error | null, statusCode?: StatusCode) => void): void;
    /**
     * @internal
     */
    protected userNameIdentityTokenAuthenticateUser(channel: ServerSecureChannelLayer, session: ServerSession, userTokenPolicy: any, userIdentityToken: UserNameIdentityToken, callback: (err: Error | null, isAuthorized?: boolean) => void): void;
    /**
     * @internal
     */
    protected isValidUserIdentityToken(channel: ServerSecureChannelLayer, session: ServerSession, userIdentityToken: UserIdentityToken, userTokenSignature: any, callback: (err: Error | null, statusCode?: StatusCode) => void): void;
    /**
     *
     * @internal
     * @param channel
     * @param session
     * @param userIdentityToken
     * @param callback
     * @returns {*}
     */
    protected isUserAuthorized(channel: ServerSecureChannelLayer, session: ServerSession, userIdentityToken: UserIdentityToken, callback: (err: Error | null, isAuthorized?: boolean) => void): void;
    protected makeServerNonce(): Nonce;
    protected _on_CreateSessionRequest(message: any, channel: ServerSecureChannelLayer): void;
    /**
     *
     * @method _on_ActivateSessionRequest
     * @private
     *
     *
     */
    protected _on_ActivateSessionRequest(message: any, channel: ServerSecureChannelLayer): void;
    protected prepare(message: Message, channel: ServerSecureChannelLayer): void;
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
    protected _apply_on_SessionObject(ResponseClass: any, message: any, channel: ServerSecureChannelLayer, action_to_perform: any): void;
    /**
     * @method _apply_on_Subscription
     * @param ResponseClass
     * @param message
     * @param channel
     * @param action_to_perform
     * @private
     */
    protected _apply_on_Subscription(ResponseClass: any, message: any, channel: ServerSecureChannelLayer, action_to_perform: any): void;
    /**
     * @method _apply_on_SubscriptionIds
     * @param ResponseClass
     * @param message
     * @param channel
     * @param action_to_perform
     * @private
     */
    protected _apply_on_SubscriptionIds(ResponseClass: any, message: any, channel: ServerSecureChannelLayer, action_to_perform: any): void;
    /**
     * @method _apply_on_Subscriptions
     * @param ResponseClass
     * @param message
     * @param channel
     * @param action_to_perform
     * @private
     */
    protected _apply_on_Subscriptions(ResponseClass: any, message: any, channel: ServerSecureChannelLayer, action_to_perform: (session: ServerSession, subscription: Subscription) => void): void;
    /**
     * @method _on_CloseSessionRequest
     * @param message
     * @param channel
     * @private
     */
    protected _on_CloseSessionRequest(message: Message, channel: ServerSecureChannelLayer): void;
    /**
     * @method _on_BrowseRequest
     * @param message
     * @param channel
     * @private
     */
    protected _on_BrowseRequest(message: Message, channel: ServerSecureChannelLayer): void;
    /**
     * @method _on_BrowseNextRequest
     * @param message
     * @param channel
     * @private
     */
    protected _on_BrowseNextRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_ReadRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_HistoryReadRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_WriteRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_CreateSubscriptionRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_DeleteSubscriptionsRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_TransferSubscriptionsRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_CreateMonitoredItemsRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_ModifySubscriptionRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_ModifyMonitoredItemsRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_PublishRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_SetPublishingModeRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_DeleteMonitoredItemsRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_RepublishRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_SetMonitoringModeRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_TranslateBrowsePathsToNodeIdsRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_CallRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_RegisterNodesRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_UnregisterNodesRequest(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_Cancel(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_AddNodes(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_AddReferences(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_DeleteNodes(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_DeleteReferences(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_QueryFirst(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_QueryNext(message: Message, channel: ServerSecureChannelLayer): void;
    protected _on_HistoryUpdate(message: Message, channel: ServerSecureChannelLayer): void;
}
export interface RaiseEventAuditEventData extends RaiseEventData {
    actionTimeStamp: PseudoVariantDateTime;
    status: PseudoVariantBoolean;
    serverId: PseudoVariantString;
    /**
     * ClientAuditEntryId contains the human-readable AuditEntryId defined in Part 3.
     */
    clientAuditEntryId: PseudoVariantString;
    /**
     * The ClientUserId identifies the user of the client requesting an action. The ClientUserId can be
     * obtained from the UserIdentityToken passed in the ActivateSession call.
     */
    clientUserId: PseudoVariantString;
    sourceName: PseudoVariantString;
}
export interface RaiseEventAuditUpdateMethodEventData extends RaiseEventAuditEventData {
    methodId: PseudoVariantNodeId;
    inputArguments: any;
}
export interface RaiseEventAuditConditionCommentEventData extends RaiseEventAuditUpdateMethodEventData {
    eventId: PseudoVariantByteString;
    comment: PseudoVariantLocalizedText;
}
export interface RaiseEventAuditSessionEventData extends RaiseEventAuditEventData {
    /**
     *  part 5 - 6.4.7 AuditSessionEventType
     */
    sessionId: PseudoVariantNodeId;
}
export interface RaiseEventAuditCreateSessionEventData extends RaiseEventAuditSessionEventData {
    /**
     *  part 5 - 6.4.8 AuditCreateSessionEventType
     *  SecureChannelId shall uniquely identify the SecureChannel.
     *  The application shall use the same identifier in
     *  all AuditEvents related to the Session Service Set (AuditCreateSessionEventType, AuditActivateSessionEventType
     *  and their subtypes) and the SecureChannel Service Set (AuditChannelEventType and its subtype
     */
    secureChannelId: PseudoVariantString;
    revisedSessionTimeout: PseudoVariantDuration;
    clientCertificate: PseudoVariantByteString;
    clientCertificateThumbprint: PseudoVariantByteString;
}
export interface RaiseEventAuditActivateSessionEventData extends RaiseEventAuditSessionEventData {
    /**
     * part 5 - 6.4.10 AuditActivateSessionEventType
     */
    clientSoftwareCertificates: PseudoVariantExtensionObjectArray;
    /**
     * UserIdentityToken reflects the userIdentityToken parameter of the ActivateSession Service call.
     * For Username/Password tokens the password should NOT be included.
     */
    userIdentityToken: PseudoVariantExtensionObject;
    /**
     * SecureChannelId shall uniquely identify the SecureChannel. The application shall use the same identifier
     * in all AuditEvents related to the Session Service Set (AuditCreateSessionEventType,
     * AuditActivateSessionEventType and their subtypes) and the SecureChannel Service Set
     * (AuditChannelEventType and its subtypes).
     */
    secureChannelId: PseudoVariantString;
}
export interface RaiseEventTransitionEventData extends RaiseEventData {
}
export interface OPCUAServer {
    /**
     * @internal
     * @param eventType
     * @param options
     */
    raiseEvent(eventType: "AuditSessionEventType", options: RaiseEventAuditSessionEventData): void;
    raiseEvent(eventType: "AuditCreateSessionEventType", options: RaiseEventAuditCreateSessionEventData): void;
    raiseEvent(eventType: "AuditActivateSessionEventType", options: RaiseEventAuditActivateSessionEventData): void;
    raiseEvent(eventType: "AuditCreateSessionEventType", options: RaiseEventData): void;
    raiseEvent(eventType: "AuditConditionCommentEventType", options: RaiseEventAuditConditionCommentEventData): void;
    raiseEvent(eventType: "TransitionEventType", options: RaiseEventTransitionEventData): void;
}
export interface OPCUAServer extends EventEmitter {
    on(event: "create_session", eventHandler: (session: ServerSession) => void): this;
    on(event: "session_closed", eventHandler: (session: ServerSession, reason: string) => void): this;
    on(event: "post_initialize", eventHandler: () => void): void;
    /**
     * emitted when the server is trying to registered the LDS
     * but when the connection to the lds has failed
     * serverRegistrationPending is sent when the backoff signal of the
     * connection process is raised
     * @event serverRegistrationPending
     */
    on(event: "serverRegistrationPending", eventHandler: () => void): void;
    /**
     * event raised when server  has been successfully registered on the local discovery server
     * @event serverRegistered
     */
    on(event: "serverRegistered", eventHandler: () => void): void;
    /**
     * event raised when server registration has been successfully renewed on the local discovery server
     * @event serverRegistered
     */
    on(event: "serverRegistrationRenewed", eventHandler: () => void): void;
    /**
     * event raised when server  has been successfully unregistered from the local discovery server
     * @event serverUnregistered
     */
    on(event: "serverUnregistered", eventHandler: () => void): void;
    /**
     * event raised after the server has raised an OPCUA event toward a client
     */
    on(event: "event", eventHandler: (eventData: any) => void): void;
    /**
     * event raised when the server received a request from one of its connected client.
     * useful for trace purpose.
     */
    on(event: "request", eventHandler: (request: Request, channel: ServerSecureChannelLayer) => void): void;
    /**
     * event raised when the server send an response to a request to one of its connected client.
     * useful for trace purpose.
     */
    on(event: "response", eventHandler: (request: Response, channel: ServerSecureChannelLayer) => void): void;
    /**
     * event raised when a new secure channel is opened
     */
    on(event: "newChannel", eventHandler: (channel: ServerSecureChannelLayer) => void): void;
    /**
     * event raised when a new secure channel is closed
     */
    on(event: "closeChannel", eventHandler: (channel: ServerSecureChannelLayer) => void): void;
    on(event: string, eventHandler: (...args: [any?, ...any[]]) => void): this;
}
