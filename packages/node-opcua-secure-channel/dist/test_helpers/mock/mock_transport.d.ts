/// <reference types="node" />
import { EventEmitter } from "events";
import { GetEndpointsResponse } from "node-opcua-service-endpoints";
import { CloseSecureChannelResponse, OpenSecureChannelResponse } from "node-opcua-service-secure-channel";
import { ActivateSessionResponse, CreateSessionResponse } from "node-opcua-service-session";
import { AcknowledgeMessage } from "node-opcua-transport";
export declare const fakeAcknowledgeMessage: AcknowledgeMessage;
export declare const fakeCloseSecureChannelResponse: CloseSecureChannelResponse;
export declare const fakeOpenSecureChannelResponse: OpenSecureChannelResponse;
export declare const fakeGetEndpointsResponse: GetEndpointsResponse;
export declare const fakeCreateSessionResponse: CreateSessionResponse;
export declare const fakeActivateSessionResponse: ActivateSessionResponse;
export declare class MockServerTransport extends EventEmitter {
    private _replies;
    private _mockTransport;
    private _counter;
    constructor(expectedReplies: any);
}
