export declare enum AccessLevelFlag {
    CurrentRead = 1,
    CurrentWrite = 2,
    HistoryRead = 4,
    HistoryWrite = 8,
    SemanticChange = 16,
    StatusWrite = 32,
    TimestampWrite = 64,
    NONE = 2048,
    None = 2048
}
export declare function convertAccessLevelFlagToByte(accessLevel: AccessLevelFlag): number;
export declare function makeAccessLevelFlag(str: string | number | null): AccessLevelFlag;
export declare const coerceAccessLevelFlag: typeof makeAccessLevelFlag;
export declare function randomAccessLevel(): AccessLevelFlag;
export declare function accessLevelFlagToString(accessLevelFlag: AccessLevelFlag): string;
