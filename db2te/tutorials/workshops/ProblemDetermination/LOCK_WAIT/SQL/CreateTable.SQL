DROP TABLE COUNTER@
CREATE TABLE COUNTER(
page_id INT NOT NULL,
counter INT default 0 NOT NULL
)@

INSERT INTO COUNTER VALUES(0,0);