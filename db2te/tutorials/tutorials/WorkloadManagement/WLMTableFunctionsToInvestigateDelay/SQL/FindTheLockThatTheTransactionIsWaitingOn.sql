%prompt 
  title="Transaction Handle"
  text="Enter the transaction handle from the previous output"
  var=txhandle;
%cmd 
  "echo off"
  "db2pd -db sample -locks %[txhandle] wait >out.txt"
  "notepad out.txt"