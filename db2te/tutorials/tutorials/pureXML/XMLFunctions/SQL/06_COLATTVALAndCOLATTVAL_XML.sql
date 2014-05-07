WITH ?SCHEMA?.RESUMES(EMPNO, RESUME_XML) AS
 (
  values 
   (cast (1234 as int),
  cast ('<resume>A resume from someone</resume>'  as varchar(3500)) )
  )
SELECT REC2XML (1.0, 'COLATTVAL_XML','row', EMPNO, RESUME_XML) FROM ?SCHEMA?.RESUMES