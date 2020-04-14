/// <reference types="node" />
import { EventEmitter } from "events";
import { Server } from "net";
import { OPCUACertificateManager } from "node-opcua-certificate-manager";
import { Certificate, PrivateKeyPEM } from "node-opcua-crypto";
import { MessageSecurityMode, SecurityPolicy, ServerSecureChannelLayer, ServerSecureChannelParent } from "node-opcua-secure-channel";
import { EndpointDescription } from "node-opcua-service-endpoints";
import { ApplicationDescription } from "node-opcua-service-endpoints";
import * as WebSocket from 'ws';
export interface OPCUAServerEndPointOptions {
    /**
     * the tcp port
     */
    port: number;
    /**
     * the DER certificate chain
     */
    certificateChain: Certificate;
    /**
     * privateKey
     */
    privateKey: PrivateKeyPEM;
    certificateManager: OPCUACertificateManager;
    /**
     *  the default secureToken lifetime @default=60000
     */
    defaultSecureTokenLifetime?: number;
    /**
     * the maximum number of connection allowed on the TCP server socket
     * @default 20
     */
    maxConnections?: number;
    /**
     *  the  timeout for the TCP HEL/ACK transaction (in ms)
     *  @default 30000
     */
    timeout?: number;
    serverInfo: ApplicationDescription;
    objectFactory?: any;
}
export interface EndpointDescriptionParams {
    allowAnonymous?: boolean;
    restricted?: boolean;
    allowUnsecurePassword?: boolean;
    resourcePath?: string;
    alternateHostname?: string[];
    hostname: string;
}
export interface AddStandardEndpointDescriptionsParam {
    securityModes?: MessageSecurityMode[];
    securityPolicies?: SecurityPolicy[];
    disableDiscovery?: boolean;
    allowAnonymous?: boolean;
    restricted?: boolean;
    hostname?: string;
    alternateHostname?: string[];
    allowUnsecurePassword?: boolean;
    resourcePath?: string;
}
/**
 * OPCUAServerEndPoint a Server EndPoint.
 * A sever end point is listening to one port
 * note:
 *   see OPCUA Release 1.03 part 4 page 108 7.1 ApplicationDescription
 */
export declare abstract class OPCUAServerEndPoint extends EventEmitter implements ServerSecureChannelParent {
    /**
     * the tcp port
     */
    port: number;
    certificateManager: OPCUACertificateManager;
    defaultSecureTokenLifetime: number;
    maxConnections: number;
    timeout: number;
    bytesWrittenInOldChannels: number;
    bytesReadInOldChannels: number;
    transactionsCountOldChannels: number;
    securityTokenCountOldChannels: number;
    serverInfo: ApplicationDescription;
    objectFactory: any;
    _on_new_channel?: (channel: ServerSecureChannelLayer) => void;
    _on_close_channel?: (channel: ServerSecureChannelLayer) => void;
    private _certificateChain;
    private _privateKey;
    protected _channels: {
        [key: string]: ServerSecureChannelLayer;
    };
    private _endpoints;
    protected _listen_callback: any;
    protected _started: boolean;
    private _counter;
    constructor(options: OPCUAServerEndPointOptions);
    dispose(): void;
    toString(): string;
    getChannels(): ServerSecureChannelLayer[];
    /**
     * Returns the X509 DER form of the server certificate
     */
    getCertificate(): Certificate;
    /**
     * Returns the X509 DER form of the server certificate
     */
    getCertificateChain(): Certificate;
    /**
     * the private key
     */
    getPrivateKey(): PrivateKeyPEM;
    /**
     * The number of active channel on this end point.
     */
    readonly currentChannelCount: number;
    /**
     * @method getEndpointDescription
     * @param securityMode
     * @param securityPolicy
     * @return endpoint_description {EndpointDescription|null}
     */
    getEndpointDescription(securityMode: MessageSecurityMode, securityPolicy: SecurityPolicy, endpointUrl?: string): EndpointDescription | null;
    addEndpointDescription(securityMode: MessageSecurityMode, securityPolicy: SecurityPolicy, options?: EndpointDescriptionParams): void;
    addRestrictedEndpointDescription(options: EndpointDescriptionParams): void;
    addStandardEndpointDescriptions(options?: AddStandardEndpointDescriptionsParam): void;
    /**
     * returns the list of end point descriptions.
     */
    endpointDescriptions(): EndpointDescription[];
    /**
     * @method listen
     * @async
     */
    abstract listen(callback: (err?: Error) => void): void;
    killClientSockets(callback: (err?: Error) => void): void;
    suspendConnection(callback: (err?: Error) => void): void;
    protected abstract _close_server(): void;
    restoreConnection(callback: (err?: Error) => void): void;
    abruptlyInterruptChannels(): void;
    /**
     * @method shutdown
     * @async
     */
    shutdown(callback: (err?: Error) => void): void;
    /**
     * @method start
     * @async
     * @param callback
     */
    start(callback: (err?: Error) => void): void;
    readonly bytesWritten: number;
    readonly bytesRead: number;
    readonly transactionsCount: number;
    readonly securityTokenCount: number;
    readonly activeChannelCount: number;
    protected abstract _setup_server(): void;
    protected _preregisterChannel(channel: ServerSecureChannelLayer): void;
    protected _un_pre_registerChannel(channel: ServerSecureChannelLayer): void;
    /**
     * @method _registerChannel
     * @param channel
     * @private
     */
    protected _registerChannel(channel: ServerSecureChannelLayer): void;
    /**
     * @method _unregisterChannel
     * @param channel
     * @private
     */
    private _unregisterChannel;
    protected abstract _dump_statistics(): void;
    protected _end_listen(err?: Error): void;
    /**
     *  shutdown_channel
     * @param channel
     * @param inner_callback
     */
    private shutdown_channel;
    /**
     * @private
     */
    protected _prevent_DDOS_Attack(establish_connection: () => void): void;
}
export declare class OPCUATCPServerEndPoint extends OPCUAServerEndPoint {
    protected _server?: Server;
    protected _setup_server(): void;
    private _on_client_connection;
    protected _close_server(): void;
    /**
     * @method listen
     * @async
     */
    listen(callback: (err?: Error) => void): void;
    protected _dump_statistics(): void;
    dispose(): void;
}
export declare class OPCUAWSServerEndPoint extends OPCUAServerEndPoint {
    protected _server?: WebSocket.Server;
    listen(callback: (err?: Error | undefined) => void): void;
    protected _close_server(): void;
    protected _setup_server(): void;
    protected _dump_statistics(): void;
    private _verifyClient;
    private _on_client_connection;
}
