import { StatusCode } from "node-opcua-status-code";
import { Variant } from "node-opcua-variant";
import { Property, UAAnalogItem as UAAnalogItemPublic } from "../../source";
import { UADataItem } from "./ua_data_item";
export interface UAAnalogItem {
    engineeringUnits: Property<"EUInformation">;
    instrumentRange?: Property<"Range">;
    euRange: Property<"Range">;
}
export declare class UAAnalogItem extends UADataItem implements UAAnalogItemPublic {
    isValueInRange(value: Variant): StatusCode;
}
