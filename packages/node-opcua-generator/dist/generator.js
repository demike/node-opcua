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
// tslint:disable:max-line-length
// tslint:disable:no-console
const fs = require("fs");
const path = require("path");
const ts = require("typescript");
const util_1 = require("util");
const node_opcua_assert_1 = require("node-opcua-assert");
const node_opcua_debug_1 = require("node-opcua-debug");
const factory_code_generator_1 = require("./factory_code_generator");
const debugLog = node_opcua_debug_1.make_debugLog(__filename);
const doDebug = node_opcua_debug_1.checkDebugFlag(__filename);
const fileExists = util_1.promisify(fs.exists);
const mkdir = util_1.promisify(fs.mkdir);
/**
 * @module opcua.miscellaneous
 * @class Factory
 * @static
 */
function compileTscriptCode(typescriptFilename) {
    const content = fs.readFileSync(typescriptFilename, "ascii");
    const compilerOptions = {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2016,
        skipLibCheck: true,
        declaration: true,
        sourceMap: true,
        strict: true,
        noImplicitAny: true,
        noImplicitReturns: true
    };
    const res1 = ts.transpileModule(content, { compilerOptions, moduleName: "myModule2" });
    const javascriptFilename = typescriptFilename.replace(/\.ts$/, ".js");
    const sourcemapFilename = typescriptFilename.replace(/\.ts$/, ".js.map");
    fs.writeFileSync(javascriptFilename, res1.outputText, "ascii");
    fs.writeFileSync(sourcemapFilename, res1.sourceMapText, "ascii");
    return res1.outputText;
}
exports.verbose = false;
function get_caller_source_filename() {
    // let's find source code where schema file is described
    // to do make change this
    // the line has the following shape:
    //      'at blah (/home/toto/myfile.js:53:34)'
    const err = new Error("");
    const re = /.*\((.*):[0-9]*:[0-9]*\)/g;
    if (!err.stack) {
        return "";
    }
    console.log(err.stack.split("\n"));
    const ma = err.stack.split("\n");
    let m = re.exec(ma[8]);
    if (!m) {
        m = re.exec(ma[4]);
    }
    if (!m) {
        return "../";
        // throw new Error("Invalid: cannot find caller_source_filename : " + err.stack + "\n =============");
    }
    const schemaFile = m[1];
    return schemaFile;
}
function generateCode(schemaName, localSchemaFile, generatedCodeFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        const schemaTypescriptFile = schemaName + "_Schema.ts";
        const currentFolder = process.cwd();
        //
        const localSchemaFileExists = yield fileExists(localSchemaFile);
        if (!localSchemaFileExists) {
            throw new Error(`Cannot find source file for schema ${schemaTypescriptFile}`);
        }
        if (!generatedCodeFolder) {
            generatedCodeFolder = path.join(currentFolder, "_generated_");
        }
        const generatedCodeFolderExists = yield fileExists(generatedCodeFolder);
        if (!generatedCodeFolderExists) {
            yield mkdir(generatedCodeFolder);
        }
        const generatedTypescriptSource = path.join(generatedCodeFolder, "_" + schemaName + ".ts");
        const generatedSourceExists = yield fileExists(generatedTypescriptSource);
        let schemaFileIsNewer = false;
        let codeGeneratorIsNewer = true;
        if (generatedSourceExists) {
            const generatedSourceMtime = new Date(fs.statSync(generatedTypescriptSource).mtime).getTime();
            const schemaFileMtime = new Date(fs.statSync(localSchemaFile).mtime).getTime();
            schemaFileIsNewer = (generatedSourceMtime <= schemaFileMtime);
            let codeGeneratorScript = path.join(__dirname, "factory_code_generator.ts");
            if (!fs.existsSync(codeGeneratorScript)) {
                codeGeneratorScript = path.join(__dirname, "factory_code_generator.js");
            }
            node_opcua_assert_1.assert(fs.existsSync(codeGeneratorScript), "cannot get code factory_code_generator" + codeGeneratorScript);
            const codeGeneratorScriptMtime = new Date(fs.statSync(codeGeneratorScript).mtime).getTime();
            codeGeneratorIsNewer = (generatedSourceMtime <= codeGeneratorScriptMtime);
        }
        const generatedSourceIsOutdated = (!generatedSourceExists || codeGeneratorIsNewer || schemaFileIsNewer);
        if (generatedSourceIsOutdated) {
            const module = yield Promise.resolve().then(() => require(localSchemaFile));
            const schema = module[schemaName + "_Schema"];
            if (!schema) {
                throw new Error(`module must export a Schema with name ${schemaName}_Schema  in ${generatedTypescriptSource}`);
            }
            debugLog(" generated_source_is_outdated ", schemaName, " to ", generatedTypescriptSource);
            if (exports.verbose) {
                console.log(" generating ", schemaName, " in ", generatedTypescriptSource);
            }
            const localSchemaFile1 = path.join("../schemas", schemaName + "_schema");
            factory_code_generator_1.produce_tscript_code(schema, localSchemaFile1, generatedTypescriptSource);
        }
    });
}
exports.generateCode = generateCode;
function generateTypeScriptCodeFromSchema(schemaName) {
    return __awaiter(this, void 0, void 0, function* () {
        const currentFolder = process.cwd();
        const schemafilename = path.join(currentFolder, "schemas", schemaName + "_schema.ts");
        const generatedCodeFolder = path.join(process.cwd(), "_generated_");
        yield generateCode(schemaName, schemafilename, generatedCodeFolder);
    });
}
exports.generateTypeScriptCodeFromSchema = generateTypeScriptCodeFromSchema;
function registerObject(schema, generateCodeFolder) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!schema.split) {
            console.log("error !", schema);
            // xx process.exit(1);
        }
        // we expect <schema>|<hint>
        const hintSchema = schema.split("|");
        if (hintSchema.length === 1) {
            // no hint provided
            const callerFolder = get_caller_source_filename();
            const defaultHint = path.join(path.dirname(callerFolder), "schemas");
            hintSchema.unshift(defaultHint);
            generateCodeFolder = generateCodeFolder
                ? generateCodeFolder
                : path.join(path.dirname(callerFolder), "_generated_");
        }
        const folderHint = hintSchema[0];
        schema = hintSchema[1];
        const schemaName = schema + "_Schema";
        const schemaFile = path.join(folderHint, schema + "_schema.ts");
        const module = yield Promise.resolve().then(() => require(schemaFile));
        if (!module) {
            throw new Error("cannot find " + schemaFile);
        }
        const schemaObj = module[schemaName];
        yield generateCode(schemaName, schemaFile, generateCodeFolder);
        return null;
    });
}
exports.registerObject = registerObject;
function unregisterObject(schema, folder) {
    const generateTypeScriptSource = factory_code_generator_1.get_class_tscript_filename(schema.name, folder);
    if (fs.existsSync(generateTypeScriptSource)) {
        fs.unlinkSync(generateTypeScriptSource);
        node_opcua_assert_1.assert(!fs.existsSync(generateTypeScriptSource));
    }
}
exports.unregisterObject = unregisterObject;
//# sourceMappingURL=generator.js.map