"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/**
 * @module node-opcua-utils
 */
const fs_1 = require("fs");
const os = require("os");
class LineFile {
    constructor() {
        this._line = [];
        this.write("// --------- This code has been automatically generated !!! " + new Date().toISOString());
        this.write("/**");
        this.write(" * @module node-opcua-types");
        this.write(" */");
    }
    write(...arg) {
        let str = "";
        // tslint:disable:prefer-for-of
        for (let i = 0; i < arguments.length; i++) {
            str += arguments[i];
        }
        this._line.push(str);
    }
    toString() {
        return this._line.join(os.EOL);
    }
    save(filename) {
        fs_1.writeFileSync(filename, this.toString(), "ascii");
    }
    saveFormat(filename, formatter) {
        const code = formatter(this.toString());
        fs_1.writeFileSync(filename, code, "ascii");
    }
}
exports.LineFile = LineFile;
//# sourceMappingURL=linefile.js.map