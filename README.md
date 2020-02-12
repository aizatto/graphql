My set of reusable `graphql` functions

```sh
yarn add @aizatto/graphql
```

Functions:

- `connectionFromKnex`
- `connectionFromDataloader`
- `fieldsFromInfo`

Other links:

- https://www.npmjs.com/package/@aizatto/graphql
- https://github.com/aizatto/graphql
- https://www.npmjs.com/~aizatto

# Known Problems

## Multiple instances of `graphql` installed

When using `@aizatto/graphql` with `yarn` and `lerna` and different `graphql` packages, you may get this error:

> Ensure that there is only one instance of "graphql" in the node_modules directory. If different versions of "graphql" are the dependencies of other relied on modules, use "resolutions" to ensure only one version is installed.
>
> https://yarnpkg.com/en/docs/selective-version-resolutions
> 
> Duplicate "graphql" modules cannot be used at the same time since different versions may have different capabilities and behavior. The data from one version used in the function from another could produce confusing and spurious results.

In the root `/package.json` include in the `workspaces` key a `nohoist` array. For example:

```json
{
  "workspaces": {
    "packages": [
      "packages/*"
    ],
    "nohoist": [
      "**/@aizatto/graphql"
    ]
  }
}
```

Learn more about `yarn`'s [`nohoist`](https://classic.yarnpkg.com/blog/2018/02/15/nohoist/)
