import { CallMethodRequest } from "node-opcua-service-call";
import { CallMethodResultOptions } from "node-opcua-types";
import { AddressSpace } from "../address_space_ts";
import { IServerBase, ISessionBase } from "../session_context";
declare type ResponseCallback<T> = (err: Error | null, result?: T) => void;
export declare function callMethodHelper(server: IServerBase, session: ISessionBase, addressSpace: AddressSpace, callMethodRequest: CallMethodRequest, callback: ResponseCallback<CallMethodResultOptions>): void;
export {};
