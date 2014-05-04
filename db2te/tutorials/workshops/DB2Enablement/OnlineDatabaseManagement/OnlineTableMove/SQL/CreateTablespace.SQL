/* Drop tablespace tbs2 */
DROP TABLESPACE tbs2@

/* Drop tablespace tbs3 */
DROP TABLESPACE tbs3@

/* Create the target tablespace tbs2 */
CREATE TABLESPACE tbs2 MANAGED BY AUTOMATIC STORAGE@

/* Create the target tablespace tbs3 */
CREATE TABLESPACE tbs3 MANAGED BY AUTOMATIC STORAGE@

/* Drop the foreign keys before moving the table */
ALTER TABLE ?SCHEMA?.ORDER_DETAILS DROP FOREIGN KEY FK_ORDER@

ALTER TABLE ?SCHEMA?.ORDER_DETAILS DROP FOREIGN KEY FK_PRODUCT@