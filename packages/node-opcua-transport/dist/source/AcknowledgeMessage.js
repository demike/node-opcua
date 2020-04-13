"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-transport
 */
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_factory_1 = require("node-opcua-factory");
const schemaAcknowledgeMessage = node_opcua_factory_1.buildStructuredType({
    name: "AcknowledgeMessage",
    baseType: "BaseObjectType",
    fields: [
        {
            name: "protocolVersion",
            fieldType: "UInt32",
            documentation: "The latest version of the OPC UA TCP protocol supported by the Server."
        },
        { name: "receiveBufferSize", fieldType: "UInt32" },
        { name: "sendBufferSize", fieldType: "UInt32" },
        { name: "maxMessageSize", fieldType: "UInt32", documentation: "The maximum size for any request message." },
        {
            name: "maxChunkCount",
            fieldType: "UInt32",
            documentation: "The maximum number of chunks in any request message."
        }
    ]
});
class AcknowledgeMessage extends node_opcua_factory_1.BaseUAObject {
    constructor(options) {
        options = options || {};
        super();
        const schema = schemaAcknowledgeMessage;
        /* istanbul ignore next */
        if (node_opcua_factory_1.parameters.debugSchemaHelper) {
            node_opcua_factory_1.check_options_correctness_against_schema(this, schema, options);
        }
        this.protocolVersion = node_opcua_factory_1.initialize_field(schema.fields[0], options.protocolVersion);
        this.receiveBufferSize = node_opcua_factory_1.initialize_field(schema.fields[1], options.receiveBufferSize);
        this.sendBufferSize = node_opcua_factory_1.initialize_field(schema.fields[2], options.sendBufferSize);
        this.maxMessageSize = node_opcua_factory_1.initialize_field(schema.fields[3], options.maxMessageSize);
        this.maxChunkCount = node_opcua_factory_1.initialize_field(schema.fields[4], options.maxChunkCount);
    }
    encode(stream) {
        super.encode(stream);
        node_opcua_basic_types_1.encodeUInt32(this.protocolVersion, stream);
        node_opcua_basic_types_1.encodeUInt32(this.receiveBufferSize, stream);
        node_opcua_basic_types_1.encodeUInt32(this.sendBufferSize, stream);
        node_opcua_basic_types_1.encodeUInt32(this.maxMessageSize, stream);
        node_opcua_basic_types_1.encodeUInt32(this.maxChunkCount, stream);
    }
    decode(stream) {
        // call base class implementation first
        super.decode(stream);
        this.protocolVersion = node_opcua_basic_types_1.decodeUInt32(stream);
        this.receiveBufferSize = node_opcua_basic_types_1.decodeUInt32(stream);
        this.sendBufferSize = node_opcua_basic_types_1.decodeUInt32(stream);
        this.maxMessageSize = node_opcua_basic_types_1.decodeUInt32(stream);
        this.maxChunkCount = node_opcua_basic_types_1.decodeUInt32(stream);
    }
}
exports.AcknowledgeMessage = AcknowledgeMessage;
AcknowledgeMessage.possibleFields = [
    "protocolVersion",
    "receiveBufferSize",
    "sendBufferSize",
    "maxMessageSize",
    "maxChunkCount"
];
AcknowledgeMessage.schema = schemaAcknowledgeMessage;
//# sourceMappingURL=AcknowledgeMessage.js.map