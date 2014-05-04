%prompt 
  title="Application causing the lock contention"
  text="Enter the OWNER handle for the application holding the locks"
  var=txhandle;
%cmd 
  "echo off"
  "db2pd -db sample -transactions %[txhandle] >out.txt"
  "notepad out.txt"