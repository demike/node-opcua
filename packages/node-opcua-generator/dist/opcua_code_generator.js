"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* istanbul ignore file */
/**
 * @module node-opcua-generator
 */
// tslint:disable:no-console
const generator_1 = require("./generator");
console.log(process.argv);
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const className = "LocalizedText";
        generator_1.generateTypeScriptCodeFromSchema(className);
    });
}
main()
    .then()
    .catch();
//# sourceMappingURL=opcua_code_generator.js.map