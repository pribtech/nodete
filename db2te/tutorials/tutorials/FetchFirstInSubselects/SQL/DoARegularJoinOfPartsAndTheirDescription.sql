select P.partno, P.quantity, D.Description 
  from ?SCHEMA?.parts P, ?SCHEMA?.part_description D
where
  p.partno = d.partno;