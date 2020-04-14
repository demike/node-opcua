/**
 * @module node-opcua-secure-channel
 */
/// <reference types="node" />
import { BinaryStream } from "node-opcua-binary-stream";
import { DerivedKeys, PrivateKeyPEM } from "node-opcua-crypto";
import { BaseUAObject } from "node-opcua-factory";
import { ExpandedNodeId } from "node-opcua-nodeid";
import { MessageSecurityMode } from "node-opcua-service-secure-channel";
import { MessageBuilderBase } from "node-opcua-transport";
import { SecurityHeader } from "./secure_message_chunk_manager";
import { CryptoFactory, SecurityPolicy } from "./security_policy";
export interface SecurityToken {
    tokenId: number;
    expired?: boolean;
    revisedLifetime: number;
}
export interface ObjectFactory {
    constructObject: (expandedNodeId: ExpandedNodeId) => BaseUAObject;
    hasConstructor: (expandedNodeId: ExpandedNodeId) => boolean;
}
export interface MessageBuilderOptions {
    securityMode?: MessageSecurityMode;
    privateKey?: PrivateKeyPEM;
    objectFactory?: ObjectFactory;
    signatureLength?: number;
    name?: string;
}
export interface SecurityTokenAndDerivedKeys {
    securityToken: SecurityToken;
    derivedKeys: DerivedKeys | null;
}
/**
 * @class MessageBuilder
 * @extends MessageBuilderBase
 * @constructor
 *
 * @param options
 * @param options.securityMode {MessageSecurityMode} the security Mode
 * @param [options.objectFactory=factories] a object that provides a constructObject(id) method
 */
export declare class MessageBuilder extends MessageBuilderBase {
    securityPolicy: SecurityPolicy;
    securityMode: MessageSecurityMode;
    cryptoFactory: CryptoFactory | null;
    securityHeader?: SecurityHeader;
    protected id: string;
    private readonly objectFactory;
    private _previousSequenceNumber;
    private _tokenStack;
    private privateKey;
    constructor(options: MessageBuilderOptions);
    setSecurity(securityMode: MessageSecurityMode, securityPolicy: SecurityPolicy): void;
    dispose(): void;
    pushNewToken(securityToken: SecurityToken, derivedKeys: DerivedKeys | null): void;
    protected _read_headers(binaryStream: BinaryStream): boolean;
    protected _decodeMessageBody(fullMessageBody: Buffer): boolean;
    private _validateSequenceNumber;
    private _decrypt_OPN;
    private tokenIds;
    private _select_matching_token;
    private _decrypt_MSG;
    private _decrypt;
    private _safe_decode_message_body;
}
