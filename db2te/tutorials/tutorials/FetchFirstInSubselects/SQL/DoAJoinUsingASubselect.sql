select P.Partno, D1.Description from ?SCHEMA?.Parts P, ?SCHEMA?.Part_Description D1
  where 
    D1.partno = P.Partno and
    P.Partno = 
      (select D2.Partno from ?SCHEMA?.part_description D2 where 
              D2.description like '%Screw%');