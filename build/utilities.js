"use strict";
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
// https://github.com/graphql/graphql-js/blob/master/src/utilities/schemaPrinter.js
function typeFilter(type) {
    return !graphql_1.isSpecifiedScalarType(type) && !graphql_1.isIntrospectionType(type);
}
function toTS(typeMap, graphqlType, objectEnd) {
    if (objectEnd === void 0) { objectEnd = ''; }
    var ast = graphql_1.parseType(graphqlType.toString());
    return toTSfromAST(typeMap, ast, objectEnd);
}
function toTSfromAST(typeMap, typeNode, objectEnd) {
    if (objectEnd === void 0) { objectEnd = ''; }
    var tsType = '';
    switch (typeNode.kind) {
        case 'NonNullType':
            tsType = toTSfromAST(typeMap, typeNode.type, objectEnd);
            break;
        case 'ListType':
            tsType = toTSfromAST(typeMap, typeNode.type, objectEnd);
            tsType = tsType + "[]";
            break;
        case 'NamedType':
            switch (typeNode.name.value) {
                case 'ID':
                case 'String':
                    tsType = 'string';
                    break;
                case 'Float':
                case 'Int':
                    tsType = 'number';
                    break;
                case 'Boolean':
                    tsType = 'boolean';
                    break;
                default:
                    var type = typeMap[typeNode.name.value];
                    if (graphql_1.isEnumType(type)) {
                        tsType = "" + typeNode.name.value;
                    }
                    else {
                        tsType = "" + typeNode.name.value + objectEnd;
                    }
            }
            break;
        default:
            // console.log(typeNode);
            break;
    }
    return tsType;
}
function printDescription(type, indent) {
    if (indent === void 0) { indent = ''; }
    if (type.description) {
        return type.description.split("\n").map(function (line) { return indent + "// " + line; }).join("\n") + "\n";
    }
    else {
        return '';
    }
}
// https://www.typescriptlang.org/docs/handbook/enums.html
function printEnum(type) {
    var output = printDescription(type);
    output += "export enum " + type.name + " {\n";
    type
        .getValues()
        .forEach(function (value) {
        // console.log(value);
        output += printDescription(value, '  ');
        output += "  " + value.name + " = \"" + value.value + "\",\n";
    });
    output += "}\n\n";
    return output;
}
function printInterfaces(type) {
    if (!(graphql_1.isObjectType(type))) {
        return '';
    }
    // @ts-ignore
    var interfaces = type.getInterfaces();
    return interfaces.length
        ? 'extends ' + interfaces.map(function (i) { return i.name; }).join(', ') + ' '
        : '';
}
function printTypeScriptDefinitions(schema) {
    var output = '';
    var typeMap = schema.getTypeMap();
    var types = Object.values(typeMap)
        .sort(function (type1, type2) { return type1.name.localeCompare(type2.name); })
        .filter(typeFilter);
    var interfaces = new Map();
    types.forEach(function (type) {
        var inputObjectType = graphql_1.isInputObjectType(type);
        if (graphql_1.isEnumType(type)) {
            output += printEnum(type);
        }
        if (!(graphql_1.isObjectType(type) ||
            graphql_1.isInputObjectType(type))) {
            return;
        }
        if (type.name === 'Mutation') {
            return;
        }
        if (graphql_1.isObjectType(type)) {
            type.getInterfaces().forEach(function (iface) {
                var _a;
                var array = (_a = interfaces.get(iface.name), (_a !== null && _a !== void 0 ? _a : []));
                array.push(type.name);
                interfaces.set(iface.name, array);
            });
        }
        output += printDescription(type);
        output += "export interface " + type.name + " " + printInterfaces(type) + "{\n";
        if (graphql_1.isInterfaceType(type)) {
            output += "  readonly __typename: string,\n";
        }
        else if (graphql_1.isObjectType(type)) {
            output += "  readonly __typename: '" + type.name + "',\n";
        }
        Object.values(type.getFields()).forEach(function (field) {
            if (inputObjectType && field.name === 'clientMutationId') {
                return;
            }
            var type = toTS(typeMap, field.type);
            output += printDescription(field, '  ');
            output += "  readonly " + field.name + ": " + type + ",\n";
        });
        output += "}\n\n";
    });
    Array.from(interfaces).forEach(function (_a) {
        var _b = __read(_a, 2), key = _b[0], value = _b[1];
        output += "export type " + key + " = " + value.join(' | ') + ";\n";
    });
    return output;
}
exports.printTypeScriptDefinitions = printTypeScriptDefinitions;
function printTypeScriptArgs(schema) {
    var output = '';
    var typeMap = schema.getTypeMap();
    var types = Object.values(typeMap)
        .sort(function (type1, type2) { return type1.name.localeCompare(type2.name); })
        .filter(typeFilter);
    types.forEach(function (type) {
        if (graphql_1.isEnumType(type)) {
            output += printEnum(type);
        }
        if (graphql_1.isInputObjectType(type)) {
            output += printDescription(type);
            output += "export interface " + type.name + "_Args {\n";
            Object.values(type.getFields()).forEach(function (field) {
                var type = toTS(typeMap, field.type, '_Args');
                output += printDescription(field, '  ');
                output += "  readonly " + field.name + ": " + type + ",\n";
            });
            output += "}\n\n";
        }
        if (graphql_1.isObjectType(type)) {
            var fields = Object.values(type.getFields());
            if (type.name.endsWith("Payload")) {
                return;
                output += printDescription(output);
                output += "export interface " + type.name + " {\n";
                fields.forEach(function (field) {
                    var type = toTS(typeMap, field.type);
                    output += printDescription(field, '  ');
                    output += "  readonly " + field.name + ": " + type + ",\n";
                });
                output += "}\n\n";
            }
            else {
                fields.forEach(function (field) {
                    if (!field.args.length) {
                        return;
                    }
                    output += printDescription(field);
                    output += "export interface " + type.name + "_" + field.name + "_Args {\n";
                    field.args.forEach(function (arg) {
                        var type = toTS(typeMap, arg.type, '_Args');
                        output += printDescription(arg, '  ');
                        output += "  readonly " + arg.name + ": " + type + ",\n";
                    });
                    output += "}\n\n";
                });
            }
        }
    });
    return output;
}
exports.printTypeScriptArgs = printTypeScriptArgs;
//# sourceMappingURL=utilities.js.map