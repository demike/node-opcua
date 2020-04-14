import { AddressSpace, UAVariable } from "../source/address_space_ts";
import { UANonExclusiveLimitAlarm } from "../src/alarms_and_conditions";
import { UAExclusiveLimitAlarm } from "../src/alarms_and_conditions/ua_exclusive_limit_alarm";
export interface IAlarmTestData {
    tankLevel: UAVariable;
    tankLevelCondition: UAExclusiveLimitAlarm;
    tankLevel2: UAVariable;
    tankLevelCondition2: UANonExclusiveLimitAlarm;
    tankTripCondition: null;
}
export declare function construct_demo_alarm_in_address_space(test: IAlarmTestData, addressSpace: AddressSpace): void;
