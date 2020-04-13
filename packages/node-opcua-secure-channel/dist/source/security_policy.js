"use strict";
/**
 * @module node-opcua-secure-channel
 */
// tslint:disable:object-literal-short-hand
// tslint:disable:variable-name
// tslint:disable:max-line-length
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_assert_1 = require("node-opcua-assert");
const _ = require("underscore");
const node_opcua_service_secure_channel_1 = require("node-opcua-service-secure-channel");
const node_opcua_crypto_1 = require("node-opcua-crypto");
// tslint:disable:no-empty
function errorLog(...args) {
}
/**
 *
 * OPCUA Spec Release 1.02  page 15    OPC Unified Architecture, Part 7
 *
 * @property Basic128Rsa15    Security Basic 128Rsa15
 * -----------------------
 *  A suite of algorithms that uses RSA15 as
 *  Key-Wrap-algorithm and 128-Bit for  encryption algorithms.
 *    -> SymmetricSignatureAlgorithm   -   HmacSha1 -(http://www.w3.org/2000/09/xmldsig#hmac-sha1).
 *    -> SymmetricEncryptionAlgorithm  -     Aes128 -(http://www.w3.org/2001/04/xmlenc#aes128-cbc).
 *    -> AsymmetricSignatureAlgorithm  -    RsaSha1 -(http://www.w3.org/2000/09/xmldsig#rsa-sha1).
 *    -> AsymmetricKeyWrapAlgorithm    -    KwRsa15 -(http://www.w3.org/2001/04/xmlenc#rsa-1_5).
 *    -> AsymmetricEncryptionAlgorithm -      Rsa15 -(http://www.w3.org/2001/04/xmlenc#rsa-1_5).
 *    -> KeyDerivationAlgorithm        -      PSha1 -(http://docs.oasis-open.org/ws-sx/ws-secureconversation/200512/dk/p_sha1).
 *    -> DerivedSignatureKeyLength     -  128
 *    -> MinAsymmetricKeyLength        - 1024
 *    -> MaxAsymmetricKeyLength        - 2048
 *    -> CertificateSignatureAlgorithm - Sha1
 *
 * @property Basic256 Security Basic 256:
 * -------------------
 * A suite of algorithms that are for 256-Bit encryption, algorithms include:
 *    -> SymmetricSignatureAlgorithm   - HmacSha1 -(http://www.w3.org/2000/09/xmldsig#hmac-sha1).
 *    -> SymmetricEncryptionAlgorithm  -   Aes256 -(http://www.w3.org/2001/04/xmlenc#aes256-cbc).
 *    -> AsymmetricSignatureAlgorithm  -  RsaSha1 -(http://www.w3.org/2000/09/xmldsig#rsa-sha1).
 *    -> AsymmetricKeyWrapAlgorithm    - KwRsaOaep-(http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p).
 *    -> AsymmetricEncryptionAlgorithm -  RsaOaep -(http://www.w3.org/2001/04/xmlenc#rsa-oaep).
 *    -> KeyDerivationAlgorithm        -    PSha1 -(http://docs.oasis-open.org/ws-sx/ws-secureconversation/200512/dk/p_sha1).
 *    -> DerivedSignatureKeyLength     -  192.
 *    -> MinAsymmetricKeyLength        - 1024
 *    -> MaxAsymmetricKeyLength        - 2048
 *    -> CertificateSignatureAlgorithm - Sha1
 *
 * @property Basic256 Security Basic 256 Sha256
 * --------------------------------------------
 * A suite of algorithms that are for 256-Bit encryption, algorithms include.
 *   -> SymmetricSignatureAlgorithm   - Hmac_Sha256 -(http://www.w3.org/2000/09/xmldsig#hmac-sha256).
 *   -> SymmetricEncryptionAlgorithm  -  Aes256_CBC -(http://www.w3.org/2001/04/xmlenc#aes256-cbc).
 *   -> AsymmetricSignatureAlgorithm  -  Rsa_Sha256 -(http://www.w3.org/2001/04/xmldsig-more#rsa-sha256).
 *   -> AsymmetricKeyWrapAlgorithm    -   KwRsaOaep -(http://www.w3.org/2001/04/xmlenc#rsa-oaep-mgf1p).
 *   -> AsymmetricEncryptionAlgorithm -    Rsa_Oaep -(http://www.w3.org/2001/04/xmlenc#rsa-oaep).
 *   -> KeyDerivationAlgorithm        -     PSHA256 -(http://docs.oasis-open.org/ws-sx/ws-secureconversation/200512/dk/p_sha256).
 *   -> DerivedSignatureKeyLength     - 256
 *   -> MinAsymmetricKeyLength        - 2048
 *   -> MaxAsymmetricKeyLength        - 4096
 *   -> CertificateSignatureAlgorithm - Sha256
 *
 *  Support for this security profile may require support for a second application instance certificate, with a larger
 *  keysize. Applications shall support multiple Application Instance Certificates if required by supported Security
 *  Polices and use the certificate that is required for a given security endpoint.
 *
 *
 */
var SecurityPolicy;
(function (SecurityPolicy) {
    SecurityPolicy["Invalid"] = "invalid";
    SecurityPolicy["None"] = "http://opcfoundation.org/UA/SecurityPolicy#None";
    SecurityPolicy["Basic128"] = "http://opcfoundation.org/UA/SecurityPolicy#Basic128";
    SecurityPolicy["Basic192"] = "http://opcfoundation.org/UA/SecurityPolicy#Basic192";
    SecurityPolicy["Basic192Rsa15"] = "http://opcfoundation.org/UA/SecurityPolicy#Basic192Rsa15";
    SecurityPolicy["Basic256Rsa15"] = "http://opcfoundation.org/UA/SecurityPolicy#Basic256Rsa15";
    SecurityPolicy["Basic256Sha256"] = "http://opcfoundation.org/UA/SecurityPolicy#Basic256Sha256";
    // new
    SecurityPolicy["Aes128_Sha256_RsaOaep"] = "http://opcfoundation.org/UA/SecurityPolicy#Aes128_Sha256_RsaOaep";
    SecurityPolicy["PubSub_Aes128_CTR"] = "http://opcfoundation.org/UA/SecurityPolicy#PubSub_Aes128_CTR";
    SecurityPolicy["PubSub_Aes256_CTR"] = "http://opcfoundation.org/UA/SecurityPolicy#PubSub_Aes256_CTR";
    // obsoletes
    SecurityPolicy["Basic128Rsa15"] = "http://opcfoundation.org/UA/SecurityPolicy#Basic128Rsa15";
    SecurityPolicy["Basic256"] = "http://opcfoundation.org/UA/SecurityPolicy#Basic256";
})(SecurityPolicy = exports.SecurityPolicy || (exports.SecurityPolicy = {}));
function fromURI(uri) {
    // istanbul ignore next
    if (typeof uri !== "string") {
        return SecurityPolicy.Invalid;
    }
    const a = uri.split("#");
    // istanbul ignore next
    if (a.length < 2) {
        return SecurityPolicy.Invalid;
    }
    const v = SecurityPolicy[a[1]];
    return v || SecurityPolicy.Invalid;
}
exports.fromURI = fromURI;
function toURI(value) {
    if (typeof value === "string") {
        const a = value.split("#");
        // istanbul ignore next
        if (a.length < 2) {
            return SecurityPolicy[value];
        }
        return value;
    }
    const securityPolicy = value || SecurityPolicy.Invalid;
    if (securityPolicy === SecurityPolicy.Invalid) {
        throw new Error("trying to convert an invalid Security Policy into a URI: " + value);
    }
    return SecurityPolicy[securityPolicy];
}
exports.toURI = toURI;
function coerceSecurityPolicy(value) {
    if (value === undefined) {
        return SecurityPolicy.None;
    }
    if (value === "Basic128Rsa15" || value === "Basic256" || value === "Basic192Rsa15" || value === "None" || value === "Basic256Sha256" || value === "Basic256Rsa15") {
        return SecurityPolicy[value];
    }
    if (!(value === SecurityPolicy.Basic128Rsa15 ||
        value === SecurityPolicy.Basic256 ||
        value === SecurityPolicy.Basic192Rsa15 ||
        value === SecurityPolicy.Basic256Rsa15 ||
        value === SecurityPolicy.Basic256Sha256 ||
        value === SecurityPolicy.None)) {
        errorLog("coerceSecurityPolicy: invalid security policy ", value, SecurityPolicy);
    }
    return value;
}
exports.coerceSecurityPolicy = coerceSecurityPolicy;
// --------------------
function RSAPKCS1V15_Decrypt(buffer, privateKey) {
    const blockSize = node_opcua_crypto_1.rsa_length(privateKey);
    return node_opcua_crypto_1.privateDecrypt_long(buffer, privateKey, blockSize, node_opcua_crypto_1.RSA_PKCS1_PADDING);
}
function RSAOAEP_Decrypt(buffer, privateKey) {
    const blockSize = node_opcua_crypto_1.rsa_length(privateKey);
    return node_opcua_crypto_1.privateDecrypt_long(buffer, privateKey, blockSize, node_opcua_crypto_1.RSA_PKCS1_OAEP_PADDING);
}
// --------------------
function asymmetricVerifyChunk(self, chunk, certificate) {
    node_opcua_assert_1.assert(chunk instanceof Buffer);
    node_opcua_assert_1.assert(certificate instanceof Buffer);
    // let's get the signatureLength by checking the size
    // of the certificate's public key
    const cert = node_opcua_crypto_1.exploreCertificateInfo(certificate);
    const signatureLength = cert.publicKeyLength; // 1024 bits = 128Bytes or 2048=256Bytes
    const blockToVerify = chunk.slice(0, chunk.length - signatureLength);
    const signature = chunk.slice(chunk.length - signatureLength);
    return self.asymmetricVerify(blockToVerify, signature, certificate);
}
exports.asymmetricVerifyChunk = asymmetricVerifyChunk;
function RSAPKCS1V15SHA1_Verify(buffer, signature, certificate) {
    node_opcua_assert_1.assert(certificate instanceof Buffer);
    node_opcua_assert_1.assert(signature instanceof Buffer);
    const options = {
        algorithm: "RSA-SHA1",
        publicKey: node_opcua_crypto_1.toPem(certificate, "CERTIFICATE"),
        signatureLength: 0,
    };
    return node_opcua_crypto_1.verifyMessageChunkSignature(buffer, signature, options);
}
// tslint:disable:variable-name
const RSAPKCS1OAEPSHA1_Verify = RSAPKCS1V15SHA1_Verify;
function RSAPKCS1OAEPSHA256_Verify(buffer, signature, certificate) {
    const options = {
        algorithm: "RSA-SHA256",
        publicKey: node_opcua_crypto_1.toPem(certificate, "CERTIFICATE"),
        signatureLength: 0
    };
    return node_opcua_crypto_1.verifyMessageChunkSignature(buffer, signature, options);
}
function RSAPKCS1V15SHA1_Sign(buffer, privateKey) {
    node_opcua_assert_1.assert(!(privateKey instanceof Buffer), "privateKey should not be a Buffer but a PEM");
    const params = {
        algorithm: "RSA-SHA1",
        privateKey,
        signatureLength: node_opcua_crypto_1.rsa_length(privateKey),
    };
    return node_opcua_crypto_1.makeMessageChunkSignature(buffer, params);
}
function RSAPKCS1V15SHA256_Sign(buffer, privateKey) {
    // xx    if (privateKey instanceof Buffer) {
    // xx        privateKey = toPem(privateKey, "RSA PRIVATE KEY");
    // xx   }
    const params = {
        algorithm: "RSA-SHA256",
        privateKey,
        signatureLength: node_opcua_crypto_1.rsa_length(privateKey),
    };
    return node_opcua_crypto_1.makeMessageChunkSignature(buffer, params);
}
const RSAPKCS1OAEPSHA1_Sign = RSAPKCS1V15SHA1_Sign;
function RSAPKCS1V15_Encrypt(buffer, publicKey) {
    const keyLength = node_opcua_crypto_1.rsa_length(publicKey);
    return node_opcua_crypto_1.publicEncrypt_long(buffer, publicKey, keyLength, 11, node_opcua_crypto_1.RSA_PKCS1_PADDING);
}
function RSAOAEP_Encrypt(buffer, publicKey) {
    const keyLength = node_opcua_crypto_1.rsa_length(publicKey);
    return node_opcua_crypto_1.publicEncrypt_long(buffer, publicKey, keyLength, 42, node_opcua_crypto_1.RSA_PKCS1_OAEP_PADDING);
}
function computeDerivedKeys(self, serverNonce, clientNonce) {
    // calculate derived keys
    if (clientNonce && serverNonce) {
        const options = {
            algorithm: self.symmetricEncryptionAlgorithm,
            encryptingBlockSize: self.encryptingBlockSize,
            encryptingKeyLength: self.derivedEncryptionKeyLength,
            sha1or256: self.sha1or256,
            signatureLength: self.signatureLength,
            signingKeyLength: self.derivedSignatureKeyLength,
        };
        return {
            algorithm: null,
            derivedClientKeys: node_opcua_crypto_1.computeDerivedKeys(serverNonce, clientNonce, options),
            derivedServerKeys: node_opcua_crypto_1.computeDerivedKeys(clientNonce, serverNonce, options),
        };
    }
    else {
        return { derivedClientKeys: null, derivedServerKeys: null, algorithm: null };
    }
}
exports.computeDerivedKeys = computeDerivedKeys;
const factoryBasic128Rsa15 = {
    derivedEncryptionKeyLength: 16,
    derivedSignatureKeyLength: 16,
    encryptingBlockSize: 16,
    securityPolicy: SecurityPolicy.Basic128Rsa15,
    signatureLength: 20,
    symmetricKeyLength: 16,
    maximumAsymmetricKeyLength: 512,
    minimumAsymmetricKeyLength: 128,
    /* asymmetric signature algorithm */
    asymmetricVerifyChunk,
    asymmetricSign: RSAPKCS1V15SHA1_Sign,
    asymmetricVerify: RSAPKCS1V15SHA1_Verify,
    asymmetricSignatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    /* asymmetric encryption algorithm */
    asymmetricEncrypt: RSAPKCS1V15_Encrypt,
    asymmetricDecrypt: RSAPKCS1V15_Decrypt,
    asymmetricEncryptionAlgorithm: "http://www.w3.org/2001/04/xmlenc#rsa-1_5",
    blockPaddingSize: 11,
    symmetricEncryptionAlgorithm: "aes-128-cbc",
    sha1or256: "SHA1",
};
const _Basic256 = {
    derivedEncryptionKeyLength: 32,
    derivedSignatureKeyLength: 24,
    encryptingBlockSize: 16,
    securityPolicy: SecurityPolicy.Basic256,
    signatureLength: 20,
    symmetricKeyLength: 32,
    maximumAsymmetricKeyLength: 512,
    minimumAsymmetricKeyLength: 128,
    asymmetricVerifyChunk,
    asymmetricSign: RSAPKCS1OAEPSHA1_Sign,
    asymmetricVerify: RSAPKCS1OAEPSHA1_Verify,
    asymmetricSignatureAlgorithm: "http://www.w3.org/2000/09/xmldsig#rsa-sha1",
    /* asymmetric encryption algorithm */
    asymmetricEncrypt: RSAOAEP_Encrypt,
    asymmetricDecrypt: RSAOAEP_Decrypt,
    asymmetricEncryptionAlgorithm: "http://www.w3.org/2001/04/xmlenc#rsa-oaep",
    blockPaddingSize: 42,
    // "aes-256-cbc"
    symmetricEncryptionAlgorithm: "aes-256-cbc",
    sha1or256: "SHA1",
};
const _Basic256Sha256 = {
    securityPolicy: SecurityPolicy.Basic256Sha256,
    derivedEncryptionKeyLength: 32,
    derivedSignatureKeyLength: 32,
    encryptingBlockSize: 16,
    signatureLength: 32,
    symmetricKeyLength: 32,
    maximumAsymmetricKeyLength: 4096,
    minimumAsymmetricKeyLength: 2048,
    asymmetricVerifyChunk,
    asymmetricSign: RSAPKCS1V15SHA256_Sign,
    asymmetricVerify: RSAPKCS1OAEPSHA256_Verify,
    asymmetricSignatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
    /* asymmetric encryption algorithm */
    asymmetricEncrypt: RSAOAEP_Encrypt,
    asymmetricDecrypt: RSAOAEP_Decrypt,
    asymmetricEncryptionAlgorithm: "http://www.w3.org/2001/04/xmlenc#rsa-oaep",
    blockPaddingSize: 42,
    // "aes-256-cbc"
    symmetricEncryptionAlgorithm: "aes-256-cbc",
    sha1or256: "SHA256"
};
function getCryptoFactory(securityPolicy) {
    switch (securityPolicy) {
        case SecurityPolicy.None:
            return null;
        case SecurityPolicy.Basic128Rsa15:
            return factoryBasic128Rsa15;
        case SecurityPolicy.Basic256:
            return _Basic256;
        case SecurityPolicy.Basic256Sha256:
            return _Basic256Sha256;
        default:
            return null;
    }
}
exports.getCryptoFactory = getCryptoFactory;
function computeSignature(senderCertificate, senderNonce, receiverPrivateKey, securityPolicy) {
    if (!senderNonce || !senderCertificate || !receiverPrivateKey) {
        return undefined;
    }
    const cryptoFactory = getCryptoFactory(securityPolicy);
    if (!cryptoFactory) {
        return undefined;
    }
    // This parameter is calculated by appending the clientNonce to the clientCertificate
    const dataToSign = Buffer.concat([senderCertificate, senderNonce]);
    // ... and signing the resulting sequence of bytes.
    const signature = cryptoFactory.asymmetricSign(dataToSign, receiverPrivateKey);
    return new node_opcua_service_secure_channel_1.SignatureData({
        // A string containing the URI of the algorithm.
        // The URI string values are defined as part of the security profiles specified in Part 7.
        // (The SignatureAlgorithm shall be the AsymmetricSignatureAlgorithm specified in the
        // SecurityPolicy for the Endpoint)
        // for instance "http://www.w3.org/2000/09/xmldsig#rsa-sha1"
        algorithm: cryptoFactory.asymmetricSignatureAlgorithm,
        // This is a signature generated with the private key associated with a Certificate
        signature,
    });
}
exports.computeSignature = computeSignature;
function verifySignature(receiverCertificate, receiverNonce, signature, senderCertificate, securityPolicy) {
    if (securityPolicy === SecurityPolicy.None) {
        return true;
    }
    const cryptoFactory = getCryptoFactory(securityPolicy);
    if (!cryptoFactory) {
        return false;
    }
    if (!(signature.signature instanceof Buffer)) {
        // no signature provided
        return false;
    }
    node_opcua_assert_1.assert(signature.signature instanceof Buffer);
    // This parameter is calculated by appending the clientNonce to the clientCertificate
    const dataToVerify = Buffer.concat([receiverCertificate, receiverNonce]);
    return cryptoFactory.asymmetricVerify(dataToVerify, signature.signature, senderCertificate);
}
exports.verifySignature = verifySignature;
function getOptionsForSymmetricSignAndEncrypt(securityMode, derivedKeys) {
    node_opcua_assert_1.assert(derivedKeys.hasOwnProperty("signatureLength"));
    node_opcua_assert_1.assert(securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.None && securityMode !== node_opcua_service_secure_channel_1.MessageSecurityMode.Invalid);
    let options = {
        signBufferFunc: (chunk) => node_opcua_crypto_1.makeMessageChunkSignatureWithDerivedKeys(chunk, derivedKeys),
        signatureLength: derivedKeys.signatureLength,
    };
    if (securityMode === node_opcua_service_secure_channel_1.MessageSecurityMode.SignAndEncrypt) {
        options = _.extend(options, {
            cipherBlockSize: derivedKeys.encryptingBlockSize,
            encryptBufferFunc: (chunk) => node_opcua_crypto_1.encryptBufferWithDerivedKeys(chunk, derivedKeys),
            plainBlockSize: derivedKeys.encryptingBlockSize,
        });
    }
    return options;
}
exports.getOptionsForSymmetricSignAndEncrypt = getOptionsForSymmetricSignAndEncrypt;
//# sourceMappingURL=security_policy.js.map