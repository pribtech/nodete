SELECT * FROM org#
SELECT * FROM employee#
SELECT * FROM sales#

INSERT INTO org VALUES (99, 'WLM Team', 831, 'Northern', 'Canada')#
INSERT INTO sales VALUES(current date, 'GOUNOT', 'Ontario', 999)#
UPDATE org SET deptnumb = 999 WHERE deptnumb = 99#
UPDATE sales SET sales = 1000 WHERE sales = 999#
delete FROM org WHERE deptnumb = 999#
delete FROM sales WHERE sales = 1000#

CREATE TABLE tbl1  (col1 int, col2 char(10), col3 int)#
CREATE UNIQUE INDEX indx1 on tbl1(col1, col2)#
alter TABLE tbl1 ADD CONSTRAINT cons1 check (col1 > 0)#
DROP INDEX indx1#
DROP TABLE tbl1#

CREATE PROCEDURE stp7 
    LANGUAGE SQL 
    DYNAMIC RESULT SETS 1 
    BEGIN DECLARE callstmt varchar(2000); 
        DECLARE callselect_cur CURSOR WITH RETURN TO CALLER FOR s1; 
        SET callstmt = 'SELECT count(c.parm_count) 
                        FROM sysibm.sysTABLEs as A, 
                             sysibm.sysTABLEspaces as B, 
                             sysibm.sysroutines as C'; 
        PREPARE s1 FROM callstmt; 
        OPEN callselect_cur; 
    end#
CREATE PROCEDURE stp8 LANGUAGE SQL BEGIN CALL stp7; end#
CREATE PROCEDURE stp9 LANGUAGE SQL BEGIN CALL stp8; end#
CREATE PROCEDURE stp10 LANGUAGE SQL BEGIN CALL stp9; end#
CALL stp10#

DROP PROCEDURE stp10#
DROP PROCEDURE stp9#
DROP PROCEDURE stp8#
DROP PROCEDURE stp7#