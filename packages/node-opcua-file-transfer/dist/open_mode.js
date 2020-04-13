"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-file-transfer-server
 */
var OpenFileModeMask;
(function (OpenFileModeMask) {
    OpenFileModeMask[OpenFileModeMask["ReadBit"] = 1] = "ReadBit";
    OpenFileModeMask[OpenFileModeMask["WriteBit"] = 2] = "WriteBit";
    OpenFileModeMask[OpenFileModeMask["EraseExistingBit"] = 4] = "EraseExistingBit";
    OpenFileModeMask[OpenFileModeMask["AppendBit"] = 8] = "AppendBit";
})(OpenFileModeMask = exports.OpenFileModeMask || (exports.OpenFileModeMask = {}));
var OpenFileMode;
(function (OpenFileMode) {
    /**
     *       Read         bit 0   The file is opened for reading. If this bit is not
     *                            set the Read Method cannot be executed.
     */
    OpenFileMode[OpenFileMode["Read"] = 1] = "Read";
    /**
     *      Write         bit 1   The file is opened for writing. If this bit is not
     *                            set the Write Method cannot be executed.
     *
     */
    OpenFileMode[OpenFileMode["Write"] = 2] = "Write";
    OpenFileMode[OpenFileMode["ReadWrite"] = 3] = "ReadWrite";
    /**
     *
     *  WriteEraseExisting
     *      EraseExisting 2   This bit can only be set if the file is opened for writing
     *                        (Write bit is set). The existing content of the file is
     *                        erased and an empty file is provided.
     */
    OpenFileMode[OpenFileMode["WriteEraseExisting"] = 6] = "WriteEraseExisting";
    OpenFileMode[OpenFileMode["ReadWriteEraseExisting"] = 7] = "ReadWriteEraseExisting";
    /**
     *      Append        3   When the Append bit is set the file is opened at end
     *                        of the file, otherwise at begin of the file.
     *                        The SetPosition Method can be used to change the position.
     */
    OpenFileMode[OpenFileMode["WriteAppend"] = 10] = "WriteAppend";
    OpenFileMode[OpenFileMode["ReadWriteAppend"] = 11] = "ReadWriteAppend";
})(OpenFileMode = exports.OpenFileMode || (exports.OpenFileMode = {}));
//# sourceMappingURL=open_mode.js.map