# V3 migration guide for Hasura GraphQL Engine v2

> [!NOTE]
> The guide uses the DDN CLI v2.1.1.

## What you will miss in v2

### A single all-in-one engine

GraphQL Engine v2 includes many features inside a single container:

- GraphQL + REST API server.
- Embed native PostgreSQL connector.
- Live query subscription.
- Remote Schema.
- Business logic via Action.
- Event triggers.
- Cron triggers.
- Caching (Enterprise, Cloud).
- Prometheus, OpenTelemetry exporters (Enterprise, Cloud).
- Remote data connectors (Enterprise, Cloud). This is the early implementation of [Open Data Domain Specification](https://github.com/hasura/open-data-domain-specification) and [Native Data Connector](https://hasura.github.io/ndc-spec/) specifications in v3.

### PostgreSQL migration tool

Hasura GraphQL Engine is originally designed as an API engine for PostgreSQL. The ecosystem such as metadata and migration was built around PostgreSQL. The Hasura team expanded more database support in v2. However, besides PostgreSQL, the migration tool supports for new databases are stopped. There are many alternatives in the market. No need to spend efforts reinventing the wheel. And the migration tool support is dropped in v3 ([docs](https://hasura.io/docs/3.0/getting-started/deployment/deploy-your-supergraph/#migrations)).

### Friendly database admin and metadata editor in web UI

The new v3 console is mostly read-only. The metadata development is moved to the CLI and Visual Studio Code editor via the Language Code Server extension. The new development experience may be more complicated for beginners. However, the scalability and performance will be better for projects that have big metadata.

### Dynamic metadata changes

Metadata in Hasura v2 is stored in the PostgreSQL database. Admin users can modify metadata and migration directly on the console. In Hasura v3 the metadata is statically built to a JSON manifest that can't be modified in the runtime.

In brief, GraphQL Engine v2 is perfect if you only need to develop GraphQL APIs for a CRUD application that reads and writes data into PostgreSQL databases. You can also use GraphQL Engine v2 as a PostgreSQL migration tool for v3.

### Built-in admin secret authentication

Engine v3 no longer supports admin secret authentication. Fortunately, it's easy to replicate this authentication via a [simple authentication webhook](./auth-hook/main.ts).

## So why Hasura v3?

### Open Specs, data connectors for free

Hasura v3 generalizes the data connector specs via [Open Data Domain Specification](https://github.com/hasura/open-data-domain-specification) and [Native Data Connector](https://hasura.github.io/ndc-spec/) that implements new database adapters easier. There are many supported databases in v3 for free now and in the future. You can see all available connectors [here](https://hasura.io/connectors). In Hasura v2 only PostgreSQL is free.

### Static metadata, no PostgreSQL require

Hasura v2 requires a PostgreSQL server for metadata storage. It seems redundant if you only want to use Hasura Engine with other databases, e,g. SQL Server, MySQL, MongoDB, etc... Dynamic metadata is convenient for live editing. The trade-off is worse performance and unexpected race condition issues on metadata sync if the GraphQL Engine application has many replicas (pods).

Static metadata is fast and immutable. You won't need to worry about inconsistent metadata errors.

### Better versioning

You can build and roll out multiple build versions for multi-stage environments and easy to roll back. On Hasura Cloud, you can create many build versions for development and testing without affecting the production version, and apply the new build as production APIs or rollback via several clicks.

### Read replica support for free

Engine v3 supports read/write separation natively. It's available in the OSS version for free. However, this also requires support from data connectors.

### Free observability exporters

Prometheus and OpenTelemetry exporters are natively supported and free to use in both Engine v3 and data connectors.

### Community contribution

Hasura v3 is rewritten in Rust which is easier to understand than Haskell. The connector specification is also open for everyone to contribute new backend and database supports with any language.

### Connector deployment support (Cloud)

Hasura Cloud v2 only serves core GraphQL Engine instances. You have to deploy action webhook services to other platforms to handle business logic. The Hasura team supports connector deployment service in v3 so you don't need to be concerned about this.

### Multi-region support (Cloud)

The new DDN cloud architecture enables Hasura to network globally across multiple regions. The load balancer can route client requests from the nearest region which boosts performance and user experience. Hasura Cloud v2 only hosts GraphQL Engine tenants in a fixed region.

### Observability Redesign (Cloud)

All services in Hasura v3 are OpenTelemetry-compliant and trace first. It's easier to debug and analyze the performance of each step and each executed micro-service that happens in an API request.

Hasura team also offers a 15-minute free observability for local development (require login).

## Comparison

Hasura v3 (or DDN) is the big rewrite of GraphQL Engine. It completely breaks down the monolith to a microservices architecture for better scalability and reliability. However, this also leads to many breaking changes and the migration from v2 to v3 would be a large work. This example gives you some tips to save some amount of time to do the migration.

### Architecture

![Hasura Architecture v2](./assets/architecture-v2.png)
Hasura GraphQL Engine v2

![Hasura Architecture v3](./assets/architecture-v3.png)
Hasura Engine v3

### Concepts

> [!NOTE]
> See [Core Concepts](https://hasura.io/docs/3.0/basics/core-concepts) and [For Hasura v2 users](https://hasura.io/docs/3.0/basics/v3-for-v2-users) pages in Hasura docs.

| Version 2                                                                    | Version 3                                            |
| ---------------------------------------------------------------------------- | ---------------------------------------------------- |
| The metadata collection of data sources, action, event trigger, cron, etc... | Supergraph                                           |
| Subgraph                                                                     | Data Source                                          |
| Data Connector, Action                                                       | [Connector, Native Data Connector (NDC)](#connector) |
| Remote Schema                                                                | [GraphQL Connector](#remote-schema)                  |
| Event Trigger                                                                | [Plugins](#plugins)                                  |
| Table, View                                                                  | [Collection](#connector)                             |
| Custom read-only APIs for GraphQL query                                      | [Function](#connector)                               |
| Write APIs for GraphQL mutation                                              | [Procedure](#connector)                              |
| Column Presets                                                               | [Argument Presets](#column-presets)                  |

### Features

> The table compares v2 and v3 feature at August 24, 2024

| Feature         | Version 2               | Version 3                                    |
| --------------- | ----------------------- | -------------------------------------------- |
| Query           | :white_check_mark:      | :white_check_mark:                           |
| Mutation        | :white_check_mark:      | :white_check_mark:                           |
| Subscription    | :white_check_mark:      | WIP                                          |
| Streaming       | :white_check_mark:      | WIP                                          |
| Aggregate Query | :white_check_mark:      | :white_check_mark: (C)                       |
| Native Query    | :white_check_mark:      | :white_check_mark:                           |
| Native Mutation | :x:                     | :white_check_mark:                           |
| Action          | :white_check_mark:      | :white_check_mark: ([Connector](#connector)) |
| Event Trigger   | :white_check_mark:      | WIP ([plugins](#plugins))                    |
| Cron Trigger    | :white_check_mark:      | N/A                                          |
| Remote Schema   | :white_check_mark:      | :white_check_mark:                           |
| Read Replica    | :white_check_mark: (EE) | :white_check_mark:                           |
| Caching         | :white_check_mark: (EE) | WIP                                          |
| Prometheus      | :white_check_mark: (EE) | :white_check_mark:                           |
| OpenTelemetry   | :white_check_mark: (EE) | :white_check_mark:                           |

**\*EE**: Available on Cloud and Enterprise editions only.

**\*C**: Supported by the individual connector.

#### Connector

The specification of Hasura v3 generalizes Database engines and Action handlers to [Native Data Connector specs](https://hasura.github.io/ndc-spec/overview.html) specs. A connector is a bridge between the engine with data stores, and business logic. Currently, there are SDK libraries for the connector spec implementation in popular programming languages ([TypeScript](https://github.com/hasura/ndc-sdk-typescript), [Go](https://github.com/hasura/ndc-sdk-go), [Rust](https://github.com/hasura/ndc-sdk-rs), [Python](https://github.com/hasura/ndc-sdk-python), [Java](https://github.com/hasura/ndc-sdk-java) etc...).

NDC specification is well written in the docs. For a quick look, you should understand the following keywords:

- `Collection`: represents a table or view in Hasura v2. The generated schema of collection enables filtering, sorting pagination, and aggregation for the model.
- `Function`: define custom read-only APIs such as native query and action handler for GraphQL query.
- `Procedure`: define custom writable APIs such as insert, update, delete, and action handler for GraphQL mutation.

However, those SDKs seem low-level and hard to use for most developers. Therefore the Hasura team has maintained some high-level frameworks for business logic development (Action):

- [NodeJS connector](https://hasura.io/docs/3.0/business-logic/typescript): parse your TypeScript codes to generate NDC schema and bring up the connector API server automatically in runtime.
- [Python Connector](https://hasura.io/docs/3.0/business-logic/python): similar to NodeJS connector.
- [NDC Go](https://github.com/hasura/ndc-sdk-go/tree/main/cmd/hasura-ndc-go): similar for NodeJS connector, but generate source codes.

#### Remote Schema

In Hasura GraphQL Engine v2, we configure the remote schema endpoint and headers and the engine automatically fetches and merges GraphQL schema in runtime. Even though this is convenient unexpected inconsistent metadata issues sometimes happen, e.g. unreachable remote servers.

Hasura v3 leaves remote schemas to [GraphQL connector](https://github.com/hasura/ndc-graphql). The connector introspects GraphQL schema from the remote server, converts GraphQL to NDC schema, and proxies requests from Engine v3 to the upstream GraphQL server. The drawback is, that the schema is statically generated so whenever there is any new API change from the remote upstream you have to update the schema and rebuild the connector.

### Plugins

> See [Engine v3 Plugins Specification](https://github.com/hasura/graphql-engine/blob/rfc/engine-plugins/rfcs/v3/engine-plugins.md)

## Migration guide

### Prerequisites

[Install the latest DDN CLI](https://hasura.io/docs/3.0/getting-started/quickstart) (>= v2.1.1).

Docker & [Docker Compose >= 2.20.0](https://docs.docker.com/compose/release-notes/#2200) are also required. The DDN v3 project boilerplate uses the `include` attribute which has been supported since v2.20.0 to import compose files from connectors in subgraphs.

[Visual Studio Code](https://code.visualstudio.com/download) is the recommended editor. The Hasura team officially maintains a [Hasura Language Server Extension](https://marketplace.visualstudio.com/items?itemName=HasuraHQ.hasura) to help us develop v3 metadata with autocompletion, auto-scaffolding, syntax highlighting, and more.

### Setup a new DDN project

> [!NOTE]
> You can get started with a brand new project with [the official quickstart guide](https://hasura.io/docs/3.0/getting-started/quickstart) in Hasura docs.

We have an existing GraphQL Engine [v2](./v2) project with 2 Postgres data sources. If you already have an existing docker-compose file for v2 let's copy it to `compose.v2.yaml` and add the following configurations so the DDN CLI can update the connector schema.

```yaml
services:
  postgres:
    # ...
    extra_hosts:
      - local.hasura.dev=host-gateway
```

Hasura v3 only allows authenticated users to build supergraphs even if you just want to use engine v3 OSS locally.

```sh
ddn auth login
```

Now we create a v3 project to start the migration. First, create a supergraph and 2 subgraphs for `data` and `chinook` data sources.

```sh
ddn supergraph init . --create-subgraph data
ddn subgraph add --subgraph chinook/subgraph.yaml --target-supergraph ./supergraph.yaml
```

Include `compose.v2.yaml` in `compose.yaml` to run both v2 and v3 services in parallel.

```yaml
include:
  - path: compose.v2.yaml
  # ...
```

By default, the schema of query and mutation operations is generated in `camelCase` format. If you don't use the `camelCase` convention in Hasura v2 the `namingConvention: none` setting should be added to keep minimum break changes as possible.

```yaml
kind: Subgraph
version: v2
definition:
  name: data
  generator:
    rootPath: .
    namingConvention: none
#...
```

In the subgraph definition of chinook, you need to add `graphqlTypeNamePrefix=chinook_` and optionally `graphqlRootFieldPrefix` settings if there are any table which has the same name as other subgraphs.

```yaml
kind: Subgraph
version: v2
definition:
  name: chinook
  generator:
    rootPath: .
    namingConvention: none
    # graphqlRootFieldPrefix: chinook_
    graphqlTypeNamePrefix: chinook_
```

> [!NOTE]
> If you don't set the different graphql type name prefix the supergraph can't be built. The schema doesn't allow duplicated GraphQL type names.
>
> ```sh
> input: building metadata failed: {"message": "invalid metadata: error building schema: invalid metadata: multiple graphql types found with the same > name: int4", "path": "", "code": "opendds-validation"}
> ```

### Database migration tool

If you use PostgreSQL only GraphQL Engine v2 is still an awesome tool to manage migrations via the web UI interface. Otherwise, various free alternatives support multiple databases:

- **[Flyway](https://www.red-gate.com/products/flyway/)**: a popular migration tool that supports a wide range of databases. The community edition can satisfy your database migration job. However, this tool may not be your choice if you prefer simplicity or don't like to install Java SDK dependencies to run this tool.
- **[Liquibase](https://www.liquibase.com/)**: similar to `Flyway` but supports many file formats (SQL, JSON, YAML, XML). The tool is also written in Java and heavy-weight.
- **[goose](https://github.com/pressly/goose)**: a lightweight migration tool that is written in Go. The tool supports popular SQL-compliant databases such as PostgreSQL, MySQL, MSSQL, SQLite, and ClickHouse.
- **[golang/migrate](https://github.com/golang-migrate/migrate)**: another migration tool that is written in Go. The tool supports more databases than `goose` and various migration sources (filesystem, GitHub, Google Cloud Storage, AWS S3). However, [this issue](https://github.com/golang-migrate/migrate/issues/510) may make you hesitant to use this tool.
- **[Atlas](https://atlasgo.io/getting-started/)**: inspired by Terraform. This tool enables the declarative workflow, and versioning and supports ERD visualization (paid plan).
- Popular ORM libraries also supports migration as code ([TypeORM](https://typeorm.io/migrations#generating-migrations), [Sequelize](https://sequelize.org/docs/v6/other-topics/migrations/), [GORM](https://gorm.io/docs/migration.html)). However, you can ignore those libraries because Hasura migration is created in SQL format. It's easier to move SQL migration files to migration tools that support native SQL.

### Postgres connector

> [!NOTE]
> See [PostgreSQL Connector](https://hasura.io/docs/3.0/connectors/postgresql/) page in Hasura docs v3. The latest configuration reference is [version 5](https://hasura.io/docs/3.0/connectors/postgresql/configuration-reference/version-5)

Add connectors to each subgraph:

```sh
# initialize data connector
ddn connector init -i --subgraph data/subgraph.yaml --add-to-compose-file ./compose.yaml

# ? Hub Connector hasura/postgres
# ? Connector Name data
# ? Port 5997
# ? CONNECTION_URI (The PostgreSQL connection URI) postgres://postgres:postgrespassword@local.hasura.dev:5432/postgres

# initialize chinook connector
ddn connector init -i --subgraph chinook/subgraph.yaml --add-to-compose-file ./compose.yaml

# ? Hub Connector hasura/postgres
# ? Connector Name chinook
# ? Port 8166
# ? CONNECTION_URI (The PostgreSQL connection URI) postgres://postgres:postgrespassword@local.hasura.dev:5432/chinook
```

By default, the PostgreSQL connector doesn't enable mutation operations (INSERT, UPDATE, DELETE). You need to change `mutationsVersion` to `v2` in the [configuration.json](data/connector/data/configuration.json) file.

Start docker services that include the PostgreSQL server. Docker-compose watches and automatically reloads when there are new changes. Keep this terminal session and run other commands in a new session.

```sh
HASURA_DDN_PAT=$(ddn auth print-pat) docker compose --env-file .env up --build --watch
```

Introspect connector configurations and add subgraph metadata for PostgreSQL tables.

```sh
ddn connector introspect data --subgraph ./data/subgraph.yaml --add-all-resources
ddn connector introspect chinook --subgraph ./chinook/subgraph.yaml --add-all-resources
```

Now you can build the supergraph metadata and start services locally to explore the engine v3.

```sh
# For every metadata change, you need to run this command to rebuild the supergraph metadata
ddn supergraph build local
# open the local console
ddn console --local
```

#### Breaking changes

The following operations aren't available or haven't been supported in the PostgreSQL connector v1.1.1:

- Aggregate query: `<table_name>_aggregate` hasn't supported yet.
- Update: `update_<table_name>(where: <table_name>_bool_exp, _set: <table_name>_set_input!)`.
- Update Many: `update_<table_name>_many`.
- Delete: `update_<table_name>(where: <table_name>_bool_exp`.

You can temporarily define [Native Query](https://hasura.io/docs/3.0/connectors/postgresql/native-operations/custom-queries) to create aggregate queries and [Native Mutation] to create custom INSERT, UPDATE, DELETE operations.

Generated get, update, and delete one by primary key operations in Hasura v3 are also different. The DDN CLI generates those operation names with explicit primary and unique column names instead of the `pk` suffix. This behavior is better if the table has both primary key and unique indexes.

| Table   | Primary Key       | Operation | Version 2            | Version 3                          |
| ------- | ----------------- | --------- | -------------------- | ---------------------------------- |
| author  | id                | SELECT    | author_by_pk         | author_by_id                       |
| article | (author_id, slug) | SELECT    | article_by_pk        | author_by_author_id_slug           |
| author  | id                | UPDATE    | update_author_by_pk  | v2_update_author_by_id             |
| article | (author_id, slug) | UPDATE    | update_article_by_pk | v2_update_author_by_author_id_slug |
| author  | id                | DELETE    | delete_author_by_pk  | v2_delete_author_by_id             |
| article | (author_id, slug) | DELETE    | delete_article_by_pk | v2_delete_author_by_author_id_slug |

You may also notice that generated mutations have a `v2_` prefix. That makes the default-generated metadata incompatible with Hasura v2. Fortunately, the names can be edited even though it takes some manual effort.

> [!TIP]
> Use an editor to replace `rootFieldName: v2_` with `rootFieldName: ` to remove v2 prefixes.
> [!Replace v2 prefixes](./assets/replace-v2-prefixes.png)

However, GraphQL scalar type naming is another pain point if you want to make the GraphQL schema consistent between both versions. Hasura v2 tries to correlate data types of PostgreSQL to basic GraphQL scalars. In contrast, PostgreSQL connector v3 keeps scalar names to be the same as native types of PostgreSQL.

| PostgreSQL Type | Version 2   | Version 3   |
| --------------- | ----------- | ----------- |
| bit             | bit         | bit         |
| bool            | Boolean     | bool        |
| bpchar          | bpchar      | bpchar      |
| char            | bpchar      | bpchar      |
| date            | date        | date        |
| float4          | Float       | float4      |
| float8          | float8      | float8      |
| int2            | smallint    | int2        |
| int4            | Int         | int4        |
| int8            | bigint      | int8        |
| numeric         | numeric     | numeric     |
| text            | String      | text        |
| time            | time        | time        |
| timestamp       | timestamp   | timestamp   |
| timestamptz     | timestamptz | timestamptz |
| timetz          | timetz      | timetz      |
| uuid            | uuid        | uuid        |
| varchar         | String      | varchar     |

It's possible to rename GraphQL types in v3 to match v2. However, it's useless if you have multiple PostgreSQL data sources. Engine v3 doesn't allow duplicated GraphQL type mappings. So even if using the same PostgreSQL connector, you still need to add suffixes to GraphQL types in other subgraphs via the `graphqlRootFieldPrefix` setting.

> [!TIP]
> To rename the scalar type, open `<subgraph>/metadata/data-types.yaml` -> Right click on the scalar name -> `Rename Symbol`. The Hasura extension can rename all related fields that use that scalar type.
> ![Rename Scalar](./assets/rename-scalar.png)

What does that mean for us? It should be fine if you don't use GraphQL variables. If not you have to update GraphQL queries in the client.

```graphql
# version 2
query GetArtists($name: String!) {
  Artist(where: { Name: { _ilike: $name } }) {
    ArtistId
    Name
  }
}

# version 3
query GetArtists($name: chinook_varchar!) {
  Artist(where: { Name: { _ilike: $name } }) {
    ArtistId
    Name
  }
}
```

Generated Insert, Update, and Delete mutations are also generated differently.

**Insert**

> [!NOTE] > `ON CONFLICT` hasn't been supported in PostgreSQL connector v1.1.1.

```graphql
# v2
mutation InsertArticle {
  insert_article(objects: [{ title: "article 1", user_id: 1 }]) {
    affected_rows
    returning {
      id
    }
  }
}

# {
#   "data": {
#     "insert_article": {
#       "affected_rows": 1,
#       "returning": [
#         {
#           "id": 1
#         }
#       ]
#     }
#   }
# }

# v3
mutation InsertArticle {
  insert_article(
    objects: [{ title: "article 1", user_id: 1 }]
    post_check: {}
  ) {
    affected_rows
    returning {
      id
    }
  }
}

# {
#   "data": {
#     "insert_article": {
#       "affected_rows": 1,
#       "returning": [
#         {
#           "id": 1
#         }
#       ]
#     }
#   }
# }
```

**Update**

```graphql
# v2
mutation UpdateArticleByPk {
  update_article_by_pk(pk_columns: { id: 1 }, _set: { title: "foo" }) {
    id
  }
}

# {
#   "data": {
#     "update_article_by_pk": {
#       "id": 1
#     }
#   }
# }

# v3
mutation UpdateArticleByPk {
  update_article_by_id(
    key_id: 1
    pre_check: {}
    post_check: {}
    update_columns: { title: { _set: "foo" } }
  ) {
    affected_rows
  }
}

# {
#   "data": {
#     "update_article_by_id": {
#       "affected_rows": 0,
#       "returning": []
#     }
#   }
# }
```

**Delete**

```graphql
# v2
mutation DeleteArticleByPk {
  delete_article_by_pk(id: 1) {
    id
  }
}

# {
#   "data": {
#     "delete_article_by_pk": {
#       "id": 1
#     }
#   }
# }

# v3
mutation DeleteArticleByPk {
  delete_article_by_id(key_id: 1, pre_check: {}) {
    affected_rows
    returning {
      id
    }
  }
}

# {
#   "data": {
#     "update_article_by_id": {
#       "affected_rows": 0,
#       "returning": []
#     }
#   }
# }
```

### Authentication

Hasura v3 supports 3 authentication modes:

- `noAuth`: no authentication required. It's the default mode when initializing a new project so you can easily get started with the development.
- [webhook](https://hasura.io/docs/3.0/auth/authentication/webhook/): the concept is similar to Hasura v2.
- [jwt](https://hasura.io/docs/3.0/auth/authentication/jwt/): similar to Hasura v2.

Admin secret authentication is no longer supported in Hasura v3. However, it's easy to replicate this authentication via a [simple authentication webhook](./auth-hook/main.ts).

### Permissions

> See [Permissions](https://hasura.io/docs/3.0/supergraph-modeling/permissions).

Permissions in Hasura v2 are model-based designed that define Create, read, update, and delete (CRUD) rules. Meanwhile, Hasura v3 permissions to multiple separated types.

| Type               | Description                                                                       |
| ------------------ | --------------------------------------------------------------------------------- |
| TypePermissions    | Define which fields are allowed to be accessed by a role on an output type.       |
| ModelPermissions   | Define which objects or rows within a model are allowed to be accessed by a role. |
| CommandPermissions | Define whether the command is executable by a role.                               |

Let's see the similarity between Hasura v2 and v3.

![Permission v2](./assets/permissions-v2.png)

#### Filter Permissions

![Filter permissions](./assets/permissions-v2-filter.png)

[Filter rules of select permissions](./v2/metadata/databases/data/tables/public_article.yaml#L21) are defined in the [ModelPermissions](https://hasura.io/docs/3.0/supergraph-modeling/permissions/#modelpermissions-modelpermissions) type in Hasura v3.

Hasura v2 can automatically detect session variables and literal values in `filter`. This configuration is more explicit in v3 ([source](./data/metadata/article.hml#H84)).

```yaml
# v2
select_permissions:
  - role: user
    permission:
      filter:
        user_id:
          _eq: x-hasura-user-

# v3
kind: ModelPermissions
version: v1
definition:
  modelName: article
  permissions:
    - role: admin
      select:
        filter: null
    - role: user
      select:
        filter:
          fieldComparison:
            field: user_id
            operator: _eq
            value:
              sessionVariable: x-hasura-user-id
```

#### Column Permissions

![Column select permissions](./assets/permissions-v2-columns.png)

[Column permissions](./v2/metadata/databases/data/tables/public_article.yaml#L21) are defined in the [TypePermissions](https://hasura.io/docs/3.0/supergraph-modeling/permissions/#typepermissions-typepermission) type in Hasura v3.

```yaml
# v2
select_permissions:
  - role: user
    permission:
      columns:
        - id
        - title
        - user_id

# v3
kind: TypePermissions
version: v1
definition:
  typeName: article
  permissions:
    - role: user
      output:
        allowedFields:
          - id
          - title
          - user_id
```

`TypePermissions` are also applied for input arguments in functions and commands, e.g. allowed update columns.

```yaml
kind: TypePermissions
version: v1
definition:
  typeName: v2_update_article_by_id_update_columns
  permissions:
    - role: user
      output:
        allowedFields:
          - title
```

#### Pre-check and Post-check

![Pre-check and Post-check](./assets/pre-check-post-check-v2.png)

> See [CommandPermissions](https://hasura.io/docs/3.0/supergraph-modeling/permissions/#commandpermissions-commandpermissions).

Pre-check and Post-check permissions aren't natively supported by Hasura Engine v3. This is handled by individual connectors. PostgreSQL connector supports these checks by adding `pre_check` and `post_check` input arguments:

```graphql
mutation UpdateArticleById {
  update_article_by_id(
    key_id: 1
    pre_check: { user_id: { _eq: 1 } }
    post_check: { user_id: { _eq: 1 } }
    update_columns: { title: { _set: "foo" } }
  ) {
    affected_rows
  }
}
```

To simulate pre-check and post-check in Hasura v3. We need to add `argumentPresets` in `CommandPermissions` of the input type:

```yaml
kind: CommandPermissions
version: v1
definition:
  commandName: v2_update_article_by_id
  permissions:
    - role: admin
      allowExecution: true
    - role: user
      allowExecution: true
      argumentPresets:
        - argument: pre_check
          value:
            booleanExpression:
              fieldComparison:
                field: user_id
                operator: _eq
                value:
                  sessionVariable: x-hasura-user-id
        - argument: post_check
          value:
            booleanExpression:
              fieldComparison:
                field: user_id
                operator: _eq
                value:
                  sessionVariable: x-hasura-user-id
```

> [!NOTE]
> 
> `pre_check` and `post_check` are required arguments. If you want to make them optional you can set empty argument presets:
>
> ```yaml
> kind: CommandPermissions
> version: v1
> definition:
>   commandName: v2_update_users_by_id
>   permissions:
>     - role: admin
>       allowExecution: true
>       argumentPresets:
>         - argument: pre_check
>           value:
>             booleanExpression:
>               and: []
>         - argument: post_check
>           value:
>             booleanExpression:
>               and: []
> ```

#### Column Presets

![Column Presets](./assets/column-presets.png)

> See [Argument Presets](https://hasura.io/docs/3.0/supergraph-modeling/permissions/#argument-presets).

Add `fieldPresets` input to `TypePermissions` to automatically set `user_id` to inserted objects.

```yaml
kind: TypePermissions
version: v1
definition:
  typeName: v2_insert_article_object
  permissions:
    - role: user
      input:
        fieldPresets:
          - field: user_id
            value:
              sessionVariable: x-hasura-user-id
      output:
        allowedFields:
          - title
```

#### Aggregation queries permissions

Work in progress

#### Input Validation

Work in progress. The input validation hook is supported by Plugins.

#### Limit number of rows

Not supported.

### Relationships

> See [Relationships](https://hasura.io/docs/3.0/supergraph-modeling/relationships).

Native PostgreSQL relationships can be automatically generated by the DDN CLI. However, you need to define relationships with models in different subgraphs manually. For example, the following example adds a remote relationship from `data.users` to `chinook.Album`.

```yaml
kind: Relationship
version: v1
definition:
  name: albums
  sourceType: users
  target:
    model:
      subgraph: chinook
      name: Album
      relationshipType: Array
  mapping:
    - source:
        fieldPath:
          - fieldName: id
      target:
        modelField:
          - fieldName: AlbumId
```

### Action

> See [Business Logic](https://hasura.io/docs/3.0/business-logic/overview/)

![Action](./assets/action-v2.png)

[Action handler](https://hasura.io/docs/2.0/actions/action-handlers/) webhooks in GraphQL Engine v2 have simple request and response payload structures. It's easy to integrate with any REST API framework. The schema definition of Hasura action is also in GraphQL format.

```ts
app.post("/hello", async (req, res) => {
  // request input
  // {
  //   "action": {
  //     "name": "hello"
  //   },
  //   "input": {
  //     "name": "world"
  //   },
  //   "session_variables": {
  //     "x-hasura-user-id": "1",
  //     "x-hasura-role": "user"
  //   }
  // }
  const { name } = req.body.input;

  // Run some business logic

  /*
  // In case of errors:
  return res.status(400).json({
    message: "error happened"
  })
  */

  // success
  return res.json({
    reply: `hello ${name ?? "world"}`,
  });
});
```

The connector specs of Hasura v3 are more complicated. You need to generate [NDC schema](https://github.com/hasura/ndc-spec/blob/main/ndc-reference/tests/schema/expected.json) and handle nested body structure encoding and decoding ([example](https://github.com/hasura/ndc-spec/blob/main/ndc-reference/tests/mutation/delete_articles/request.json)). Therefore it's easier to use high-level NDC frameworks:

- [NodeJS connector](https://hasura.io/docs/3.0/business-logic/typescript)
- [Python Connector](https://hasura.io/docs/3.0/business-logic/python)
- [NDC Go](https://github.com/hasura/ndc-sdk-go/tree/main/cmd/hasura-ndc-go)

This example uses a NodeJS connector. Let's create a new subgraph.

```sh
ddn subgraph init app --dir app --target-supergraph ./supergraph.yaml
ddn connector init -i --subgraph app/subgraph.yaml --add-to-compose-file ./compose.yaml
# ? Hub Connector hasura/nodejs
# ? Connector Name app
# ? Port 5646
```

NodeJS connector generates a [default function](./app/connector/app/functions.ts). Modify the response type to be similar to the `hello` action.

```ts
/**
 * @readonly Exposes the function as an NDC function (the function should only query data without making modifications)
 */
export function hello(name?: string) {
  return {
    reply: `hello ${name ?? "world"}`,
  };
}
```

```sh
ddn connector introspect app --subgraph ./app/subgraph.yaml --add-all-resources
```

Similar to Hasura Engine v2 permissions, you can allow execution for each role. Hasura v3 permissions are better with the `argumentPresets` setting to inject default argument values into the request payload.

```yaml
kind: CommandPermissions
version: v1
definition:
  commandName: Hello
  permissions:
    - role: admin
      allowExecution: true
    - role: user
      allowExecution: true
      argumentPresets:
        - argument: name
          value:
            literal: foo
```

### Event Trigger

Work in progress.

### Cron Trigger

Currently, there isn't any plan to bring the Cron Trigger feature to Hasura v3. However, there are many alternatives. If your team uses Kubernetes [Cronjob](https://kubernetes.io/docs/concepts/workloads/controllers/cron-jobs/) is a good solution.

### Remote Schema

> [!NOTE]
> The example uses [Countries API](https://countries.trevorblades.com).

> [!NOTE]
> GraphQL Connector is still in development.

Create a new subgraph with a GraphQL connector.

```sh
ddn subgraph init countries --dir countries --target-supergraph ./supergraph.yaml
ddn connector init -i --subgraph countries/subgraph.yaml --add-to-compose-file ./compose.yaml
# ? Hub Connector hasura/graphql
# ? Connector Name countries
# ? Port 8395
```

Set the GraphQL API endpoint to [configuration.json](./countries/connector/countries/configuration.json) and introspect the schema.

Add type prefix to the subgraph generator to avoid failed metadata builds.

```yaml
kind: Subgraph
version: v2
definition:
  name: countries
  generator:
    rootPath: .
    graphqlTypeNamePrefix: countries_
```

```sh
ddn connector introspect countries --subgraph ./countries/subgraph.yaml --add-all-resources
```

Permissions and relationship have many improvements in Hasura v3 thanks to [Open DDS](https://github.com/hasura/open-data-domain-specification) specification. The configuration is similar to other connectors ([example](./countries/metadata/Countries.hml)).

Finally, build the supergraph and have fun.

```sh
ddn supergraph build local
```
