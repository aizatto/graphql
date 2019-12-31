import { TypeNode, GraphQLNamedType, isSpecifiedScalarType, isIntrospectionType, isObjectType, GraphQLOutputType, parseType, isInterfaceType, isEnumType, isInputObjectType, GraphQLEnumType, GraphQLSchema, GraphQLInputType } from 'graphql';
import { TypeMap } from 'graphql/type/schema';

// https://github.com/graphql/graphql-js/blob/master/src/utilities/schemaPrinter.js

function typeFilter(type: GraphQLNamedType): boolean {
  return !isSpecifiedScalarType(type) && !isIntrospectionType(type);
}

function toTS(typeMap: TypeMap, graphqlType: GraphQLInputType | GraphQLOutputType, objectEnd = ''): string {
  const ast = parseType(graphqlType.toString());
  return toTSfromAST(typeMap, ast, objectEnd);
}

function toTSfromAST(typeMap: TypeMap, typeNode: TypeNode, objectEnd = ''): string {
  let tsType = '';
  switch (typeNode.kind) {
    case 'NonNullType':
      tsType = toTSfromAST(typeMap, typeNode.type, objectEnd);
      break;

    case 'ListType':
      tsType = toTSfromAST(typeMap, typeNode.type, objectEnd);
      tsType = `${tsType}[]`;
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
          const type = typeMap[typeNode.name.value];
          if (isEnumType(type)) {
            tsType = `${typeNode.name.value}`;
          } else {
            tsType = `${typeNode.name.value}${objectEnd}`;
          }
      }
      break;

    default:
      // console.log(typeNode);
      break;
  }

  return tsType;
}

function printDescription(type, indent = ''): string {
  if (type.description) {
    return type.description.split("\n").map(line => `${indent}// ${line}`).join("\n") + "\n";
  } else {
    return '';
  }
}

// https://www.typescriptlang.org/docs/handbook/enums.html
function printEnum(type: GraphQLEnumType): string {
  let output = printDescription(type);
  output += `export enum ${type.name} {\n`
  type
    .getValues()
    .forEach((value) => {
      // console.log(value);
      output += printDescription(value, '  ');
      output += `  ${value.name} = "${value.value}",\n`;
    });
  output += `}\n\n`
  return output;

}

function printInterfaces(type: GraphQLNamedType): string {
  if (!(isObjectType(type))) {
    return '';
  }
  // @ts-ignore
  const interfaces = type.getInterfaces();
  return interfaces.length
    ? 'extends ' + interfaces.map(i => i.name).join(', ') + ' '
    : '';
}

export function printTypeScriptDefinitions(schema: GraphQLSchema): string {
  let output = '';
  const typeMap = schema.getTypeMap();
  const types = Object.values(typeMap)
    .sort((type1, type2) => type1.name.localeCompare(type2.name))
    .filter(typeFilter);

  types.forEach(type => {
    const inputObjectType = isInputObjectType(type);

    if (isEnumType(type)) {
      output += printEnum(type);
    }

    if (!(isInterfaceType(type) ||
          isObjectType(type)||
          isInputObjectType(type))) {
      return;
    }

    if (type.name === 'Mutation') {
      return;
    }

    output += printDescription(type);
    output += `export interface ${type.name} ${printInterfaces(type)}{\n`;
    if (isInterfaceType(type)) {
      output += `  readonly __typename: string,\n`;
    } else if (isObjectType(type)) {
      output += `  readonly __typename: '${type.name}',\n`;
    }

    Object.values(type.getFields()).forEach((field) => {
      if (inputObjectType && field.name === 'clientMutationId') {
        return;
      }

      const type = toTS(typeMap, field.type);
      output += printDescription(field, '  ');
      output += `  readonly ${field.name}: ${type},\n`;
    });

    output += `}\n\n`;
  });

  return output;
}

export function printTypeScriptArgs(schema: GraphQLSchema): string {
  let output = '';
  const typeMap = schema.getTypeMap();
  const types = Object.values(typeMap)
    .sort((type1, type2) => type1.name.localeCompare(type2.name))
    .filter(typeFilter);

  types.forEach(type => {
    if (isEnumType(type)) {
      output += printEnum(type);
    }

    if (isInputObjectType(type)) {
      output += printDescription(type);
      output += `export interface ${type.name}_Args {\n`;

      Object.values(type.getFields()).forEach((field) => {
        const type = toTS(typeMap, field.type, '_Args');
        output += printDescription(field, '  ');
        output += `  readonly ${field.name}: ${type},\n`;
      });
      output += `}\n\n`;
    }

    if (isObjectType(type)) {
      const fields = Object.values(type.getFields());

      if (type.name.endsWith("Payload")) {
        return;
        output += printDescription(output);
        output += `export interface ${type.name} {\n`;

        fields.forEach((field) => {
          const type = toTS(typeMap, field.type);
          output += printDescription(field, '  ');
          output += `  readonly ${field.name}: ${type},\n`;
        });

        output += `}\n\n`;
      } else {
        fields.forEach((field) => {
          if (!field.args.length) {
            return;
          }

          output += printDescription(field);
          output += `export interface ${type.name}_${field.name}_Args {\n`;

          field.args.forEach(arg => {
            const type = toTS(typeMap, arg.type, '_Args');
            output += printDescription(arg, '  ');
            output += `  readonly ${arg.name}: ${type},\n`;
          });
          output += `}\n\n`;
        });
      }
    }
  });
  return output;
}