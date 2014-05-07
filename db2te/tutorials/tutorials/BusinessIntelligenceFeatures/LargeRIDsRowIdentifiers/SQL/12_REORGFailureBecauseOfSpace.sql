DROP tablespace tspace;
CREATE temporary tablespace tspace managed by automatic storage;

call admin_cmd('reorg TABLE ?SCHEMA?.tx_small use tspace');
call admin_cmd('runstats on TABLE ?SCHEMA?.tx_small');

DROP tablespace tspace;
