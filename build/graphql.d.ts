import { GraphQLResolveInfo } from "graphql";
export { printTypeScriptDefinitions, printTypeScriptArgs } from './utilities';
import { ConnectionConfig } from "graphql-relay";
export declare const connectionArgs: {
    after: {
        type: import("graphql").GraphQLScalarType;
    };
    first: {
        type: import("graphql").GraphQLScalarType;
    };
    before: {
        type: import("graphql").GraphQLScalarType;
    };
    last: {
        type: import("graphql").GraphQLScalarType;
    };
    order: {
        type: import("graphql").GraphQLScalarType;
    };
    sort: {
        type: import("graphql").GraphQLScalarType;
    };
};
export declare function connectionDefinitions(config: ConnectionConfig): import("graphql-relay").GraphQLConnectionDefinitions;
export declare const argsToSortAndOrder: (args: any) => {
    column: any;
    direction: any;
};
export declare function fieldsFromInfo(info: GraphQLResolveInfo): Set<string>;
export declare function addArgsToQuery(args: any, query: any): any;
export declare function connectionFromKnex<T>(args: any, query: any, countQuery: any, info: GraphQLResolveInfo): Promise<any>;
export declare function connectionFromDataloader(args: any, rows: any, info: any): Promise<any>;
//# sourceMappingURL=graphql.d.ts.map