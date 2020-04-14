import { DataValue } from "node-opcua-data-value";
import { IBasicSession } from "node-opcua-pseudo-session";
export declare function getExtraDataTypeManager(session: IBasicSession): Promise<any>;
export declare function promoteOpaqueStructure(session: IBasicSession, dataValues: DataValue[]): Promise<void>;
