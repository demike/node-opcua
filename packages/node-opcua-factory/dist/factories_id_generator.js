"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-factory
 */
const _FIRST_INTERNAL_ID = 0xFFFE0000;
let _nextAvailableId = _FIRST_INTERNAL_ID;
function generate_new_id() {
    _nextAvailableId += 1;
    return _nextAvailableId;
}
exports.generate_new_id = generate_new_id;
function next_available_id() {
    return -1;
}
exports.next_available_id = next_available_id;
function is_internal_id(value) {
    return value >= _FIRST_INTERNAL_ID;
}
exports.is_internal_id = is_internal_id;
//# sourceMappingURL=factories_id_generator.js.map