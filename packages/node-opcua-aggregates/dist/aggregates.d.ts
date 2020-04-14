import { AddressSpace, BaseNode, UAObject, UAServerCapabilities, UAVariable } from "node-opcua-address-space";
import { AggregateConfigurationOptionsEx } from "./interval";
export declare function createHistoryServerCapabilities(addressSpace: AddressSpace, serverCapabilities: UAServerCapabilities): UAObject;
export declare type AggregateFunctioName = "AnnotationCount" | "Average" | "Count" | "Delta" | "DeltaBounds" | "DurationBad" | "DurationGood" | "DurationInStateNonZero" | "DurationInStateZero" | "EndBound" | "Interpolative" | "Maximum" | "Maximum2" | "MaximumActualTime" | "MaximumActualTime2" | "Minimum" | "Minimum2" | "MinimumActualTime" | "MinimumActualTime2" | "NumberOfTransitions" | "PercentBad" | "PercentGood" | "Range" | "Range2" | "StandardDeviationPopulation" | "StandardDeviationSample" | "Start" | "StartBound" | "TimeAverage" | "TimeAverage2" | "Total" | "Total2" | "VariancePopulation" | "VarianceSample" | "WorstQuality" | "WorstQuality2";
export declare function addAggregateSupport(addressSpace: AddressSpace): void;
export declare function installAggregateConfigurationOptions(node: UAVariable, options: AggregateConfigurationOptionsEx): void;
export declare function getAggregateConfiguration(node: BaseNode): AggregateConfigurationOptionsEx;
