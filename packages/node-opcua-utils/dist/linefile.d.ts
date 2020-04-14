export declare class LineFile {
    private _line;
    constructor();
    write(...arg: string[]): void;
    toString(): string;
    save(filename: string): void;
    saveFormat(filename: string, formatter: (code: string) => string): void;
}
