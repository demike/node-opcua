import { AddressSpace, BaseNode, Folder, FolderType, InstantiateObjectOptions, ProgramFiniteStateMachine, ProgramFiniteStateMachineType, TransitionEventType, UAAnalogItem, UAObject, UAObjectType, UAReferenceType, UAVariable } from "../source";
export interface FlowToReference extends UAReferenceType {
}
export interface HotFlowToReference extends UAReferenceType {
}
export interface SignalToReference extends UAReferenceType {
}
export interface BoilerHaltedEventType extends TransitionEventType {
}
export interface CustomControllerB {
    input1: UAVariable;
    input2: UAVariable;
    input3: UAVariable;
    controlOut: UAVariable;
}
export interface CustomControllerType extends CustomControllerB, UAObjectType {
}
export interface CustomController extends CustomControllerB, UAObject {
}
export interface GenericSensorB {
    output: UAAnalogItem;
}
export interface GenericSensorType extends GenericSensorB, UAObjectType {
}
export interface GenericSensor extends GenericSensorB, UAObject {
}
export interface GenericControllerB {
    controlOut: UAVariable;
    measurement: UAVariable;
    setPoint: UAVariable;
}
export interface GenericControllerType extends GenericControllerB, UAObjectType {
}
export interface GenericController extends GenericControllerB, UAObject {
}
export interface FlowControllerType extends GenericControllerType {
}
export interface FlowController extends GenericController {
}
export interface LevelControllerType extends GenericControllerType {
}
export interface LevelController extends GenericController {
}
export interface FlowTransmitterType extends GenericSensorType {
}
export interface FlowTransmitter extends GenericSensor {
}
export interface LevelIndicatorType extends GenericSensorType {
}
export interface LevelIndicator extends GenericSensor {
}
export interface GenericActuatorType extends UAObjectType {
    input: UAAnalogItem;
}
export interface GenericActuator extends UAObject {
    input: UAAnalogItem;
}
export interface ValveType extends GenericActuatorType {
}
export interface Valve extends GenericActuator {
}
export interface BoilerInputPipeType extends FolderType {
    ftX001: FlowTransmitter;
    valveX001: Valve;
}
export interface BoilerInputPipe extends Folder {
    ftX001: FlowTransmitter;
    valveX001: Valve;
}
export interface BoilerOutputPipeType extends FolderType {
    ftX002: FlowTransmitter;
}
export interface BoilerOutputPipe extends Folder {
    ftX002: FlowTransmitter;
}
export interface BoilerDrumpType extends FolderType {
    liX001: LevelIndicator;
}
export interface BoilerDrump extends Folder {
    liX001: LevelIndicator;
}
export interface BoilerStateMachineType extends ProgramFiniteStateMachineType {
}
export interface BoilerStateMachine extends ProgramFiniteStateMachine {
}
export interface BoilerType extends UAObjectType {
    ccX001: CustomController;
    fcX001: FlowController;
    lcX001: LevelController;
    pipeX001: BoilerInputPipe;
    drumX001: BoilerDrump;
    pipeX002: BoilerOutputPipe;
    drumX002: BoilerDrump;
    simulation: BoilerStateMachine;
    instantiate(options: InstantiateObjectOptions): Boiler;
}
export interface Boiler extends UAObject {
    ccX001: CustomController;
    fcX001: FlowController;
    lcX001: LevelController;
    pipeX001: BoilerInputPipe;
    drumX001: BoilerDrump;
    pipeX002: BoilerOutputPipe;
    drumX002: BoilerDrump;
    simulation: BoilerStateMachine;
}
export declare function createBoilerType(addressSpace: AddressSpace): BoilerType;
export declare function makeBoiler(addressSpace: AddressSpace, options: {
    browseName: string;
    organizedBy: BaseNode;
}): Boiler;
