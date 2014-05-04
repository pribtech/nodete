-- Violate neither thresholds
SELECT * FROM DEPARTMENT;

-- Violate the "tr_sqlrows" threshold
SELECT * FROM SALES;

-- Violate the "tr_estcost" threshold
SELECT COUNT(*) FROM SYSCAT.TABLES, SYSCAT.TABLES;