create table Parts
  (
  partno int not null, 
  quantity int not null
  )
;
insert into Parts values
  (1, 10), (2, 61), (3, 22), (4, 43);
select * from Parts;