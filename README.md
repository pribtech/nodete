# Technology Explorer

The Technology Explorer (TE) is a light weight, web based console for database management
systems: IBM DB2, PostgreSQL, MySQL and MariaDB, SQLite, Apache Derby and H2. It strives to be
a teaching tool for everyone who works with a database. Whether you're just starting out or
have run databases for years, there are tutorials for you around many aspects of how a DBMS
works. Part of what makes the TE such a great teaching tool is that it doesn't just explain to
you how a system should act, the Technology Explorer shows you, using your database! The TE has
a large number of views that show you how your database is actually behaving. All of these
views can be used individually, making the TE a very powerful monitoring tool as well.

Some of the key features of the Technology Explorer are:

- a light weight web based platform for working with database servers
- works with IBM DB2 (Linux, UNIX and Windows; z/OS; i), PostgreSQL, MySQL and MariaDB,
  SQLite, Apache Derby and H2, with every database driver written in JavaScript
- easily expandable and customizable: menus and pages are JSON and XML definition files
- a wealth of content to highlight, demonstrate and teach database features, with the most
  for DB2

## Node.js server (in progress)

The Technology Explorer is being moved from PHP to Node.js. The Node.js server serves the
same front end (everything under `db2te/`) and answers the same URLs (`index.php`,
`action.php`), so the browser code runs unchanged. During the move both servers live in
this repository; the PHP code is removed once every action has been ported. The menus and
layouts are now JSON, which only the Node.js server reads, so run the console with Node.js.

### Running

Requires Node.js 20 or later.

    npm install
    TE_SESSION_SECRET=<long random string> npm start

Then open http://localhost:8080/. `PORT` and `HOST` change where it listens.

Every database driver is JavaScript and installed with the server: no native modules, no
Java. DB2 is reached with the server's own DRDA client (see "DB2 and DRDA" below). The
welcome page lists each driver and whether it is ready.

Apache H2 is a Java database, so the server talks to it through H2's PostgreSQL protocol
server, which needs no extra package. Start H2 with that server enabled and log on with the
H2 driver (a blank host and port mean this machine and H2's default port, 5435):

    java -cp h2.jar org.h2.tools.Server -pg -baseDir <folder of databases>

H2 supports the PostgreSQL protocol only in part, so H2 statements are sent as plain SQL
text with bind values written in as quoted literals, and results are read in full rather
than in batches.

### Configuration

Settings are the ones the PHP version defined in `db2te/config.php`; their defaults are in
`server/config/defaults.json`. Override any of them with an environment variable named
`TE_<SETTING>`, for example `TE_SESSION_TIMEOUT_IN_MIN=30` or `TE_DEVELOPMENT_MODE=false`.
Values are read as JSON where possible, so `true`, `false` and numbers keep their type.

Set `TE_SESSION_SECRET`; without it a random secret is used and sessions end whenever the
server restarts.

### What works so far

| Area | Status |
|---|---|
| Start page, layouts, menus, TE scripts, welcome and about panels | Ported |
| Logging on and off, saved connections, connection status, database features | Ported |
| PostgreSQL, MySQL/MariaDB, SQLite and Apache H2 drivers, all in JavaScript | Ported |
| DB2 and Apache Derby through the server's own DRDA client, in JavaScript | Ported |
| Running SQL (`executeSQL`: ad hoc SQL, scripts and the SQL behind TE pages) | Ported |
| Database-driven and XSL-transformed menus (the object navigator) | Ported |
| Oracle, SQL Server, ODBC (solidDB) and SSH drivers | Next |
| Trusted context users, connection profiles, Cloud Foundry `VCAP_SERVICES` connections | Later |
| Feed reader, tutorials, table lists and the other actions | Later |
| Hadoop, MQ, JSON_NOSQL_DB2 (needed the PHP Java bridge) | Not planned |

Actions not yet ported answer with `Action "<name>" has not been ported to Node.js yet`.

### Code layout

    server/
      index.js            entry point
      core/               server, config, sessions, request/response, action routing
      actions/            one class per action, in the same folders as db2te/actions/*.php
      definitions/        builds menus, layouts and TE scripts from their JSON definitions
      pages/              index page, script list, JS constants, templates
      views/              HTML templates
      drivers/            database drivers: DatabaseDriver, DatabaseConnection and ResultCursor
                          base classes, the vendor drivers, the DriverCatalog
        drda/             DRDA client: framing, logon, statements, row decoding
      sql/                executeSQL: SqlBatch runs a request, StatementRunner one statement
      xml/                reads XML definitions (menus from XSL stylesheets, the converter)
    tools/convert/        converts XML definitions and connStore.xml to JSON
    test/                 tests, with outputs recorded from the PHP version in test/fixtures/php-reference

A new action is a file `server/actions/<noConnection|activeConnection>/<JSON|HTML>/<name>.js`
that default-exports a subclass of `Action` and implements `run()`. It is picked up
automatically; nothing needs registering.

### Database drivers

The drivers share one generic, JDBC-like set of classes, and each database extends them only
where it differs. No Java is involved:

| Generic class | Like JDBC's | Does |
|---|---|---|
| `DatabaseDriver` | `Driver` | checks the login, opens connections, tests a log on |
| `DatabaseConnection` | `Connection` | runs statements with bind parameters, transactions, schema, server information |
| `ResultCursor` | `ResultSet` | reads rows forwards, across result sets, with OUT parameter values |

| Vendor driver | Database | Talks through | What it overrides |
|---|---|---|---|
| `PostgresDriver` | PostgreSQL | `pg`, `pg-cursor` (JavaScript) | `$n` markers, rows read in batches by a server cursor |
| `H2Driver` (extends `PostgresDriver`) | Apache H2 | H2's PostgreSQL protocol server | simple protocol with bind values as literals, `H2VERSION()` |
| `MySqlDriver` | MySQL, MariaDB | `mysql2` (JavaScript) | MySQL quoting, `USE` for schemas, reading paused between batches |
| `SqliteDriver` | SQLite | Node's built-in `node:sqlite` (Node 22.13+) | files in `DATABASE_DATA_DIRECTORY` (default `./data`), no users or schemas |
| `DrdaDriver` | (base for DRDA databases) | the server's DRDA client (JavaScript) | commits in autocommit mode, `SET SCHEMA`, server information from the product id |
| `Db2Driver` (extends `DrdaDriver`) | DB2 for LUW, z/OS, i | DRDA | package NULLID.SYSSH200, port 50000, `CURRENT PATH`, DB2 feature checks |
| `DerbyDriver` (extends `DrdaDriver`) | Apache Derby network server | DRDA | introduces itself as Derby's client, port 1527 |

A new database is a subclass of the three classes, added to `DriverCatalog.standardDrivers()`.
SQLite database names may only use letters, digits and `_ . - /` and stay inside the data
folder, so a log on cannot open or create files elsewhere.

### DB2 and DRDA

DB2 speaks DRDA, IBM's open distributed database protocol, and so does Apache Derby's
network server. `server/drivers/drda/` is a DRDA client written for this server:

| Class | Does |
|---|---|
| `DrdaTransport` | the TCP connection; one request chain at a time |
| `DdmRequest`, `DdmReply`, `DdmObject` | DDM objects in DSS structures, 32 KB segments, extended lengths |
| `DrdaConnection` | log on (EXCSAT, ACCSEC, SECCHK, ACCRDB), prepare, execute, open and fetch queries, commit, rollback |
| `Sqlca`, `Sqlda` | SQL errors and warnings; column descriptions |
| `QueryDescriptor`, `RowDecoder` | result rows in FD:OCA form, including rows split across blocks and LOBs sent apart |
| `Parameters` | bind values (SQLDTA) |
| `Ccsid`, `TypeDefinition`, `ByteReader` | EBCDIC and UTF-8 text, the server's byte order |

Tested against Derby 10.17's network server: log on and its errors, all common data types
(integers, reals, decimals, character and binary strings, dates and times, CLOB, BLOB,
boolean), nulls, results of thousands of rows, bind values, transactions, and the console
end to end. **It has not been run against a DB2 server yet.** DB2 follows the same protocol,
but differences only a DB2 server would show are likely at first.

Not supported yet:
- logging on with an encrypted user ID and password (security mechanisms 7 and 9) or
  Kerberos; the user ID and password go in clear, so use it on trusted networks
- TLS connections
- bind values over 32 KB each (large values can be read, not yet sent)
- stored procedure OUT parameters and result sets from CALL
- column types described with overrides (SDA/MDD triplets), which DB2 may use for some types

### Database connections

The connection manager panel and login form work as before. A connection's details,
including its password, are kept in the server-side session; the database connection itself
is opened when an action needs it and closed when the request ends.

Saved connections are kept in `connectionStore/connStore.json` (`CONNECTION_STORE_FILE`),
without passwords. An administrator can add a `"password"` and `"autoConnect": true` to an
entry to have it connect without asking. To bring over the saved connections of a PHP
installation, copy its `connStore.xml` into `db2te/connectionStore/` and run
`node tools/convert/convert-definitions.js --delete`. Keeping the store in a database
(`CONNECTION_STORE_STORAGE_TYPE` 1) is not supported yet.

With `FORCE_CONNECTION_WITH_DEFAULT`, everyone uses the `DEFAULT_DATABASE_*` connection
and cannot log on to others.

### Definition files

Menus, page layouts, TE scripts and script lists are JSON files under `db2te/`. They were
converted from the XML the PHP version used (`tools/convert/convert-definitions.js`); the
front end receives exactly the same data as before. Fields left out take their default.

**Menus** (`menu_*.json`, listed in name order; `menu/` and `tutorials/`):

    {
      "type": "branch",                       leaf (default) | branch | embeddedBranch | table | line
      "description": "View",
      "requires": { "DBMS": "DB2", "minVersion": 9.7 },   only show for this DBMS / version / feature / context
      "delayLoad": "true",                    load the branch when it is opened
      "rootDirectory": "./menu/view"          or "branchDirectory": a folder next to this file
    }

A leaf can carry `"actionScript"` (a TE script), `"links"`, `"pageWindows"`, `"floatingPanel"`,
`"JSAction"` or `"tutorial"`; `embeddedBranch` holds `"menus"`; `table` has `"table"` and
`"parameters"`. Other fields: `tag`, `filter`, `GUID`, `menuGUID`, `replacement`,
`reloadOnConnectionChange`, and for database branches `branchSQLXML`, `branchSQLPredicate`,
`branchXML`, `branchXSL`, `onErrorMenu`, `dropParent`.

**Links** open content: `{"type": "action", "parameters": {"action": "listTables"}}`, or
`{"type": "raw", "raw": "<html>"}`, `{"type": "url", "url": "http://..."}`. `target`, `window`
and `windowStage` default to what the requesting menu asks for. A parameter value is used as
given, except these, which are resolved when the menu is built:

    {"$var": "CURRENT_MENU_LOCATION"}       folder of the menu file being loaded
    {"$config": "ACTION_PROCESSOR"}         a server setting
    {"$link": {...}} / {"$pageWindow": {...}}   a nested link or layout

**Page layouts** (`pageWindows`, `preferences/default/*.json`): `{"target": "_active", "title": "...",
"content": <container>}` where a container is a `{"type": "panel", "name": "main", "content":
{"link": {...}}}`, a `{"type": "splitPane", "direction": "v", "panelA": <container>, "panelB":
<container>}` or a `{"type": "stage", ...}`. Panels and windows can have `panelHeaders`.

**TE scripts** (`TEScripts/`, listed in `actionList_*.json`) are stored in the form the front
end's script engine runs (`{"type": "action", "tasks": [...]}`), with version gating under
`"requires"`.

**Script lists** (`js/**/jsList_*.json`): `{"entries": [{"file": "prototype.js"}, {"action":
"getTEScript"}, {"group": "TECore", "entries": [...]}, {"directory": "YUI"}]}`, loaded in order.

Still XML, to be converted as the code that reads them is ported: table definitions,
tutorial scripts (including `TEScripts/Install/*` tutorials), commands, and the `<actionScript>`
files in `TEScripts/`. The tutorials that teach menu writing ("Extending the TE", "Writing
tutorials: building a menu") still show the XML format and will be updated with the tutorials.

### Tests

    npm test

The parity tests replay the requests the console makes and compare the answers with those
recorded from the PHP version, so the port can be shown to behave identically. The XSL menu
tests compare the stylesheet output with what PHP's libxslt produced.

`test/drda.test.js` tests the DRDA client's parts on their own and runs against an Apache
Derby network server (`TE_TEST_DERBY`, default `te:te@localhost:1527/tetest`), started with
users defined, for example a `derby.properties` of

    derby.connection.requireAuthentication=true
    derby.authentication.provider=BUILTIN
    derby.user.te=te

and `java -Dderby.system.home=<folder> -cp derby.jar:derbyshared.jar:derbytools.jar:derbynet.jar
org.apache.derby.drda.NetworkServerControl start -p 1527`. Java is needed only to run this
test server.

`test/vendors.test.js` runs one scenario (transactions, bind values, errors, large results)
against every vendor driver: SQLite always, and PostgreSQL, H2, MySQL/MariaDB and Derby when
their servers answer (`TE_TEST_POSTGRES`, `TE_TEST_H2`, `TE_TEST_MYSQL`, `TE_TEST_DERBY`).

`test/postgres.test.js` runs against a real PostgreSQL server, given as
`TE_TEST_POSTGRES=user:password@host:port/database` (default `te:te@localhost:5432/tetest`);
it is skipped when the server cannot be reached. `test/h2.test.js` does the same for H2
(`TE_TEST_H2`, default `sa:sa@localhost:5435/tetest`); start the server with
`java -cp h2.jar org.h2.tools.Server -pg -ifNotExists -baseDir <folder>` to run it.

### Changes from the PHP behaviour

- Menu requests can no longer read files outside the application folder (`rootCallBack` and
  `baseMenuFolder` were used as file paths without checks).
- The `TOUCH_OVERRIDE` parameter and the caller IDs sent with title bar requests are no longer
  written unescaped into the page's scripts.
- PHP source files, `connectionStore/` and `jar/` are not served as static files.
- Tutorial menu entries get a camel-cased `tutorialName` again; under PHP 8 it came out empty.
- Passwords are never sent to the browser; PHP sent passwords stored in `connStore.xml`
  back in the connection list.
- `executeSQL` returns results containing non-ASCII text; PHP converted them to ISO-8859-1,
  after which its JSON encoding failed and the reply was empty.
- `queryOpt` (the query optimization level) must be a number; PHP added it to the SQL as given.
- PostgreSQL connections with a schema set it with `SET search_path`; PHP sent DB2 statements
  that PostgreSQL rejects. Database menus add `for read only` only for DB2.
- The connection status shows a forced default connection as connected on the first check.
- The MySQL "Monitors" menu shows its entries (its definition named the folder as a
  `branchDirectory` instead of a `rootDirectory`, so it was always empty).
