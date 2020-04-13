"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
function add_eventGeneratorObject(namespace, parentFolder) {
    const myEvtType = namespace.addEventType({
        browseName: "MyEventType",
        subtypeOf: "BaseEventType" // should be implicit
    });
    const myObject = namespace.addObject({
        browseName: "EventGeneratorObject",
        organizedBy: parentFolder
    });
    myObject.addReference({
        nodeId: myEvtType,
        referenceType: "AlwaysGeneratesEvent"
    });
    const method = namespace.addMethod(myObject, {
        browseName: "EventGeneratorMethod",
        inputArguments: [
            {
                dataType: node_opcua_variant_1.DataType.String,
                description: { text: "Event Message" },
                name: "message"
            },
            {
                dataType: node_opcua_variant_1.DataType.UInt32,
                description: { text: "Event Severity" },
                name: "severity"
            }
        ],
        outputArguments: []
    });
    method.bindMethod((inputArguments, context, callback) => {
        // xx console.log("In Event Generator Method");
        // xx console.log(this.toString());
        // xx console.log(context.object.toString());
        // xx console.log("inputArguments ", inputArguments[0].toString());
        const message = inputArguments[0].value || "Hello from Event Generator Object";
        const severity = inputArguments[1].value || 0;
        const myEventType = namespace.addressSpace.findEventType("MyEventType", namespace.index);
        context.object.raiseEvent(myEventType, {
            message: {
                dataType: node_opcua_variant_1.DataType.LocalizedText,
                value: { text: message }
            },
            severity: {
                dataType: node_opcua_variant_1.DataType.UInt32,
                value: severity
            }
        });
        // console.log(require("util").inspect(context).toString());
        const callMethodResult = {
            outputArguments: [],
            statusCode: node_opcua_status_code_1.StatusCodes.Good
        };
        callback(null, callMethodResult);
    });
}
exports.add_eventGeneratorObject = add_eventGeneratorObject;
//# sourceMappingURL=add_event_generator_object.js.map