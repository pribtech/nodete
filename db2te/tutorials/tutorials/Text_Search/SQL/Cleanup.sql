-- Drop all the text indexes
CALL SYSTS_DROP('?SCHEMA?', 'MYTITLEIDX', 'en_US', ?);
CALL SYSTS_DROP('?SCHEMA?', 'MYXMLIDX'  , 'en_US', ?);

-- Disable database for text search
CALL SYSTS_DISABLE('', 'en_US', ?);