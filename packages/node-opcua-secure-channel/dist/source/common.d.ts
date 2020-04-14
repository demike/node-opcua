/**
 * @module node-opcua-secure-channel
 */
import { TypeSchemaBase } from "node-opcua-factory";
import { CloseSecureChannelRequest, MessageSecurityMode, RequestHeader, ResponseHeader } from "node-opcua-service-secure-channel";
import { ServiceFault } from "./services";
export interface ResponseB {
    responseHeader: ResponseHeader;
    schema: TypeSchemaBase;
}
export declare type Response = ResponseB | ServiceFault;
export interface RequestB {
    requestHeader: RequestHeader;
    schema: TypeSchemaBase;
    securityMode: MessageSecurityMode;
}
export declare type Request = RequestB | CloseSecureChannelRequest;
export declare type ErrorCallback = (err?: Error) => void;
export declare type Callback2<T> = (err: Error | null, result?: T) => void;
export { ICertificateKeyPairProvider } from "node-opcua-common";
