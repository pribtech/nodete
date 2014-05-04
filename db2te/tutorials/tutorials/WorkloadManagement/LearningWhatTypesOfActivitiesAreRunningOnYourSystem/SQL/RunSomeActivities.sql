SELECT * FROM SYSCAT.SCHEMATA#
SELECT * FROM SYSCAT.CHECKS#
SELECT * FROM SYSCAT.PROCEDURES#

CREATE TABLE tbl0  (col1 char(10), col2 char(10), col3 int)#
INSERT INTO tbl0 VALUES ('GOUNOT', 'Ontario', 999)#
INSERT INTO tbl0 VALUES ('LEE', 'Quebec', 333)#
UPDATE tbl0 VALUES SET col3 = 1000 WHERE col3 = 999#
DELETE FROM tbl0 WHERE col3 = 1000#
DROP TABLE tbl0#

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