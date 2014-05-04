#
CREATE TABLE ?SCHEMA?.tempMDC
   (
   empno int,
   dept int,
   div int
   )
 
#
begin atomic
  declare i int default 0;

  while i < 10000 do
    insert into ?SCHEMA?.tempMDC values
       (
       i,
       int(rand()*5)+1,
       int(rand()*10)+1
       );
    set i = i + 1;
  end while;
end

#
SELECT * FROM ?SCHEMA?.tempMDC
