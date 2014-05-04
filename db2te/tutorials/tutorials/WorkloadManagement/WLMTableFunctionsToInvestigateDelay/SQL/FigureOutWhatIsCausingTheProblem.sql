%cmd 
  "echo off"
  "db2pd -db sample -transactions app=%[procID] >out.txt"
  "notepad out.txt"