import { StructuredTypeSchema } from "node-opcua-factory";
import { NodeId } from "node-opcua-nodeid";
import { IBasicSession } from "node-opcua-pseudo-session";
import { TypeDictionary } from "node-opcua-schemas";
import { ExtraDataTypeManager } from "./extra_data_type_manager";
export declare function exploreDataTypeDefinition(session: IBasicSession, dataTypeDictionaryTypeNode: NodeId, typeDictionary: TypeDictionary, namespaces: string[]): Promise<void>;
/**
 * Extract all custom dataType
 * @param session
 * @param dataTypeManager
 * @async
 */
export declare function extractNamespaceDataType(session: IBasicSession, dataTypeManager: ExtraDataTypeManager): Promise<void>;
export declare function getDataTypeDefinition(session: IBasicSession, dataTypeNodeId: NodeId, extraDataTypeManager: ExtraDataTypeManager): Promise<StructuredTypeSchema>;
