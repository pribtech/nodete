/**
 * The optional DB2 features TE menus test for (requires.feature), found by querying the
 * catalog (PHP Connection_IBM_DB2::$features and setFeatures).
 */
export class Db2Features {
	/** TE feature keyword and the SQL that returns a row when the server has it. */
	static QUERIES = Object.freeze({
		monitor: "SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'mon_act_metrics' and value <> ''",
		baseMonitors: "SELECT 1 FROM (values(1)) where not exists(SELECT 1 FROM SYSIBMADM.DBMCFG  WHERE NAME LIKE 'dft_mon%' and Value='OFF')",
		hadr: "SELECT 1 FROM SYSIBMADM.DBCFG WHERE NAME = 'hadr_local_host' and value <> ''",
		asn: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'ASN'",
		mq: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'DB2MQ'    AND TABNAME = 'MQHOST'",
		optProfile: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 'SYSTOOLS' AND TABNAME = 'OPT_PROFILE'",
		TEMon: "SELECT 1 FROM SYSCAT.TABLES WHERE TABSCHEMA = 's#db2mc'  AND TABNAME = 'MONITOR_CONTROL'",
	});

	static LICENSED = "SELECT FEATURE_NAME,FEATURE_FULLNAME FROM SYSIBMADM.ENV_FEATURE_INFO where LICENSE_INSTALLED='Y' FOR READ ONLY";

	/** @param {import('./DatabaseConnection.js').DatabaseConnection} connection */
	static async read(connection) {
		const features = {};
		for (const [keyword, sql] of Object.entries(Db2Features.QUERIES)) {
			try {
				features[keyword] = (await connection.rows(sql)).length > 0;
			} catch (error) {
				throw new Error(`Error Set feature ${keyword} sqlstate: ${error.sqlstate} error: ${error.message} sql: ${sql}`, { cause: error });
			}
		}
		for (const [key, fullName] of await connection.rows(Db2Features.LICENSED)) features[key] = fullName;
		return features;
	}
}
