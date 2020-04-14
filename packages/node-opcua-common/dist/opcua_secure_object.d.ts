/// <reference types="node" />
/**
 * @module node-opcua-common
 */
import { EventEmitter } from "events";
import { Certificate, PrivateKeyPEM } from "node-opcua-crypto";
export interface ICertificateKeyPairProvider {
    getCertificate(): Certificate;
    getCertificateChain(): Certificate;
    getPrivateKey(): PrivateKeyPEM;
}
export interface IOPCUASecureObjectOptions {
    certificateFile?: string;
    privateKeyFile?: string;
}
/**
 * an object that provides a certificate and a privateKey
 * @class OPCUASecureObject
 * @param options
 * @param options.certificateFile {string}
 * @param options.privateKeyFile {string}
 * @constructor
 */
export declare class OPCUASecureObject extends EventEmitter implements ICertificateKeyPairProvider {
    readonly certificateFile: string;
    readonly privateKeyFile: string;
    private certificate;
    private certificateChain;
    private privateKeyPEM;
    constructor(options: IOPCUASecureObjectOptions);
    getCertificate(): Certificate;
    getCertificateChain(): Certificate;
    getPrivateKey(): PrivateKeyPEM;
}
