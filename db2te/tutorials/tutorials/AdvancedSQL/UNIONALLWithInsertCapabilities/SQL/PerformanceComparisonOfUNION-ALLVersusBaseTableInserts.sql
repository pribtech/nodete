%compare 
  title="Insert into UNION-ALL Performance"
  repeat=20
  sql1="insert into txYear values (1,1)" label1="UNION ALL"
  sql2="insert into Q1 values (1,1)" label2="Base Table";