VALUES TO_CHAR(CURRENT TIMESTAMP,'YYYY-MM-DD HH24:MI:SS')
UNION ALL
VALUES VARCHAR_FORMAT(CURRENT TIMESTAMP,'YYYY-MM-DD HH24:MI:SS');