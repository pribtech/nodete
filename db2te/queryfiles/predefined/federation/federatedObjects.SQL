SELECT to1.tabschema, to1.tabname, t.card, w.wrapname AS Wrapper,
s.SERVERNAME, s.SERVERTYPE, s.SERVERVERSION,
       VARCHAR(to2.setting) AS remote_schema, VARCHAR(to3.setting) AS
remote_table

from
syscat.wrappers w
inner join         syscat.servers s      ON w.wrapname = s.wrapname
inner join         syscat.taboptions to1 ON s.SERVERNAME = VARCHAR
(to1.setting) AND to1.option = 'SERVER'
inner join         syscat.taboptions to2 ON to1.tabschema = to2.tabschema
AND to1.tabname = to2.tabname AND to2.option = 'REMOTE_SCHEMA'
inner join         syscat.taboptions to3 ON to1.tabschema = to3.tabschema
AND to1.tabname = to3.tabname AND to3.option = 'REMOTE_TABLE'
inner join         syscat.tables t       ON to1.tabschema = t.tabschema AND
to1.tabname = t.tabname
;