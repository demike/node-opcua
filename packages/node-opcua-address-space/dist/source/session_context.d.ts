import { Certificate } from "node-opcua-crypto";
import { AnonymousIdentityToken, UserNameIdentityToken, X509IdentityToken, MessageSecurityMode } from "node-opcua-types";
import { BaseNode, ISessionContext, UAObject, UAObjectType } from "./address_space_ts";
declare type UserIdentityToken = UserNameIdentityToken | AnonymousIdentityToken | X509IdentityToken;
export interface IChannelBase {
    clientCertificate: Certificate | null;
    securityMode: MessageSecurityMode;
    securityPolicy: string;
}
/**
 *
 */
export interface ISessionBase {
    userIdentityToken?: UserIdentityToken;
    channel?: IChannelBase;
}
/**
 * OPC Unified Architecture, Part 3 13 Release 1.04
 * 4.8.2 Well Known Roles
 * All Servers should support the well-known Roles which are defined in Table 2. The NodeIds
 * for the well-known Roles are defined in Part 6.
 * Table 2 – Well-Known Roles
 * BrowseName           Suggested Permissions
 * Anonymous            The Role has very limited access for use when a Session has anonymous credentials.
 * AuthenticatedUser    The Role has limited access for use when a Session has valid non-anonymous credentials
 *                      but has not been explicitly granted access to a Role.
 * Observer             The Role is allowed to browse, read live data, read historical data/events or subscribe to data/events.
 * Operator             The Role is allowed to browse, read live data, read historical data/events or subscribe to data/events.
 *                      In addition, the Session is allowed to write some live data and call some Methods.
 * Engineer             The Role is allowed to browse, read/write configuration data, read historical data/events,
 *                      call Methods or subscribe to data/events.
 * Supervisor           The Role is allowed to browse, read live data, read historical data/events, call Methods or
 *                      subscribe to data/events.
 * ConfigureAdmin       The Role is allowed to change the non-security related config
 * SystemAdmin          The Role is allowed to read and modify security related config
 *
 */
export interface IUserManager {
    getUserRole?: (user: string) => string;
}
export interface IServerBase {
    userManager?: IUserManager;
}
export interface SessionContextOptions {
    session?: ISessionBase;
    object?: UAObject | UAObjectType;
    server?: IServerBase;
}
export declare class SessionContext implements ISessionContext {
    static defaultContext: SessionContext;
    object: any;
    currentTime?: Date;
    continuationPoints: any;
    userIdentity: any;
    readonly session?: ISessionBase;
    readonly server?: IServerBase;
    constructor(options?: SessionContextOptions);
    /**
     * getCurrentUserRole
     *
     * guest   => anonymous user (unauthenticated)
     * default => default authenticated user
     *
     */
    getCurrentUserRole(): string;
    /**
     * @method checkPermission
     * @param node
     * @param action
     * @return {Boolean}
     */
    checkPermission(node: BaseNode, action: string): boolean;
}
export {};
