/// <reference types="node" />
/**
 * @module node-opcua-server-configuration.client
 */
import { ByteString } from "node-opcua-basic-types";
import { NodeId } from "node-opcua-nodeid";
import { IBasicSession } from "node-opcua-pseudo-session";
import { StatusCode } from "node-opcua-status-code";
import { CreateSigningRequestResult, GetRejectedListResult, PushCertificateManager, UpdateCertificateResult } from "../push_certificate_manager";
export declare class ClientPushCertificateManagement implements PushCertificateManager {
    static rsaSha256ApplicationCertificateType: NodeId;
    session: IBasicSession;
    constructor(session: IBasicSession);
    /**
     * CreateSigningRequest Method asks the Server to create a PKCS #10 DER encoded
     * Certificate Request that is signed with the Server’s private key. This request can be then used
     * to request a Certificate from a CA that expects requests in this format.
     * This Method requires an encrypted channel and that the Client provide credentials with
     * administrative rights on the Server.
     *
     * @param certificateGroupId  - The NodeId of the Certificate Group Object which is affected by the request.
     *                              If null the DefaultApplicationGroup is used.
     * @param certificateTypeId   - The type of Certificate being requested. The set of permitted types is specified by
     *                              the CertificateTypes Property belonging to the Certificate Group.
     * @param subjectName         - The subject name to use in the Certificate Request.
     *                              If not specified the SubjectName from the current Certificate is used.
     *                              The subjectName parameter is a sequence of X.500 name value pairs separated by a ‘/’. For
     *                              example: CN=ApplicationName/OU=Group/O=Company.
     *                              If the certificateType is a subtype of ApplicationCertificateType the Certificate subject name
     *                              shall have an organization (O=) or domain name (DC=) field. The public key length shall meet
     *                              the length restrictions for the CertificateType. The domain name field specified in the subject
     *                              name is a logical domain used to qualify the subject name that may or may not be the same
     *                              as a domain or IP address in the subjectAltName field of the Certificate.
     *                              If the certificateType is a subtype of HttpsCertificateType the Certificate common name (CN=)
     *                              shall be the same as a domain from a DiscoveryUrl which uses HTTPS and the subject name
     *                              shall have an organization (O=) field.
     *                              If the subjectName is blank or null the CertificateManager generates a suitable default.
     * @param regeneratePrivateKey  If TRUE the Server shall create a new Private Key which it stores until the
     *                              matching signed Certificate is uploaded with the UpdateCertificate Method.
     *                              Previously created Private Keys may be discarded if UpdateCertificate was not
     *                              called before calling this method again. If FALSE the Server uses its existing
     *                              Private Key.
     * @param nonce                 Additional entropy which the caller shall provide if regeneratePrivateKey is TRUE.
     *                              It shall be at least 32 bytes long.
     *
     * @return                      The PKCS #10 DER encoded Certificate Request.
     *
     * Result Code                  Description
     * BadInvalidArgument          The certificateTypeId, certificateGroupId or subjectName is not valid.
     * BadUserAccessDenied          The current user does not have the rights required.
     */
    createSigningRequest(certificateGroupId: NodeId | string, certificateTypeId: NodeId | string, subjectName: string, regeneratePrivateKey?: boolean, nonce?: ByteString): Promise<CreateSigningRequestResult>;
    /**
     * GetRejectedList Method returns the list of Certificates that have been rejected by the Server.
     * rules are defined for how the Server updates this list or how long a Certificate is kept in
     * the list. It is recommended that every valid but untrusted Certificate be added to the rejected
     * list as long as storage is available. Servers should omit older entries from the list returned if
     * the maximum message size is not large enough to allow the entire list to be returned.
     * This Method requires an encrypted channel and that the Client provides credentials with
     * administrative rights on the Server
     *
     * @return certificates The DER encoded form of the Certificates rejected by the Server
     */
    getRejectedList(): Promise<GetRejectedListResult>;
    /**
     * UpdateCertificate is used to update a Certificate for a Server.
     * There are the following three use cases for this Method:
     *   • The new Certificate was created based on a signing request created with the Method
     *     CreateSigningRequest. In this case there is no privateKey provided.
     *   • A new privateKey and Certificate was created outside the Server and both are updated
     *     with this Method.
     *   • A new Certificate was created and signed with the information from the old Certificate.
     *    In this case there is no privateKey provided.
     *
     * The Server will do all normal integrity checks on the Certificate and all of the issuer
     * Certificates. If errors occur the BadSecurityChecksFailed error is returned.
     * The Server will report an error if the public key does not match the existing Certificate and
     * the privateKey was not provided.
     * If the Server returns applyChangesRequired=FALSE then it is indicating that it is able to
     * satisfy the requirements specified for the ApplyChanges Method.
     * This Method requires an encrypted channel and that the Client provides credentials with
     * administrative rights on the Server.
     *
     * @param certificateGroupId - The NodeId of the Certificate Group Object which is affected by the update.
     *                             If null the DefaultApplicationGroup is used.
     * @param certificateTypeId  - The type of Certificate being updated. The set of permitted types is specified by
     *                             the CertificateTypes Property belonging to the Certificate Group
     * @param certificate        - The DER encoded Certificate which replaces the existing Certificate.
     * @param issuerCertificates - The issuer Certificates needed to verify the signature on the new Certificate
     * @return retVal.applyChangesRequired - Indicates that the ApplyChanges Method shall be called before the new
     *                               Certificate will be used.
     *
     *
     */
    updateCertificate(certificateGroupId: NodeId | string, certificateTypeId: NodeId | string, certificate: Buffer, issuerCertificates: Buffer[]): Promise<UpdateCertificateResult>;
    /**
     *
     * @param certificateGroupId
     * @param certificateTypeId
     * @param certificate
     * @param issuerCertificates
     * @param privateKeyFormat   - The format of the Private Key (PEM or PFX). If the privateKey is not specified
     *                             the privateKeyFormat is null or empty
     * @param privateKey         - The Private Key encoded in the privateKeyFormat
     *
     */
    updateCertificate(certificateGroupId: NodeId | string, certificateTypeId: NodeId | string, certificate: Buffer, issuerCertificates: Buffer[], privateKeyFormat: string, privateKey: Buffer): Promise<UpdateCertificateResult>;
    /**
     * ApplyChanges tells the Server to apply any security changes.
     * This Method should only be called if a previous call to a Method that changed the
     * configuration returns applyChangesRequired=true (see 7.7.4).
     * If the Server Certificate has changed, Secure Channels using the old Certificate will
     * eventually be interrupted. The only leeway the Server has is with the timing. In the best case,
     * the Server can close the TransportConnections for the affected Endpoints and leave any
     * Subscriptions intact. This should appear no different than a network interruption from the
     * perspective of the Client. The Client should be prepared to deal with Certificate changes
     * during its reconnect logic. In the worst case, a full shutdown which affects all connected
     * Clients will be necessary. In the latter case, the Server shall advertise its intent to interrupt
     * connections by setting the SecondsTillShutdown and ShutdownReason Properties in the
     * ServerStatus Variable.
     * If the Secure Channel being used to call this Method will be affected by the Certificate change
     * then the Server shall introduce a delay long enough to allow the caller to receive a reply.
     * This Method requires an encrypted channel and that the Client provide credentials with
     * administrative rights on the Server.
     *
     * Result Code            Description
     * BadUserAccessDenied   The current user does not have the rights required.
     */
    applyChanges(): Promise<StatusCode>;
    getSupportedPrivateKeyFormats(): Promise<string[]>;
    getCertificateGroupId(certificateGroupName: string): Promise<NodeId>;
}
