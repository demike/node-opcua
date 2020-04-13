"use strict";
/**
 * @module node-opcua-address-space.AlarmsAndConditions
 */
Object.defineProperty(exports, "__esModule", { value: true });
// --------------------------------------------------------------------------------------------------
// ShelvingStateMachine
// --------------------------------------------------------------------------------------------------
const _ = require("underscore");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_status_code_1 = require("node-opcua-status-code");
const node_opcua_debug_1 = require("node-opcua-debug");
const node_opcua_variant_1 = require("node-opcua-variant");
const finite_state_machine_1 = require("../state_machine/finite_state_machine");
const ua_alarm_condition_base_1 = require("./ua_alarm_condition_base");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
class ShelvingStateMachine extends finite_state_machine_1.StateMachine {
    static promote(object) {
        const shelvingState = object;
        finite_state_machine_1.promoteToStateMachine(shelvingState);
        Object.setPrototypeOf(shelvingState, ShelvingStateMachine.prototype);
        shelvingState._timer = null;
        if (shelvingState.unshelve) {
            shelvingState.unshelve.bindMethod(_unshelve_method);
        }
        if (shelvingState.timedShelve) {
            shelvingState.timedShelve.bindMethod(_timedShelve_method);
        }
        if (shelvingState.oneShotShelve) {
            shelvingState.oneShotShelve.bindMethod(_oneShotShelve_method);
        }
        // install unshelveTime
        if (shelvingState.unshelveTime) {
            shelvingState.unshelveTime.minimumSamplingInterval = 500;
            shelvingState.unshelveTime.bindVariable({
                get: _unShelveTimeFunc.bind(null, shelvingState)
            }, true);
        }
        node_opcua_assert_1.assert(shelvingState instanceof ShelvingStateMachine);
        return shelvingState;
    }
}
exports.ShelvingStateMachine = ShelvingStateMachine;
// The Unshelve Method sets the AlarmCondition to the Unshelved state. Normally, the MethodId found
// the Shelving child of the Condition instance and the NodeId of the Shelving object as the ObjectId
// are passed to the Call Service. However, some Servers do not expose Condition instances in the
// AddressSpace. Therefore all Servers shall also allow Clients to call the Unshelve Method by
// specifying ConditionId as the ObjectId. The Method cannot be called with an ObjectId of the
// ShelvedStateMachineType Node.
// output => BadConditionNotShelved
function _unshelve_method(inputArguments, context, callback) {
    node_opcua_assert_1.assert(inputArguments.length === 0);
    // var alarmNode = context.object.parent;
    // if (!(alarmNode instanceof UAAlarmConditionBase)) {
    //     return callback(null, {statusCode: StatusCodes.BadNodeIdInvalid});
    // }
    //
    // if (!alarmNode.getEnabledState() ) {
    //     return callback(null, {statusCode: StatusCodes.BadConditionDisabled});
    // }
    const shelvingState = context.object;
    finite_state_machine_1.promoteToStateMachine(shelvingState);
    if (shelvingState.getCurrentState() === "Unshelved") {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadConditionNotShelved
        });
    }
    shelvingState.setState("Unshelved");
    shelvingState._unsheveldTime = new Date(); // now
    _clear_timer_if_any(shelvingState);
    node_opcua_assert_1.assert(!shelvingState._timer);
    return callback(null, {
        statusCode: node_opcua_status_code_1.StatusCodes.Good
    });
}
function _clear_timer_if_any(shelvingState) {
    if (shelvingState._timer) {
        clearTimeout(shelvingState._timer);
        // xx console.log("_clear_timer_if_any shelvingState = ",shelvingState._timer,shelvingState.constructor.name);
        shelvingState._timer = null;
    }
}
exports._clear_timer_if_any = _clear_timer_if_any;
function _automatically_unshelve(shelvingState) {
    node_opcua_assert_1.assert(shelvingState._timer, "expecting timerId to be set");
    shelvingState._timer = null;
    if (doDebug) {
        debugLog("Automatically unshelving variable ", shelvingState.browseName.toString());
    }
    if (shelvingState.getCurrentState() === "Unshelved") {
        // just ignore !!!
        return;
        // throw new Error(StatusCodes.BadConditionNotShelved);
    }
    shelvingState.setState("Unshelved");
    shelvingState._unshelvedTime = new Date(); // now
    node_opcua_assert_1.assert(!shelvingState._timer);
}
function _start_timer_for_automatic_unshelve(shelvingState, duration) {
    if (duration < 10 || duration >= Math.pow(2, 31)) {
        throw new Error(" Invalid maxTimeShelved duration: " + duration + "  must be [10,2**31] ");
    }
    node_opcua_assert_1.assert(!shelvingState._timer);
    shelvingState._sheveldTime = new Date(); // now
    shelvingState._duration = duration;
    if (doDebug) {
        debugLog("shelvingState._duration", shelvingState._duration);
    }
    if (duration !== ua_alarm_condition_base_1.UAAlarmConditionBase.MaxDuration) {
        node_opcua_assert_1.assert(!shelvingState._timer);
        shelvingState._timer = setTimeout(_automatically_unshelve.bind(null, shelvingState), shelvingState._duration);
    }
}
// Spec 1.03:
// The TimedShelve Method sets the AlarmCondition to the TimedShelved state
// (parameters are defined in Table 38 and result codes are described in Table 39).
// Normally, the MethodId found in the Shelving child of the Condition instance and the NodeId of the Shelving object
// as the ObjectId are passed to the Call Service. However, some Servers do not expose Condition instances in the
// AddressSpace. Therefore all Servers shall also allow Clients to call the TimedShelve Method by specifying
// ConditionId as the ObjectId. The Method cannot be called with an ObjectId of the ShelvedStateMachineType Node.
//
// Signature:   TimedShelve([in] Duration ShelvingTime);
//
// ShelvingTime Specifies a fixed time for which the Alarm is to be shelved. The Server may refuse
//              the provided duration.
//              If a MaxTimeShelved Property exist on the Alarm than the Shelving time shall be less than or equal
//              to the value of this Property.
// StatusCode :
//               BadConditionAlreadyShelved The Alarm is already in TimedShelved state and the system does not allow
//                                           a reset of the shelved timer.
//               BadShelvingTimeOutOfRange
function _timedShelve_method(inputArguments, context, callback) {
    node_opcua_assert_1.assert(inputArguments.length === 1);
    const shelvingState = context.object;
    if (shelvingState.getCurrentState() !== "Unshelved") {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadConditionAlreadyShelved
        });
    }
    // checking duration ...
    const alarmNode = shelvingState.parent;
    // istanbul ignore next
    if (!(alarmNode instanceof ua_alarm_condition_base_1.UAAlarmConditionBase)) {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdInvalid
        });
    }
    const maxTimeShelved = alarmNode.getMaxTimeShelved();
    node_opcua_assert_1.assert(_.isFinite(maxTimeShelved));
    node_opcua_assert_1.assert(inputArguments[0].dataType === node_opcua_variant_1.DataType.Double); // Duration
    node_opcua_assert_1.assert(inputArguments[0] instanceof node_opcua_variant_1.Variant);
    // xx console.log("inputArguments",inputArguments[0].toString());
    const proposedDuration = inputArguments[0].value; // as double (milliseconds)
    if (proposedDuration > maxTimeShelved) {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadShelvingTimeOutOfRange
        });
    }
    if (proposedDuration < 0) {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadShelvingTimeOutOfRange
        });
    }
    _clear_timer_if_any(shelvingState);
    shelvingState.setState("TimedShelved");
    _start_timer_for_automatic_unshelve(shelvingState, proposedDuration);
    return callback(null, {
        statusCode: node_opcua_status_code_1.StatusCodes.Good
    });
}
// Spec 1.03:
// OneShotShelve Method
// The OneShotShelve Method sets the AlarmCondition to the OneShotShelved state. Normally, the MethodId found in the
// Shelving child of the Condition instance and the NodeId of the Shelving object as the ObjectId are passed to the
// Call Service. However, some Servers do not expose Condition instances in the AddressSpace. Therefore all Servers
// shall also allow Clients to call the OneShotShelve Method by specifying ConditionId as the ObjectId. The Method
// cannot be called with an ObjectId of the ShelvedStateMachineType Node
function _oneShotShelve_method(inputArguments, context, callback) {
    node_opcua_assert_1.assert(inputArguments.length === 0);
    const shelvingState = context.object;
    if (shelvingState.getCurrentState() === "OneShotShelved") {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadConditionAlreadyShelved
        });
    }
    // checking duration ...
    const alarmNode = shelvingState.parent;
    // istanbul ignore next
    if (!(alarmNode instanceof ua_alarm_condition_base_1.UAAlarmConditionBase)) {
        return callback(null, {
            statusCode: node_opcua_status_code_1.StatusCodes.BadNodeIdInvalid
        });
    }
    const maxTimeShelved = alarmNode.getMaxTimeShelved();
    node_opcua_assert_1.assert(_.isFinite(maxTimeShelved));
    node_opcua_assert_1.assert(maxTimeShelved !== ua_alarm_condition_base_1.UAAlarmConditionBase.MaxDuration);
    // set automatic unshelving timer
    _clear_timer_if_any(shelvingState);
    shelvingState.setState("OneShotShelved");
    _start_timer_for_automatic_unshelve(shelvingState, maxTimeShelved);
    return callback(null, {
        statusCode: node_opcua_status_code_1.StatusCodes.Good
    });
}
// from spec 1.03 :
// * UnshelveTime specifies the remaining time in milliseconds until the Alarm automatically
//   transitions into the Un-shelved state.
// * For the TimedShelved state this time is initialised with the ShelvingTime argument of the
//   TimedShelve Method call.
// * For the OneShotShelved state the UnshelveTime will be a constant set to the maximum Duration
//   except if a MaxTimeShelved Property is provided.
function _unShelveTimeFunc(shelvingState) {
    if (shelvingState.getCurrentState() === "Unshelved") {
        return new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.StatusCode,
            value: node_opcua_status_code_1.StatusCodes.BadConditionNotShelved
        });
    }
    if (!shelvingState._sheveldTime) {
        return new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.StatusCode,
            value: node_opcua_status_code_1.StatusCodes.BadConditionNotShelved
        });
    }
    if (shelvingState.getCurrentState() === "OneShotShelved" &&
        shelvingState._duration === ua_alarm_condition_base_1.UAAlarmConditionBase.MaxDuration) {
        return new node_opcua_variant_1.Variant({
            dataType: node_opcua_variant_1.DataType.Double,
            value: ua_alarm_condition_base_1.UAAlarmConditionBase.MaxDuration
        });
    }
    const now = new Date();
    let timeToAutomaticUnshelvedState = shelvingState._duration - (now.getTime() - shelvingState._sheveldTime.getTime());
    // timeToAutomaticUnshelvedState should always be greater than (or equal) zero
    timeToAutomaticUnshelvedState = Math.max(timeToAutomaticUnshelvedState, 0);
    return new node_opcua_variant_1.Variant({
        dataType: node_opcua_variant_1.DataType.Double,
        value: timeToAutomaticUnshelvedState
    });
}
//# sourceMappingURL=shelving_state_machine.js.map