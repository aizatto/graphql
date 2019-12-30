import { TypeNode, GraphQLNamedType, isSpecifiedScalarType, isIntrospectionType, isObjectType, GraphQLOutputType, parseType, isInterfaceType, isEnumType, isInputObjectType, GraphQLEnumType, GraphQLSchema } from 'graphql';

// https://github.com/graphql/graphql-js/blob/master/src/utilities/schemaPrinter.js

function typeFilter(type: GraphQLNamedType): boolean {
  return !isSpecifiedScalarType(type) && !isIntrospectionType(type);
}

function toTS(graphqlType: GraphQLOutputType): string {
  const ast = parseType(graphqlType.toString());
  return toTSfromAST(ast);
}

function toTSfromAST(typeNode: TypeNode): string {
  let tsType = '';
  switch (typeNode.kind) {
    case 'NonNullType':
      tsType = toTSfromAST(typeNode.type);
      break;

    case 'ListType':
      tsType = toTSfromAST(typeNode.type);
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
  output += `enum ${type.name} {\n`
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
  let output = `// Auto-generated on ${new Date().toISOString()}\n`;

  const typeMap = schema.getTypeMap();
  const types = Object.values(typeMap)
    .sort((type1, type2) => type1.name.localeCompare(type2.name))
    .filter(typeFilter);

  types.forEach(type => {
    const inputObjectType = isInputObjectType(type);
    const outputType = isObjectType(type);

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
    if (outputType) {
      output += `  readonly __typename: '${type.name}',\n`;
    }

    Object.values(type.getFields()).forEach((field) => {
      if (inputObjectType && field.name === 'clientMutationId') {
        return;
      }

      const type = toTS(field.type);
      output += printDescription(field, '  ');
      output += `  readonly ${field.name}: ${type},\n`;
    });

    output += `}\n\n`;
  });

  return output;
}