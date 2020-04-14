/**
 * @module node-opcua-secure-channel
 */
/// <reference types="node" />
import { EventEmitter } from "events";
import { Socket } from "net";
import * as WebSocket from 'ws';
import { Certificate, PrivateKeyPEM, PublicKeyLength } from "node-opcua-crypto";
import { MessageSecurityMode } from "node-opcua-service-secure-channel";
import { StatusCode } from "node-opcua-status-code";
import { ServerTransport } from "node-opcua-transport";
import { SecurityHeader } from "../secure_message_chunk_manager";
import { ErrorCallback, ICertificateKeyPairProvider, Request, Response } from "../common";
import { MessageBuilder, ObjectFactory } from "../message_builder";
import { SecurityPolicy } from "../security_policy";
import { EndpointDescription } from "node-opcua-service-endpoints";
import { AsymmetricAlgorithmSecurityHeader } from "../services";
import { ICertificateManager } from "node-opcua-certificate-manager";
export interface ServerSecureChannelParent extends ICertificateKeyPairProvider {
    certificateManager: ICertificateManager;
    getCertificate(): Certificate;
    getCertificateChain(): Certificate;
    getPrivateKey(): PrivateKeyPEM;
    getEndpointDescription(securityMode: MessageSecurityMode, securityPolicy: SecurityPolicy): EndpointDescription | null;
}
export interface SeverSecureChannelLayerOptions {
    parent: ServerSecureChannelParent;
    /**
     * timeout in milliseconds [default = 30000]
     */
    timeout?: number;
    /**
     * default secure token life time in milliseconds [default = 300000]
     */
    defaultSecureTokenLifetime?: number;
    objectFactory?: ObjectFactory;
}
export interface Message {
    request: Request;
    requestId: number;
    securityHeader?: SecurityHeader;
    channel?: ServerSecureChannelLayer;
    session?: any;
    session_statusCode?: StatusCode;
}
export interface ServerTransactionStatistics {
    bytesRead: number;
    bytesWritten: number;
    lap_reception: number;
    lap_processing: number;
    lap_emission: number;
}
/**
 * @class ServerSecureChannelLayer
 * @extends EventEmitter
 * @uses MessageBuilder
 * @uses MessageChunker
 */
export declare class ServerSecureChannelLayer<SOCKET_TYPE extends Socket | WebSocket = Socket | WebSocket> extends EventEmitter {
    readonly securityTokenCount: number;
    readonly remoteAddress: string;
    readonly remotePort: number;
    /**
     *
     */
    readonly aborted: boolean;
    /**
     * the number of bytes read so far by this channel
     */
    readonly bytesRead: number;
    /**
     * the number of bytes written so far by this channel
     */
    readonly bytesWritten: number;
    readonly transactionsCount: number;
    /**
     * true when the secure channel has been opened successfully
     *
     */
    readonly isOpened: boolean;
    /**
     * true when the secure channel is assigned to a active session
     */
    readonly hasSession: boolean;
    readonly certificateManager: ICertificateManager;
    /**
     * The unique hash key to identify this secure channel
     * @property hashKey
     */
    readonly hashKey: number;
    static registry: any;
    _on_response: ((msgType: string, response: Response, message: Message) => void) | null;
    sessionTokens: any;
    channelId: number | null;
    timeout: number;
    readonly messageBuilder: MessageBuilder;
    receiverCertificate: Buffer | null;
    clientCertificate: Buffer | null;
    clientNonce: Buffer | null;
    /**
     * the channel message security mode
     */
    securityMode: MessageSecurityMode;
    /**
     * the channel message security policy
     */
    securityPolicy: SecurityPolicy;
    securityHeader: AsymmetricAlgorithmSecurityHeader | null;
    clientSecurityHeader?: SecurityHeader;
    endpoint: EndpointDescription | null;
    private readonly __hash;
    private parent;
    private readonly protocolVersion;
    private lastTokenId;
    private readonly defaultSecureTokenLifetime;
    private securityToken;
    private serverNonce;
    private receiverPublicKey;
    private receiverPublicKeyLength;
    private readonly messageChunker;
    private timeoutId;
    private _securityTokenTimeout;
    private _transactionsCount;
    private revisedLifetime;
    private readonly transport;
    private derivedKeys?;
    private objectFactory?;
    private last_transaction_stats?;
    private _tick0;
    private _tick1;
    private _tick2;
    private _tick3;
    private _bytesRead_before;
    private _bytesWritten_before;
    private _remoteAddress;
    private _remotePort;
    private _abort_has_been_called;
    private __verifId;
    private _transport_socket_close_listener?;
    constructor(options: SeverSecureChannelLayerOptions, transport: ServerTransport<SOCKET_TYPE>);
    dispose(): void;
    abruptlyInterrupt(): void;
    /**
     * the endpoint associated with this secure channel
     *
     */
    getEndpointDescription(securityMode: MessageSecurityMode, securityPolicy: SecurityPolicy): EndpointDescription | null;
    setSecurity(securityMode: MessageSecurityMode, securityPolicy: SecurityPolicy): void;
    /**
     * @method getCertificateChain
     * @return the X509 DER form certificate
     */
    getCertificateChain(): Certificate;
    /**
     * @method getCertificate
     * @return  the X509 DER form certificate
     */
    getCertificate(): Certificate;
    getSignatureLength(): PublicKeyLength;
    /**
     * @method getPrivateKey
     * @return the privateKey
     */
    getPrivateKey(): PrivateKeyPEM;
    /**
     * @method init
     * @async
     * @param socket
     * @param callback
     */
    init(socket: SOCKET_TYPE, callback: ErrorCallback): void;
    /**
     * @method send_response
     * @async
     * @param msgType
     * @param response
     * @param message
     * @param callback
     */
    send_response(msgType: string, response: Response, message: Message, callback?: ErrorCallback): void;
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
    send_error_and_abort(statusCode: StatusCode, description: string, message: Message, callback: ErrorCallback): void;
    /**
     * Abruptly close a Server SecureChannel ,by terminating the underlying transport.
     *
     *
     * @method close
     * @async
     * @param callback
     */
    close(callback?: ErrorCallback): void;
    has_endpoint_for_security_mode_and_policy(securityMode: MessageSecurityMode, securityPolicy: SecurityPolicy): boolean;
    private _stop_security_token_watch_dog;
    private _start_security_token_watch_dog;
    private _add_new_security_token;
    private _prepare_security_token;
    private _set_lifetime;
    private _stop_open_channel_watch_dog;
    private _cleanup_pending_timers;
    private _cancel_wait_for_open_secure_channel_request_timeout;
    private _install_wait_for_open_secure_channel_request_timeout;
    private _on_initial_open_secure_channel_request;
    private _wait_for_open_secure_channel_request;
    private _send_chunk;
    private _get_security_options_for_OPN;
    private _get_security_options_for_MSG;
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
    private _process_certificates;
    /**
     * @method _prepare_security_header
     * @param request
     * @param message
     * @return {AsymmetricAlgorithmSecurityHeader}
     * @private
     */
    private _prepare_security_header;
    private checkCertificateCallback;
    private checkCertificate;
    private _handle_OpenSecureChannelRequest;
    private _abort;
    private _record_transaction_statistics;
    private _on_common_message;
    /**
     * @method _check_receiverCertificateThumbprint
     * verify that the receiverCertificateThumbprint send by the client
     * matching the CertificateThumbPrint of the server
     * @param clientSecurityHeader
     * @return true if the receiver certificate thumbprint matches the server certificate
     * @private
     */
    private _check_receiverCertificateThumbprint;
    private _send_error;
    private _on_initial_OpenSecureChannelRequest;
}
