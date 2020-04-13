"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/***
 * @module node-opcua-chunkmanager
 */
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_factory_1 = require("node-opcua-factory");
const schemaSequenceHeader = node_opcua_factory_1.buildStructuredType({
    baseType: "BaseUAObject",
    fields: [
        // A monotonically increasing sequence number assigned by the sender to each
        // MessageChunk sent over the ClientSecureChannelLayer.
        { name: "sequenceNumber", fieldType: "UInt32" },
        // An identifier assigned by the client to OPC UA request Message. All MessageChunks for
        // the request and the associated response use the same identifier.
        { name: "requestId", fieldType: "UInt32" },
    ],
    name: "SequenceHeader",
});
class SequenceHeader extends node_opcua_factory_1.BaseUAObject {
    constructor(options) {
        options = options || {};
        super();
        const schema = schemaSequenceHeader;
        /* istanbul ignore next */
        if (node_opcua_factory_1.parameters.debugSchemaHelper) {
            node_opcua_factory_1.check_options_correctness_against_schema(this, schema, options);
        }
        this.sequenceNumber = node_opcua_factory_1.initialize_field(schema.fields[0], options.sequenceNumber);
        this.requestId = node_opcua_factory_1.initialize_field(schema.fields[1], options.requestId);
    }
    encode(stream) {
        super.encode(stream);
        node_opcua_basic_types_1.encodeUInt32(this.sequenceNumber, stream);
        node_opcua_basic_types_1.encodeUInt32(this.requestId, stream);
    }
    decode(stream) {
        super.decode(stream);
        this.sequenceNumber = node_opcua_basic_types_1.decodeUInt32(stream);
        this.requestId = node_opcua_basic_types_1.decodeUInt32(stream);
    }
}
exports.SequenceHeader = SequenceHeader;
SequenceHeader.possibleFields = ["sequenceNumber", "requestId"];
SequenceHeader.schema = schemaSequenceHeader;
SequenceHeader.prototype.schema = SequenceHeader.schema;
//# sourceMappingURL=SequenceHeader.js.map