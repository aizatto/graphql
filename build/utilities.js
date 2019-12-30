"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var graphql_1 = require("graphql");
// https://github.com/graphql/graphql-js/blob/master/src/utilities/schemaPrinter.js
function typeFilter(type) {
    return !graphql_1.isSpecifiedScalarType(type) && !graphql_1.isIntrospectionType(type);
}
function toTS(graphqlType) {
    var ast = graphql_1.parseType(graphqlType.toString());
    return toTSfromAST(ast);
}
function toTSfromAST(typeNode) {
    var tsType = '';
    switch (typeNode.kind) {
        case 'NonNullType':
            tsType = toTSfromAST(typeNode.type);
            break;
        case 'ListType':
            tsType = toTSfromAST(typeNode.type);
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
                    tsType = typeNode.name.value;
                    break;
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
    output += "enum " + type.name + " {\n";
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
    var output = "// Auto-generated on " + new Date().toISOString() + "\n";
    var typeMap = schema.getTypeMap();
    var types = Object.values(typeMap)
        .sort(function (type1, type2) { return type1.name.localeCompare(type2.name); })
        .filter(typeFilter);
    types.forEach(function (type) {
        var inputObjectType = graphql_1.isInputObjectType(type);
        var outputType = graphql_1.isObjectType(type);
        if (graphql_1.isEnumType(type)) {
            output += printEnum(type);
        }
        if (!(graphql_1.isInterfaceType(type) ||
            graphql_1.isObjectType(type) ||
            graphql_1.isInputObjectType(type))) {
            return;
        }
        if (type.name === 'Mutation') {
            return;
        }
        output += printDescription(type);
        output += "export interface " + type.name + " " + printInterfaces(type) + "{\n";
        if (outputType) {
            output += "  readonly __typename: '" + type.name + "',\n";
        }
        Object.values(type.getFields()).forEach(function (field) {
            if (inputObjectType && field.name === 'clientMutationId') {
                return;
            }
            var type = toTS(field.type);
            output += printDescription(field, '  ');
            output += "  readonly " + field.name + ": " + type + ",\n";
        });
        output += "}\n\n";
    });
    return output;
}
exports.printTypeScriptDefinitions = printTypeScriptDefinitions;
//# sourceMappingURL=utilities.js.map