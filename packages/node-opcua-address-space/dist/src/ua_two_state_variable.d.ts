import { BaseNode as BaseNodePublic, UATwoStateVariable as UATwoStateVariablePublic, UAVariable as UAVariablePublic } from "../source";
import { Reference } from "./reference";
import { UAVariable } from "./ua_variable";
export declare function _install_TwoStateVariable_machinery(node: UATwoStateVariablePublic, options: any): UATwoStateVariable;
export interface UATwoStateVariable {
    readonly falseState?: UAVariablePublic;
    readonly trueState?: UAVariablePublic;
    readonly id: UAVariablePublic;
    readonly effectiveTransitionTime?: UAVariablePublic;
    readonly transitionTime?: UAVariablePublic;
    readonly effectiveDisplayName?: UAVariablePublic;
}
/***
 * @class UATwoStateVariable
 * @constructor
 * @extends UAVariable
 */
export declare class UATwoStateVariable extends UAVariable implements UATwoStateVariablePublic {
    _trueState?: string;
    _falseState?: string;
    constructor(opts: any);
    readonly isFalseSubStateOf: BaseNodePublic | null;
    readonly isTrueSubStateOf: BaseNodePublic | null;
    initialize(options: any): void;
    /**
     * @method setValue
     * @param boolValue {Boolean}
     */
    setValue(boolValue: boolean): void;
    /**
     * @method getValue
     * @return {Boolean}
     */
    getValue(): boolean;
    /**
     * @method getValueAsString
     * @return {string}
     */
    getValueAsString(): string;
    protected _add_backward_reference(reference: Reference): void;
}
