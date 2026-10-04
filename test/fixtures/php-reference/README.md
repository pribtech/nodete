Outputs recorded from the original PHP application, used by the parity tests.

Recorded with PHP 8.3 (`php -S` in `db2te/`) against the same `db2te/` content, with no
database connection. The `.json` menu files are the raw `action.php?action=menu` responses
(`(<json>)`), `getTEScript.js` is `action.php?action=getTEScript`, `jsConstants.txt` and
`layout_*.json` are taken from `index.php`, and `layout_features.json` is PHP's
`JSONEncodeMenu::encodePageWindowFromString()` applied to `../layout-features.xml`.

Re-record them only if the XML content under `db2te/` changes; they define the expected
behaviour of the Node.js server.
