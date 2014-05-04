-- Create text indexes
CALL SYSTS_CREATE('?SCHEMA?','MYTITLEIDX', '?SCHEMA?.BOOKS(TITLE)'   , '','en_US', ?);
CALL SYSTS_CREATE('?SCHEMA?','MYXMLIDX'  , '?SCHEMA?.BOOKS(BOOKINFO)', '','en_US', ?);

-- Populate text indexes
CALL SYSTS_UPDATE('?SCHEMA?', 'MYTITLEIDX', '', 'en_US', ?);
CALL SYSTS_UPDATE('?SCHEMA?', 'MYXMLIDX'  , '', 'en_US', ?);