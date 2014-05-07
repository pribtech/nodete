CREATE SERVICE CLASS work1_sc;

CREATE WORKLOAD work1_wl 
  APPLNAME('httpd.exe')
  SERVICE CLASS work1_sc;