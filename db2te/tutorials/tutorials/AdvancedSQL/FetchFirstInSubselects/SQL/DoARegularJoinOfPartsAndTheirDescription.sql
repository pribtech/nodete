select P.partno, D.Description 
  from parts P, part_description D
where
  p.partno = d.partno;