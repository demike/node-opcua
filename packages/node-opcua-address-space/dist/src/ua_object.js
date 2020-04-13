"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-address-space
 */
const chalk_1 = require("chalk");
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_basic_types_1 = require("node-opcua-basic-types");
const node_opcua_data_model_1 = require("node-opcua-data-model");
const node_opcua_data_model_2 = require("node-opcua-data-model");
const node_opcua_data_value_1 = require("node-opcua-data-value");
const node_opcua_date_time_1 = require("node-opcua-date-time");
const node_opcua_nodeid_1 = require("node-opcua-nodeid");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_variant_1 = require("node-opcua-variant");
const base_node_1 = require("./base_node");
const base_node_private_1 = require("./base_node_private");
class UAObject extends base_node_1.BaseNode {
    constructor(options) {
        super(options);
        this.nodeClass = node_opcua_data_model_1.NodeClass.Object;
        this.eventNotifier = options.eventNotifier || 0;
        node_opcua_assert_1.assert(_.isNumber(this.eventNotifier) && node_opcua_basic_types_1.isValidByte(this.eventNotifier));
        this.symbolicName = options.symbolicName || null;
    }
    get typeDefinitionObj() {
        return super.typeDefinitionObj;
    }
    readAttribute(context, attributeId) {
        const now = node_opcua_date_time_1.getCurrentClock();
        const options = {};
        switch (attributeId) {
            case node_opcua_data_model_2.AttributeIds.EventNotifier:
                node_opcua_assert_1.assert(node_opcua_basic_types_1.isValidByte(this.eventNotifier));
                options.value = { dataType: node_opcua_variant_1.DataType.Byte, value: this.eventNotifier };
                options.serverTimestamp = now.timestamp;
                options.serverPicoseconds = now.picoseconds;
                options.statusCode = node_opcua_status_code_1.StatusCodes.Good;
                break;
            default:
                return base_node_1.BaseNode.prototype.readAttribute.call(this, context, attributeId);
        }
        return new node_opcua_data_value_1.DataValue(options);
    }
    clone(options, optionalFilter, extraInfo) {
        options = options || {};
        options = _.extend(_.clone(options), {
            eventNotifier: this.eventNotifier,
            symbolicName: this.symbolicName
        });
        const cloneObject = base_node_private_1._clone.call(this, UAObject, options, optionalFilter, extraInfo);
        // xx  newObject.propagate_back_references();
        // xx newObject.install_extra_properties();
        return cloneObject;
    }
    /**
     * returns true if the object has some opcua methods
     */
    get hasMethods() {
        return this.getMethods().length > 0;
    }
    getMethodByName(methodName) {
        return super.getMethodByName(methodName);
    }
    getMethods() {
        return super.getMethods();
    }
    /**
     * Raise a transient Event
     */
    raiseEvent(eventType, data) {
        const addressSpace = this.addressSpace;
        if (typeof (eventType) === "string") {
            const eventTypeFound = addressSpace.findEventType(eventType);
            if (!eventTypeFound) {
                throw new Error("raiseEvent: eventType cannot find event Type " + eventType.toString());
            }
            eventType = eventTypeFound;
            if (!eventType || eventType.nodeClass !== node_opcua_data_model_1.NodeClass.ObjectType) {
                throw new Error("eventType must exist and be an UAObjectType" + eventType.toString());
            }
        }
        else if (eventType instanceof node_opcua_nodeid_1.NodeId) {
            const eventTypeFound = addressSpace.findNode(eventType);
            if (!eventTypeFound) {
                throw new Error("raiseEvent: eventType cannot find event Type " + eventType.toString());
            }
            eventType = eventTypeFound;
            if (!eventType || eventType.nodeClass !== node_opcua_data_model_1.NodeClass.ObjectType) {
                throw new Error("eventType must exist and be an UAObjectType" + eventType.toString());
            }
        }
        eventType = eventType;
        let eventTypeNode = eventType;
        // istanbul ignore next
        if (!eventTypeNode) {
            throw new Error("UAObject#raiseEventType : Cannot find event type :" + eventType.toString());
        }
        // coerce EventType
        eventTypeNode = addressSpace.findEventType(eventType);
        const baseEventType = addressSpace.findEventType("BaseEventType");
        node_opcua_assert_1.assert(eventTypeNode.isSupertypeOf(baseEventType));
        data.$eventDataSource = eventTypeNode;
        data.sourceNode = data.sourceNode || { dataType: node_opcua_variant_1.DataType.NodeId, value: this.nodeId };
        const eventData1 = addressSpace.constructEventData(eventTypeNode, data);
        this._bubble_up_event(eventData1);
    }
    _bubble_up_event(eventData) {
        const addressSpace = this.addressSpace;
        const queue = [];
        // walk up the hasNotify / hasEventSource chain
        const m = {};
        // all events are notified to the server object
        // emit on server object
        const server = addressSpace.findNode("Server");
        if (server) {
            node_opcua_assert_1.assert(server.eventNotifier > 0x00, "Server must be an event notifier");
            server.emit("event", eventData);
            m[server.nodeId.toString()] = server;
        }
        else {
            // tslint:disable:no-console
            console.warn(chalk_1.default.yellow("Warning. ") + chalk_1.default.cyan("UAObject#raiseEvent") +
                chalk_1.default.red(" cannot find Server object on addressSpace"));
        }
        addinqueue(this);
        function addinqueue(obj) {
            const key = obj.nodeId.toString();
            if (!m[key]) {
                m[key] = obj;
                queue.push(obj);
            }
        }
        while (queue.length) {
            const obj = queue.pop();
            // emit on object
            obj.emit("event", eventData);
            const elements1 = obj.findReferencesAsObject("HasNotifier", false);
            elements1.forEach(addinqueue);
            const elements2 = obj.findReferencesAsObject("HasEventSource", false);
            elements2.forEach(addinqueue);
        }
    }
    _conditionRefresh(_cache) {
        base_node_private_1.apply_condition_refresh.call(this, _cache);
    }
    toString() {
        const options = new base_node_private_1.ToStringBuilder();
        base_node_private_1.UAObject_toString.call(this, options);
        return options.toString();
    }
}
exports.UAObject = UAObject;
//# sourceMappingURL=ua_object.js.map