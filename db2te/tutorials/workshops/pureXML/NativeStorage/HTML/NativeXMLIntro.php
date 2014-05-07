
<?php
  $baseDIR = $_POST["BASE_DIR"];
?>
<BR>
<H3>High level view of DB2 native XML support</H3>

<BR>
<P>
DB2 storage component manages both, conventional relational data storage and the new native XML storage. The heart of DB2's native XML support is the XML data type. The XML data type can be
used in a CREATE TABLE statement to define one or more columns of type XML. Tables can contain any
combination of XML columns and relational columns. Though every XML document is logically
associated with a row of a table, XML and relational columns are stored differently. The relational
columns are stored in traditional row structures while the XML data is stored in hierarchical
structures.</p>
<BR>
<img src="<?php echo $baseDIR;?>/HTML/HybridDB2.png" ALT="Hybrid DB2" ALIGN=BOTTOM />

<BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR><BR>
Both types of storage are accessed by the DB2 engine which processes plain SQL, SQL/XML and XQuery in an integrated manner.
Different parsers are used to read SQL and XQuery statements but then a single compiler is used for both languages.
There is no translation from XQuery to SQL. DB2's compiler and optimizer are extended to handle
SQL and XQuery in a single modeling framework.
<BR><BR>

<img src="<?php echo $baseDIR;?>/HTML/XMLandRelationalInDB2.png" ALT="XML and Relational data in DB2" ALIGN=BOTTOM />


