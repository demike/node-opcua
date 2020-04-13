"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
// tslint:disable:no-empty-interface
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_utils_1 = require("node-opcua-utils");
const source_1 = require("../source");
const finite_state_machine_1 = require("../src/state_machine/finite_state_machine");
function MygetExecutableFlag(method, toState, methodName) {
    const stateMachineW = finite_state_machine_1.promoteToStateMachine(method.parent);
    return stateMachineW.isValidTransition(toState);
}
function implementProgramStateMachine(programStateMachine) {
    function installMethod(methodName, toState) {
        let method = programStateMachine.getMethodByName(methodName);
        if (!method) {
            // 'method' has ModellingRule=OptionalPlaceholder and should be created from the type definition
            let methodToClone = programStateMachine.typeDefinitionObj.getMethodByName(methodName);
            if (!methodToClone) {
                methodToClone = programStateMachine.typeDefinitionObj.subtypeOfObj.getMethodByName(methodName);
            }
            methodToClone.clone({
                componentOf: programStateMachine
            });
            method = programStateMachine.getMethodByName(methodName);
            node_opcua_assert_1.assert(method !== null, "Method clone should cause parent object to be extended");
        }
        node_opcua_assert_1.assert(method.nodeClass === node_opcua_data_model_1.NodeClass.Method);
        method._getExecutableFlag = function ( /* sessionContext: SessionContext */) {
            // must use  a function here to capture 'this'
            return MygetExecutableFlag(this, toState, methodName);
        };
        method.bindMethod(function (inputArguments, context, callback) {
            const stateMachineW = this.parent;
            // tslint:disable-next-line:no-console
            console.log("Boiler System :  " + methodName + " about to process");
            stateMachineW.setState(toState);
            callback(null, {
                outputArguments: [],
                statusCode: node_opcua_status_code_1.StatusCodes.Good,
            });
        });
        node_opcua_assert_1.assert(programStateMachine.getMethodByName(methodName) !== null, "Method " + methodName + " should be added to parent object (checked with getMethodByName)");
        const lc_name = node_opcua_utils_1.lowerFirstLetter(methodName);
    }
    installMethod("Halt", "Halted");
    installMethod("Reset", "Ready");
    installMethod("Start", "Running");
    installMethod("Suspend", "Suspended");
    installMethod("Resume", "Running");
}
function addRelation(srcNode, referenceType, targetNode) {
    node_opcua_assert_1.assert(srcNode, "expecting srcNode !== null");
    node_opcua_assert_1.assert(targetNode, "expecting targetNode !== null");
    if (typeof referenceType === "string") {
        const nodes = srcNode.findReferencesAsObject(referenceType, true);
        node_opcua_assert_1.assert(nodes.length === 1);
        referenceType = nodes[0];
    }
    srcNode.addReference({ referenceType: referenceType.nodeId, nodeId: targetNode });
}
// tslint:disable:no-console
function createBoilerType(addressSpace) {
    const namespace = addressSpace.getOwnNamespace();
    // istanbul ignore next
    if (namespace.findObjectType("BoilerType")) {
        console.warn("createBoilerType has already been called");
        return namespace.findObjectType("BoilerType");
    }
    // --------------------------------------------------------
    // referenceTypes
    // --------------------------------------------------------
    // create new reference Type FlowTo HotFlowTo & SignalTo
    const flowTo = namespace.addReferenceType({
        browseName: "FlowTo",
        description: "a reference that indicates a flow between two objects",
        inverseName: "FlowFrom",
        subtypeOf: "NonHierarchicalReferences"
    });
    const hotFlowTo = namespace.addReferenceType({
        browseName: "HotFlowTo",
        description: "a reference that indicates a high temperature flow between two objects",
        inverseName: "HotFlowFrom",
        subtypeOf: flowTo
    });
    const signalTo = namespace.addReferenceType({
        browseName: "SignalTo",
        description: "a reference that indicates an electrical signal between two variables",
        inverseName: "SignalFrom",
        subtypeOf: "NonHierarchicalReferences"
    });
    flowTo.isSupertypeOf(addressSpace.findReferenceType("References"));
    flowTo.isSupertypeOf(addressSpace.findReferenceType("NonHierarchicalReferences"));
    hotFlowTo.isSupertypeOf(addressSpace.findReferenceType("References"));
    hotFlowTo.isSupertypeOf(addressSpace.findReferenceType("NonHierarchicalReferences"));
    hotFlowTo.isSupertypeOf(addressSpace.findReferenceType("1:FlowTo"));
    const NonHierarchicalReferences = addressSpace.findReferenceType("NonHierarchicalReferences");
    // --------------------------------------------------------
    // EventTypes
    // --------------------------------------------------------
    const boilerHaltedEventType = namespace.addEventType({
        browseName: "BoilerHaltedEventType",
        subtypeOf: "TransitionEventType"
    });
    // --------------------------------------------------------
    // CustomControllerType
    // --------------------------------------------------------
    const customControllerType = namespace.addObjectType({
        browseName: "CustomControllerType",
        description: "a custom PID controller with 3 inputs"
    });
    const input1 = namespace.addVariable({
        browseName: "Input1",
        dataType: "Double",
        description: "a reference that indicates an electrical signal between two variables",
        modellingRule: "Mandatory",
        propertyOf: customControllerType,
    });
    const input2 = namespace.addVariable({
        browseName: "Input2",
        dataType: "Double",
        modellingRule: "Mandatory",
        propertyOf: customControllerType
    });
    const input3 = namespace.addVariable({
        browseName: "Input3",
        dataType: "Double",
        modellingRule: "Mandatory",
        propertyOf: customControllerType
    });
    const controlOut = namespace.addVariable({
        browseName: "ControlOut",
        dataType: "Double",
        modellingRule: "Mandatory",
        propertyOf: customControllerType
    });
    const description = namespace.addVariable({
        browseName: "Description",
        dataType: "LocalizedText",
        modellingRule: "Mandatory",
        propertyOf: customControllerType
    });
    // --------------------------------------------------------
    // GenericSensorType
    // --------------------------------------------------------
    const genericSensorType = namespace.addObjectType({
        browseName: "GenericSensorType"
    });
    namespace.addAnalogDataItem({
        browseName: "Output",
        componentOf: genericSensorType,
        dataType: "Double",
        engineeringUnitsRange: { low: -100, high: 200 },
        modellingRule: "Mandatory"
    });
    genericSensorType.install_extra_properties();
    genericSensorType.getComponentByName("Output");
    node_opcua_assert_1.assert(genericSensorType.getComponentByName("Output").modellingRule === "Mandatory");
    // --------------------------------------------------------
    // GenericSensorType  <---- GenericControllerType
    // --------------------------------------------------------
    const genericControllerType = namespace.addObjectType({
        browseName: "GenericControllerType"
    });
    namespace.addVariable({
        browseName: "ControlOut",
        dataType: "Double",
        modellingRule: "Mandatory",
        propertyOf: genericControllerType
    });
    namespace.addVariable({
        browseName: "Measurement",
        dataType: "Double",
        modellingRule: "Mandatory",
        propertyOf: genericControllerType
    });
    namespace.addVariable({
        browseName: "SetPoint",
        dataType: "Double",
        modellingRule: "Mandatory",
        propertyOf: genericControllerType
    });
    // --------------------------------------------------------------------------------
    // GenericSensorType  <---- GenericControllerType <--- FlowControllerType
    // --------------------------------------------------------------------------------
    const flowControllerType = namespace.addObjectType({
        browseName: "FlowControllerType",
        subtypeOf: genericControllerType
    });
    // --------------------------------------------------------------------------------
    // GenericSensorType  <---- GenericControllerType <--- LevelControllerType
    // --------------------------------------------------------------------------------
    const levelControllerType = namespace.addObjectType({
        browseName: "LevelControllerType",
        subtypeOf: genericControllerType
    });
    // --------------------------------------------------------------------------------
    // GenericSensorType  <---- FlowTransmitterType
    // --------------------------------------------------------------------------------
    const flowTransmitterType = namespace.addObjectType({
        browseName: "FlowTransmitterType",
        subtypeOf: genericSensorType
    });
    // --------------------------------------------------------------------------------
    // GenericSensorType  <---- LevelIndicatorType
    // --------------------------------------------------------------------------------
    const levelIndicatorType = namespace.addObjectType({
        browseName: "LevelIndicatorType",
        subtypeOf: genericSensorType
    });
    // --------------------------------------------------------------------------------
    // GenericActuatorType
    // --------------------------------------------------------------------------------
    const genericActuatorType = namespace.addObjectType({
        browseName: "GenericActuatorType"
    });
    namespace.addAnalogDataItem({
        browseName: "Input",
        componentOf: genericActuatorType,
        dataType: "Double",
        engineeringUnitsRange: { low: -100, high: 200 },
        modellingRule: "Mandatory"
    });
    // --------------------------------------------------------------------------------
    // GenericActuatorType  <---- ValveType
    // --------------------------------------------------------------------------------
    const valveType = namespace.addObjectType({
        browseName: "ValveType",
        subtypeOf: genericActuatorType
    });
    // --------------------------------------------------------------------------------
    // FolderType  <---- BoilerInputPipeType
    // --------------------------------------------------------------------------------
    const boilerInputPipeType = namespace.addObjectType({
        browseName: "BoilerInputPipeType",
        subtypeOf: "FolderType"
    });
    const ftx1 = flowTransmitterType.instantiate({
        browseName: "FTX001",
        componentOf: boilerInputPipeType,
        modellingRule: "Mandatory",
        notifierOf: boilerInputPipeType
    });
    node_opcua_assert_1.assert(ftx1.output.browseName.toString() === "1:Output");
    const valve1 = valveType.instantiate({
        browseName: "ValveX001",
        componentOf: boilerInputPipeType,
        modellingRule: "Mandatory"
    });
    // --------------------------------------------------------------------------------
    // FolderType  <---- BoilerOutputPipeType
    // --------------------------------------------------------------------------------
    const boilerOutputPipeType = namespace.addObjectType({
        browseName: "BoilerOutputPipeType",
        subtypeOf: "FolderType"
    });
    const ftx2 = flowTransmitterType.instantiate({
        browseName: "FTX002",
        componentOf: boilerOutputPipeType,
        modellingRule: "Mandatory",
        notifierOf: boilerOutputPipeType
    });
    ftx2.getComponentByName("Output").browseName.toString();
    // --------------------------------)------------------------------------------------
    // FolderType  <---- BoilerDrumType
    // --------------------------------------------------------------------------------
    const boilerDrumType = namespace.addObjectType({
        browseName: "BoilerDrumType",
        subtypeOf: "FolderType"
    });
    const levelIndicator = levelIndicatorType.instantiate({
        browseName: "LIX001",
        componentOf: boilerDrumType,
        modellingRule: "Mandatory",
        notifierOf: boilerDrumType
    });
    const programFiniteStateMachineType = addressSpace.findObjectType("ProgramStateMachineType");
    // --------------------------------------------------------
    // define boiler State Machine
    // --------------------------------------------------------
    const boilerStateMachineType = namespace.addObjectType({
        browseName: "BoilerStateMachineType",
        postInstantiateFunc: implementProgramStateMachine,
        subtypeOf: programFiniteStateMachineType,
    });
    // programStateMachineType has Optional placeHolder for method "Halt", "Reset","Start","Suspend","Resume")
    function addMethod(baseType, objectType, methodName) {
        node_opcua_assert_1.assert(!objectType.getMethodByName(methodName));
        const method = baseType.getMethodByName(methodName);
        const m = method.clone({
            componentOf: objectType,
            modellingRule: "Mandatory"
        });
        node_opcua_assert_1.assert(objectType.getMethodByName(methodName));
        node_opcua_assert_1.assert(objectType.getMethodByName(methodName).modellingRule === "Mandatory");
    }
    addMethod(programFiniteStateMachineType, boilerStateMachineType, "Halt");
    addMethod(programFiniteStateMachineType, boilerStateMachineType, "Reset");
    addMethod(programFiniteStateMachineType, boilerStateMachineType, "Start");
    addMethod(programFiniteStateMachineType, boilerStateMachineType, "Suspend");
    addMethod(programFiniteStateMachineType, boilerStateMachineType, "Resume");
    // --------------------------------------------------------------------------------
    // BoilerType
    // --------------------------------------------------------------------------------
    const boilerType = namespace.addObjectType({
        browseName: "BoilerType"
    });
    // BoilerType.CCX001 (CustomControllerType)
    const ccX001 = customControllerType.instantiate({
        browseName: "CCX001",
        componentOf: boilerType,
        modellingRule: "Mandatory"
    });
    // BoilerType.FCX001 (FlowController)
    const fcX001 = flowControllerType.instantiate({
        browseName: "FCX001",
        componentOf: boilerType,
        modellingRule: "Mandatory"
    });
    // BoilerType.LCX001 (LevelControllerType)
    const lcX001 = levelControllerType.instantiate({
        browseName: "LCX001",
        componentOf: boilerType,
        modellingRule: "Mandatory"
    });
    // BoilerType.PipeX001 (BoilerInputPipeType)
    const pipeX001 = boilerInputPipeType.instantiate({
        browseName: "PipeX001",
        componentOf: boilerType,
        modellingRule: "Mandatory",
        notifierOf: boilerType
    });
    // BoilerType.DrumX001 (BoilerDrumType)
    const drumx001 = boilerDrumType.instantiate({
        browseName: "DrumX001",
        componentOf: boilerType,
        modellingRule: "Mandatory",
        notifierOf: boilerType
    });
    // BoilerType.PipeX002 (BoilerOutputPipeType)
    const pipeX002 = boilerOutputPipeType.instantiate({
        browseName: "PipeX002",
        componentOf: boilerType,
        modellingRule: "Mandatory",
        notifierOf: boilerType
    });
    // BoilerType.Simulation (BoilerStateMachineType)
    const simulation = boilerStateMachineType.instantiate({
        browseName: "Simulation",
        componentOf: boilerType,
        eventSourceOf: boilerType,
        modellingRule: "Mandatory",
    });
    addRelation(pipeX001, flowTo, drumx001);
    addRelation(drumx001, hotFlowTo, pipeX002);
    node_opcua_assert_1.assert(boilerType.pipeX001.ftX001);
    node_opcua_assert_1.assert(boilerType.pipeX001.ftX001.output);
    node_opcua_assert_1.assert(boilerType.fcX001.measurement);
    addRelation(boilerType.pipeX001.ftX001.output, signalTo, boilerType.fcX001.measurement);
    addRelation(boilerType.pipeX001.ftX001.output, signalTo, boilerType.ccX001.input2);
    addRelation(boilerType.fcX001.controlOut, signalTo, boilerType.pipeX001.valveX001.input);
    // indicates that the level controller gets its measurement from the drum's level indicator.
    addRelation(boilerType.drumX001.liX001.output, signalTo, boilerType.lcX001.measurement);
    addRelation(boilerType.pipeX002.ftX002.output, signalTo, boilerType.ccX001.input3);
    addRelation(boilerType.lcX001.controlOut, signalTo, boilerType.ccX001.input1);
    addRelation(boilerType.ccX001.controlOut, signalTo, boilerType.fcX001.setPoint);
    return boilerType;
}
exports.createBoilerType = createBoilerType;
function makeBoiler(addressSpace, options) {
    const namespace = addressSpace.getOwnNamespace();
    node_opcua_assert_1.assert(options);
    let boilerType;
    boilerType = namespace.findObjectType("BoilerType");
    // istanbul ignore next
    if (!boilerType) {
        createBoilerType(addressSpace);
        boilerType = namespace.findObjectType("BoilerType");
    }
    // now instantiate boiler
    const boiler1 = boilerType.instantiate({
        browseName: options.browseName,
        organizedBy: addressSpace.rootFolder.objects
    });
    finite_state_machine_1.promoteToStateMachine(boiler1.simulation);
    const boilerStateMachine = boiler1.simulation;
    const haltedState = boilerStateMachine.getStateByName("Halted");
    node_opcua_assert_1.assert(haltedState.browseName.toString() === "Halted");
    const readyState = boilerStateMachine.getStateByName("Ready");
    node_opcua_assert_1.assert(readyState.browseName.toString() === "Ready");
    const runningState = boilerStateMachine.getStateByName("Running");
    node_opcua_assert_1.assert(runningState.browseName.toString() === "Running");
    // when state is "Halted" , the Halt method is not executable
    boilerStateMachine.setState(haltedState);
    node_opcua_assert_1.assert(boilerStateMachine.currentStateNode.browseName.toString() === "Halted");
    const context = source_1.SessionContext.defaultContext;
    // halt method should not be executable when current State is Halted
    node_opcua_assert_1.assert(!boilerStateMachine.halt.getExecutableFlag(context));
    // when state is "Reset" , the Halt method becomes executable
    boilerStateMachine.setState(readyState);
    node_opcua_assert_1.assert(boilerStateMachine.halt.getExecutableFlag(context));
    return boiler1;
}
exports.makeBoiler = makeBoiler;
//# sourceMappingURL=boiler_system.js.map