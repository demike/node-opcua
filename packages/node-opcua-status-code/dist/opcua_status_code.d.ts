/**
 * @module node-opcua-status-code
 */
import { BinaryStream, OutputBinaryStream } from "node-opcua-binary-stream";
/**
 * StatusCode Special bits
 */
export declare const extraStatusCodeBits: any;
/**
 * a particular StatusCode , with it's value , name and description
 */
export declare abstract class StatusCode {
    /**
     *  returns a status code that can be modified
     */
    static makeStatusCode(statusCode: StatusCode | string, optionalBits: string | number): StatusCode;
    /**
     * returns status code value in numerical form, including extra bits
     */
    abstract readonly value: number;
    /***
     * status code by name, (including  extra bits in textual forms)
     */
    abstract readonly name: string;
    /**
     * return the long description of the status code
     */
    abstract readonly description: string;
    readonly valueOf: number;
    toString(): string;
    checkBit(mask: number): boolean;
    /**returns true if the overflow bit is set */
    readonly hasOverflowBit: boolean;
    /**returns true if the semanticChange bit is set */
    readonly hasSemanticChangedBit: boolean;
    /**returns true if the structureChange bit is set */
    readonly hasStructureChangedBit: boolean;
    isNot(other: StatusCode): boolean;
    equals(other: StatusCode): boolean;
    toJSON(): any;
    toJSONFull(): any;
}
export declare class ConstantStatusCode extends StatusCode {
    private readonly _value;
    private readonly _description;
    private readonly _name;
    /**
     *
     * @param options
     * @param options
     * @param options.value
     * @param options.description
     * @param options.name
     *
     */
    constructor(options: {
        value: number;
        description: string;
        name: string;
    });
    readonly value: number;
    readonly name: string;
    readonly description: string;
}
export declare function encodeStatusCode(statusCode: StatusCode | ConstantStatusCode, stream: OutputBinaryStream): void;
/**
 * returns the StatusCode corresponding to the provided value, if any
 * @note: if code is not known , then StatusCodes.Bad will be returned
 * @param code
 */
export declare function getStatusCodeFromCode(code: number): any;
export declare function decodeStatusCode(stream: BinaryStream): any;
export declare class ModifiableStatusCode extends StatusCode {
    private readonly _base;
    private _extraBits;
    constructor(options: {
        _base: StatusCode;
    });
    readonly value: number;
    readonly name: string;
    readonly description: string;
    set(bit: string | number): void;
    unset(bit: string | number): void;
    private _getExtraName;
}
export { StatusCodes } from "./_generated_status_codes";
export declare function coerceStatusCode(statusCode: any): StatusCode;
