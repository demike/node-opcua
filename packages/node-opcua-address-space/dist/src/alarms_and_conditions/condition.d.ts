import { LocalizedText, LocalizedTextLike } from "node-opcua-data-model";
import { ConditionSnapshot } from "./condition_snapshot";
export declare function _setAckedState(self: ConditionSnapshot, requestedAckedState: any, eventId?: any, comment?: string | LocalizedText | LocalizedTextLike): import("node-opcua-status-code").ConstantStatusCode;
