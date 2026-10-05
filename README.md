The Technology Explorer (TE) is a light weight, web based console for DB2 for Linux, UNIX and Windows. 
It strives to be a teaching tool for all users of DB2. Whether you're just starting to use DB2, 
or have been for years, there are tutorials for you around many aspects of DB2. Part of what makes 
the TE such a great teaching tool is that it doesn't just explain to you how a system should act, 
the Technology Explorer shows you, using your database! The TE has a large number of views that 
show you how your database is actually behaving. All of the views the TE uses to teach you about 
DB2 can be used individually, making the TE a very powerful monitoring tool as well.

Some of the key features of the Technology Explorer are:

    Is a light weight web based platform for interacting with DB2 Linux, UNIX and Windows servers
    Is easily expandable and customizable
    Works with DB2 for Linux, UNIX and Windows Version 9.1, 9.5, 9.7 and 10.1
    Connects to any DB2 data server using only an IP address
    Contains a wealth of content to highlight, demonstrate and teach you about some of DB2's core features 

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

PostgreSQL support is installed with the server. For DB2, also install IBM's driver, which
downloads the DB2 CLI client and builds a native module:

    npm install ibm_db

`ibm_db` is not a dependency of the server because it cannot be built everywhere and its
installer currently pulls in a package with open security advisories. The welcome page
lists each driver and whether it is ready.

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
| DB2 (`ibm_db`), PostgreSQL (`pg`) and Apache H2 drivers | Ported |
| Running SQL (`executeSQL`: ad hoc SQL, scripts and the SQL behind TE pages) | Ported |
| Database-driven and XSL-transformed menus (the object navigator) | Ported |
| MySQL, Oracle, ODBC (solidDB) and SSH drivers | Next |
| Trusted context users, connection profiles, Cloud Foundry `VCAP_SERVICES` connections | Later |
| Feed reader, tutorials, table lists and the other actions | Later |
| Derby, Hadoop, JDBC_DB2, MQ, JSON_NOSQL_DB2 (needed the PHP Java bridge) | Not planned |

The DB2 driver is tested against a stand-in for `ibm_db` that follows its documented API;
it has not yet been run against a DB2 server. The PostgreSQL driver is tested end to end
against a real server.

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
                          base classes, Db2Driver, PostgresDriver, the DriverCatalog
      sql/                executeSQL: SqlBatch runs a request, StatementRunner one statement
      xml/                reads XML definitions (menus from XSL stylesheets, the converter)
    tools/convert/        converts XML definitions and connStore.xml to JSON
    test/                 tests, with outputs recorded from the PHP version in test/fixtures/php-reference

A new action is a file `server/actions/<noConnection|activeConnection>/<JSON|HTML>/<name>.js`
that default-exports a subclass of `Action` and implements `run()`. It is picked up
automatically; nothing needs registering.

A database driver is a subclass of `DatabaseDriver` (opens connections), `DatabaseConnection`
(runs statements, transactions, schema, server information) and `ResultCursor` (reads rows),
added to `DriverCatalog.standardDrivers()`.

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
