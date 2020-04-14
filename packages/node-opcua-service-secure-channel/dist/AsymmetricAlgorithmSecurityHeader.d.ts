/**
 * @module node-opcua-service-secure-channel
 */
import { ByteString, UAString } from "node-opcua-basic-types";
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
import { BaseUAObject, StructuredTypeSchema } from "node-opcua-factory";
export declare class AsymmetricAlgorithmSecurityHeader extends BaseUAObject {
    static possibleFields: string[];
    static schema: StructuredTypeSchema;
    securityPolicyUri: UAString;
    senderCertificate: ByteString;
    receiverCertificateThumbprint: ByteString;
    constructor(options?: any);
    encode(stream: OutputBinaryStream): void;
    decode(stream: BinaryStream): void;
}
