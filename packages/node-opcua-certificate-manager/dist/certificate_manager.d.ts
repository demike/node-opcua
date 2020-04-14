import { Certificate } from "node-opcua-crypto";
import { CertificateManager } from "node-opcua-pki";
import { StatusCode } from "node-opcua-status-code";
declare type StatusCodeCallback = (err: Error | null, statusCode?: StatusCode) => void;
export interface ICertificateManager {
    getTrustStatus(certificate: Certificate): Promise<StatusCode>;
    getTrustStatus(certificate: Certificate, callback: StatusCodeCallback): void;
    checkCertificate(certificate: Certificate): Promise<StatusCode>;
    checkCertificate(certificate: Certificate, callback: StatusCodeCallback): void;
    /**
     *
     * @param certificate
     * @param callback
     */
    trustCertificate(certificate: Certificate, callback: (err?: Error | null) => void): void;
    trustCertificate(certificate: Certificate): Promise<void>;
    rejectCertificate(certificate: Certificate, callback: (err?: Error | null) => void): void;
    rejectCertificate(certificate: Certificate): Promise<void>;
}
export interface OPCUACertificateManagerOptions {
    /**
     * where to store the PKI
     * default %APPDATA%/node-opcua
     */
    rootFolder?: null | string;
    automaticallyAcceptUnknownCertificate?: boolean;
    /**
     * the name of the pki store( default value = "pki" )
     *
     * the PKI folder will be <rootFolder>/<name>
     */
    name?: string;
}
export declare class OPCUACertificateManager extends CertificateManager implements ICertificateManager {
    automaticallyAcceptUnknownCertificate: boolean;
    constructor(options: OPCUACertificateManagerOptions);
    checkCertificate(certificate: Certificate): Promise<StatusCode>;
    checkCertificate(certificate: Certificate, callback: StatusCodeCallback): void;
    getTrustStatus(certificate: Certificate): Promise<StatusCode>;
    getTrustStatus(certificate: Certificate, callback: StatusCodeCallback): void;
}
export declare function checkCertificateValidity(certificate: Certificate): StatusCode;
export {};
