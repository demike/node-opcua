export declare class ObjectRegistry {
    static doDebug: boolean;
    static registries: any;
    private _objectType;
    private readonly _cache;
    constructor(objectType?: any);
    getClassName(): string;
    register(obj: any): void;
    unregister(obj: any): void;
    count(): number;
    toString(): string;
}
