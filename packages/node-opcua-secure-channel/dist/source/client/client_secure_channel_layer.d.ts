/// <reference types="node" />
import { EventEmitter } from "events";
import { Certificate, PrivateKeyPEM } from "node-opcua-crypto";
import { MessageSecurityMode } from "node-opcua-service-secure-channel";
import { SecurityPolicy } from "../security_policy";
import { ErrorCallback, ICertificateKeyPairProvider, Request, Response } from "../common";
declare type PerformTransactionCallback = (err?: Error | null, response?: Response) => void;
export interface ConnectionStrategyOptions {
    maxRetry?: number;
    initialDelay?: number;
    maxDelay?: number;
    randomisationFactor?: number;
}
export interface ConnectionStrategy {
    maxRetry: number;
    initialDelay: number;
    maxDelay: number;
    randomisationFactor: number;
}
export declare function coerceConnectionStrategy(options: ConnectionStrategyOptions | null): ConnectionStrategy;
export interface ClientSecureChannelParent extends ICertificateKeyPairProvider {
    applicationName?: string;
    clientName?: string;
    getCertificate(): Certificate;
    getCertificateChain(): Certificate;
    getPrivateKey(): PrivateKeyPEM;
}
/***
 * @param [options.factory] an factory that provides a method createObjectId(id) for the message builder
 */
export interface ClientSecureChannelLayerOptions {
    /**
     * default secure token life time , if not specified  30 seconds will be used as default value
     */
    defaultSecureTokenLifetime?: number;
    /**
     * delay SecureTokenLifetime at which token renewal will be attempted.
     *
     * if 0 or not specify, the security token renewal will happen at 75% of defaultSecureTokenLifetime
     */
    tokenRenewalInterval?: number;
    /**
     *  message security mode
     *  default value =MessageSecurityMode.None
     */
    securityMode?: MessageSecurityMode;
    /**
     * security policy
     * default value = SecurityPolicy.None
     */
    securityPolicy?: SecurityPolicy;
    /**
     * the serverCertificate (required if securityMode!=None)
     */
    serverCertificate?: Certificate;
    parent: ClientSecureChannelParent;
    /**
     *   the transport timeout interval in ms ( default = 10 seconds)
     */
    transportTimeout?: number;
    /**
     * the connection strategy options
     * @param [options.connectionStrategy.maxRetry      = 10]
     * @param [options.connectionStrategy.initialDelay  = 10]
     * @param [options.connectionStrategy.maxDelay      = 10000]
     */
    connectionStrategy: ConnectionStrategyOptions;
}
/**
 * a ClientSecureChannelLayer represents the client side of the OPCUA secure channel.
 */
export declare class ClientSecureChannelLayer extends EventEmitter {
    /**
     * true if the secure channel is trying to establish the connection with the server. In this case, the client
     * may be in the middle of the b ackoff connection process.
     *
     */
    readonly isConnecting: boolean;
    readonly bytesRead: number;
    readonly bytesWritten: number;
    readonly transactionsPerformed: number;
    readonly timedOutRequestCount: number;
    static defaultTransportTimeout: number;
    protocolVersion: number;
    readonly securityMode: MessageSecurityMode;
    readonly securityPolicy: SecurityPolicy;
    endpointUrl: string;
    private _lastRequestId;
    private _transport;
    private readonly parent;
    private clientNonce;
    private readonly messageChunker;
    private readonly defaultSecureTokenLifetime;
    private readonly tokenRenewalInterval;
    private readonly serverCertificate;
    private readonly messageBuilder;
    private _requests;
    private __in_normal_close_operation;
    private _timedout_request_count;
    private _securityTokenTimeoutId;
    private readonly transportTimeout;
    private channelId;
    private readonly connectionStrategy;
    private last_transaction_stats;
    private derivedKeys;
    private receiverPublicKey;
    private __call;
    private _isOpened;
    private securityToken;
    private serverNonce;
    private receiverCertificate;
    private securityHeader;
    private lastError?;
    constructor(options: ClientSecureChannelLayerOptions);
    getPrivateKey(): PrivateKeyPEM | null;
    getCertificateChain(): Certificate | null;
    isTransactionInProgress(): boolean;
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
    create(endpointUrl: string, callback: ErrorCallback): void;
    dispose(): void;
    abortConnection(callback: ErrorCallback): void;
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
    performMessageTransaction(request: Request, callback: PerformTransactionCallback): void;
    isValid(): boolean;
    isOpened(): boolean;
    getDisplayName(): string;
    cancelPendingTransactions(callback: ErrorCallback): void;
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
    close(callback: ErrorCallback): void;
    private on_transaction_completed;
    private _on_message_received;
    private _record_transaction_statistics;
    private _cancel_pending_transactions;
    private _on_transport_closed;
    private _on_security_token_about_to_expire;
    private _cancel_security_token_watchdog;
    private _install_security_token_watchdog;
    private _build_client_nonce;
    private _open_secure_channel_request;
    private _on_connection;
    private _backoff_completion;
    private _connect;
    private _establish_connection;
    private _renew_security_token;
    private _on_receive_message_chunk;
    /**
     * @method makeRequestId
     * @return  newly generated request id
     * @private
     */
    private makeRequestId;
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
    private _performMessageTransaction;
    /**
     *
     * @param transactionData
     * @param transactionData.msgType
     * @param transactionData.request
     * @param transactionData.callback
     * @private
     */
    private _internal_perform_transaction;
    private _send_chunk;
    private _construct_security_header;
    private _get_security_options_for_OPN;
    private _get_security_options_for_MSG;
    private _sendSecureOpcUARequest;
}
export {};
