/// <reference types="node" />
/**
 * @module node-opcua-file-transfer-client
 */
import { Int32, UInt16, UInt32, UInt64 } from "node-opcua-basic-types";
import { NodeId } from "node-opcua-nodeid";
import { IBasicSession } from "node-opcua-pseudo-session";
import { OpenFileMode } from "../open_mode";
export { OpenFileMode } from "../open_mode";
export declare class ClientFile {
    fileHandle: number;
    private session;
    private readonly fileNodeId;
    private openMethodNodeId?;
    private closeMethodNodeId?;
    private setPositionNodeId?;
    private getPositionNodeId?;
    private readNodeId?;
    private writeNodeId?;
    private openCountNodeId?;
    private sizeNodeId?;
    constructor(session: IBasicSession, nodeId: NodeId);
    open(mode: OpenFileMode): Promise<number>;
    close(): Promise<void>;
    getPosition(): Promise<UInt64>;
    setPosition(position: UInt64 | UInt32): Promise<void>;
    read(bytesToRead: Int32): Promise<Buffer>;
    write(data: Buffer): Promise<void>;
    openCount(): Promise<UInt16>;
    size(): Promise<UInt64>;
    private extractMethodsIds;
    private ensureInitialized;
}
/**
 * 5.2.10 UserRolePermissions
 *
 * The optional UserRolePermissions Attribute specifies the Permissions that apply to a Node for
 * all Roles granted to current Session. The value of the Attribute is an array of
 * RolePermissionType Structures (see Table 8).
 * Clients may determine their effective Permissions by logically ORing the Permissions for each
 * Role in the array.
 *  The value of this Attribute is derived from the rules used by the Server to map Sessions to
 * Roles. This mapping may be vendor specific or it may use the standard Role model defined in 4.8.
 * This Attribute shall not be writeable.
 * If not specified, the value of DefaultUserRolePermissions Property from the Namespace
 * Metadata Object associated with the Node is used instead. If the NamespaceMetadata Object
 * does not define the Property or does not exist, then the Server does not publish any information
 * about Roles mapped to the current Session.
 *
 *
 * 5.2.11 AccessRestrictions
 * The optional AccessRestrictions Attribute specifies the AccessRestrictions that apply to a Node.
 * Its data type is defined in 8.56. If a Server supports AccessRestrictions for a particular
 * Namespace it adds the DefaultAccessRestrictions Property to the NamespaceMetadata Object
 * for that Namespace (see Figure 8). If a particular Node in the Namespace needs to override
 * the default value the Server adds the AccessRestrictions Attribute to the Node.
 * If a Server implements a vendor specific access restriction model for a Namespace, it does not
 * add the DefaultAccessRestrictions Property to the NamespaceMetadata Object.
 *
 *
 * DefaultAccessRestrictions
 *
 */
