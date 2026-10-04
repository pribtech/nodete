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
this repository; the PHP code is removed once every action has been ported.

### Running

Requires Node.js 20 or later.

    npm install
    TE_SESSION_SECRET=<long random string> npm start

Then open http://localhost:8080/. `PORT` and `HOST` change where it listens.

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
| Connection status (not connected) | Ported |
| Database connections and drivers (DB2, MySQL, PostgreSQL, Oracle, ODBC, SSH) | Next |
| Database-driven and XSL-transformed menus | With the drivers |
| Feed reader, tutorials, ad hoc SQL and the other actions | Later |
| Derby, Hadoop, JDBC_DB2, MQ, JSON_NOSQL_DB2 (needed the PHP Java bridge) | Not planned |

Actions not yet ported answer with `Action "<name>" has not been ported to Node.js yet`.

### Code layout

    server/
      index.js            entry point
      core/               server, config, sessions, request/response, action routing
      actions/            one class per action, in the same folders as db2te/actions/*.php
      encoders/           menu, layout and TE script encoders (from JSONEncodeMenu / JSONEncodeAction)
      pages/              index page, script list, JS constants, templates
      views/              HTML templates
      xml/                XML reading
      drivers/            database driver catalogue
    test/                 tests, with outputs recorded from the PHP version in test/fixtures/php-reference

A new action is a file `server/actions/<noConnection|activeConnection>/<JSON|HTML>/<name>.js`
that default-exports a subclass of `Action` and implements `run()`. It is picked up
automatically; nothing needs registering.

### Tests

    npm test

The parity tests replay the requests the console makes and compare the answers with those
recorded from the PHP version, so the port can be shown to behave identically.

### Changes from the PHP behaviour

- Menu requests can no longer read files outside the application folder (`rootCallBack` and
  `baseMenuFolder` were used as file paths without checks).
- The `TOUCH_OVERRIDE` parameter and the caller IDs sent with title bar requests are no longer
  written unescaped into the page's scripts.
- PHP source files, `connectionStore/` and `jar/` are not served as static files.
- Tutorial menu entries get a camel-cased `tutorialName` again; under PHP 8 it came out empty.
