/**
 * @module node-opcua-enum
 *
 */
/**
 * Represents an Item of an Enum.
 *
 * @class Enum
 */
export declare class EnumItem {
    key: string;
    value: number;
    /**
     *
     * @param key the enum key
     * @param value the enum value
     */
    constructor(key: string, value: number);
    /**
     * Checks if the EnumItem is the same as the passing object.
     * @method is
     * @param  {EnumItem | String | Number} item The object to check with.
     * @return {Boolean}                          The check result.
     */
    is(item: any): boolean;
    /**
     * Checks if the flagged EnumItem has the passing object.
     * @method has
     * @param  {EnumItem | String |Number} value The object to check with.
     * @return {Boolean}                            The check result.
     */
    has(value: string | number | EnumItem): boolean;
    /**
     * Returns String representation of this EnumItem.
     * @method toString
     * @return {String} String representation of this EnumItem.
     */
    toString(): string;
    /**
     * Returns JSON object representation of this EnumItem.
     * @method toJSON
     * @return {String} JSON object representation of this EnumItem.
     */
    toJSON(): any;
    /**
     * Returns the value to compare with.
     * @method valueOf
     * @return {String} The value to compare with.
     */
    valueOf(): number;
}
/**
 * @class Enum
 * @constructor
 * Represents an Enum with enum items.
 * @param {Array || Object}  map     This are the enum items.
 */
export declare class Enum {
    private readonly enumItems;
    private readonly _isFlaggable;
    constructor(map: any);
    /**
     * Returns the appropriate EnumItem.
     * @method get
     * @param  key The object to get with.
     * @return the get result.
     */
    get(key: EnumItem | string | number): (EnumItem | null);
    getDefaultValue(): EnumItem;
    toString(): string;
    private _getByString;
    private _getByNum;
}
