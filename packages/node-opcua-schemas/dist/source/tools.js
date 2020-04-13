"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const node_opcua_factory_1 = require("node-opcua-factory");
function removeNamespacePart(str) {
    if (!str) {
        return str;
    }
    const data = str.split(":");
    return data.length > 1 ? data[1] : str;
}
function getNamespacePart(str) {
    return str.split(":")[0];
}
function adjustFieldTypeName(fieldTypeName) {
    // special cases
    if (fieldTypeName === "String" || fieldTypeName === "CharArray") {
        fieldTypeName = "UAString";
    }
    if (fieldTypeName === "Boolean") {
        fieldTypeName = "UABoolean";
    }
    return fieldTypeName;
}
function getOrCreateStructuredTypeSchema(name, typeDictionary) {
    let structuredTypeSchema = typeDictionary.structuredTypes[name];
    if (structuredTypeSchema) {
        return structuredTypeSchema;
    }
    // construct it !
    const structuredType = typeDictionary.structuredTypesRaw[name];
    if (!structuredType) {
        throw new Error("Cannot find structuredType" + name);
    }
    structuredType.baseType = removeNamespacePart(structuredType.baseType);
    structuredType.baseType = structuredType.baseType ? structuredType.baseType : "BaseUAObject";
    for (const field of structuredType.fields) {
        const fieldType = field.fieldType;
        if (!field.schema) {
            const prefix = getNamespacePart(fieldType);
            const fieldTypeName = adjustFieldTypeName(removeNamespacePart(fieldType));
            switch (prefix) {
                case "tns":
                    field.fieldType = fieldTypeName;
                    const enumeratedType = typeDictionary.enumeratedTypes[fieldTypeName];
                    if (enumeratedType) {
                        field.category = node_opcua_factory_1.FieldCategory.enumeration;
                        field.schema = enumeratedType;
                    }
                    else {
                        // must be a structure then ....
                        field.category = node_opcua_factory_1.FieldCategory.complex;
                        field.schema = getOrCreateStructuredTypeSchema(fieldTypeName, typeDictionary);
                        if (!field.schema) {
                            // tslint:disable-next-line:no-console
                            console.log("cannot find schema for ", fieldTypeName);
                        }
                    }
                    break;
                case "ua":
                    field.fieldType = fieldTypeName;
                    if (node_opcua_factory_1.hasBuiltInType(fieldTypeName)) {
                        field.category = node_opcua_factory_1.FieldCategory.basic;
                        field.schema = node_opcua_factory_1.getBuildInType(fieldTypeName);
                    }
                    else if (node_opcua_factory_1.hasStructuredType(fieldTypeName)) {
                        field.category = node_opcua_factory_1.FieldCategory.complex;
                        field.schema = node_opcua_factory_1.getStructuredTypeSchema(fieldTypeName);
                    }
                    else {
                        field.category = node_opcua_factory_1.FieldCategory.basic;
                        // try in this
                        field.schema = getOrCreateStructuredTypeSchema(fieldTypeName, typeDictionary);
                        if (!field.schema) {
                            // tslint:disable-next-line:no-console
                            console.log("What should I do ??", fieldTypeName, " ", node_opcua_factory_1.hasStructuredType(fieldTypeName));
                        }
                        else {
                            if (node_opcua_factory_1.hasBuiltInType(fieldTypeName)) {
                                field.category = node_opcua_factory_1.FieldCategory.basic;
                            }
                            else {
                                field.category = node_opcua_factory_1.FieldCategory.complex;
                            }
                        }
                    }
                    break;
                case "opc":
                    if ((fieldTypeName === "UAString" || fieldTypeName === "String") && field.name === "IndexRange") {
                        field.fieldType = "NumericRange";
                        // xx console.log(" NumericRange detected here !");
                    }
                    else {
                        field.fieldType = fieldTypeName;
                    }
                    if (!node_opcua_factory_1.hasBuiltInType(fieldTypeName)) {
                        throw new Error("Unknown basic type " + fieldTypeName);
                    }
                    field.category = node_opcua_factory_1.FieldCategory.basic;
                    break;
            }
        }
    }
    structuredTypeSchema = node_opcua_factory_1.buildStructuredType(structuredType);
    typeDictionary.structuredTypes[name] = structuredTypeSchema;
    return structuredTypeSchema;
}
exports.getOrCreateStructuredTypeSchema = getOrCreateStructuredTypeSchema;
function prepareStructureType(structuredType, typeDictionary) {
    const key = structuredType.name;
    if (typeDictionary.structuredTypes[key]) {
        return typeDictionary.structuredTypes[key]; // already done
    }
    typeDictionary.structuredTypes[key] = getOrCreateStructuredTypeSchema(key, typeDictionary);
    return typeDictionary.structuredTypes[key];
}
exports.prepareStructureType = prepareStructureType;
function prepareEnumeratedType(enumeratedType, typeDictionary) {
    const key = enumeratedType.name;
    const e = new node_opcua_factory_1.EnumerationDefinitionSchema({
        enumValues: enumeratedType.enumeratedValues,
        name: key
    });
    typeDictionary.enumeratedTypes[key] = e;
}
exports.prepareEnumeratedType = prepareEnumeratedType;
//# sourceMappingURL=tools.js.map