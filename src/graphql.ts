import { GraphQLInt, GraphQLNonNull, GraphQLString, GraphQLList } from "graphql";

import {
  connectionArgs as connectionArgsBase,
  connectionDefinitions as connectionDefinitionsBase,
  ConnectionConfig as ConnectionConfigBase,
  connectionFromArraySlice,
  cursorToOffset
} from "graphql-relay";

export const connectionArgs = {
  order: {
    type: GraphQLString
  },
  sort: {
    type: GraphQLString
  },
  ...connectionArgsBase
};

export function connectionDefinitions(config: ConnectionConfig) {
  // eslint-disable-next-line
  if (!config.connectionFields) {
    config.connectionFields = {};
  }
  config.connectionFields['totalCount'] = {
    type: new GraphQLNonNull(GraphQLInt)
  };

  config.connectionFields['nodes'] = {
    type: new GraphQLList(config.nodeType),
  }

  return connectionDefinitionsBase(config);
}

function connectionArgsToLimitAndOffset(args) {
  // HANDLE LAST
  const { after, before, first, last } = args;

  if (last && before) {
    const offset = cursorToOffset(before) - last;
    return {
      limit: last,
      offset: offset > 0 ? offset : 0
    };
  }

  if (after) {
    const offset = cursorToOffset(after);
    return {
      limit: first,
      offset
    };
  }

  return {
    limit: first,
    offset: 0
  };
}

export const argsToSortAndOrder = args => {
  const direction = args.order ? args.order : "asc";
  const column = args.sort ? args.sort : "uuid";

  return { column, direction };
};

function fieldsFromSelectionSet(info, selectionSet) {
  let fields = new Set<string>();

  selectionSet.selections.forEach(field => {
    const name = field.name.value;
    switch (field.kind) {
      case "FragmentSpread": {
        const fields2 = fieldsFromSelectionSet(
          info,
          info.fragments[name].selectionSet
        );
        fields = new Set([...fields, ...fields2]);
        break;
      }

      case "Field":
        fields.add(name);
        break;

      default:
        break;
    }
  });

  return fields;
}

export function fieldsFromInfo(info): Set<string> {
  if (
    !info ||
    !info.fieldNodes ||
    !Array.isArray(info.fieldNodes) ||
    info.fieldNodes.length === 0
  ) {
    return new Set();
  }

  let fields = new Set<string>();

  // eslint-disable-next-line no-restricted-syntax
  for (const fieldNode of info.fieldNodes) {
    const newFields = fieldsFromSelectionSet(info, fieldNode.selectionSet);

    fields = new Set<string>([...fields, ...newFields]);
  }

  return fields;
}

export function addArgsToQuery(args, query) {
  const { limit, offset } = connectionArgsToLimitAndOffset(args);

  if (limit) {
    query.limit(limit);
  }

  return query;
}

export async function connectionFromKnex<T>(
  args,
  query: any,
  countQuery: any,
  info
): Promise<any> {
  const { offset } = connectionArgsToLimitAndOffset(args);
  const whereQuery = addArgsToQuery(args, query);

  countQuery.clearOrder();

  if (offset) {
    query.offset(offset);
  }

  if (info) {
    const fields = fieldsFromInfo(info);
    if (fields.size === 1 && fields.has("totalCount")) {
      const [{ count }] = await countQuery;

      return {
        totalCount: count
      };
    }
  }

  const [rows, [{ count }]] = await Promise.all([whereQuery, countQuery]);

  const values = connectionFromArraySlice<T>(rows, args, {
    sliceStart: offset,
    arrayLength: count
  });

  return {
    ...values,
    totalCount: count
  };
}