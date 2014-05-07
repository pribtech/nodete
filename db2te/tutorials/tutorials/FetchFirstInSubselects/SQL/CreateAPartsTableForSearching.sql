create table ?SCHEMA?.Parts
  (
  partno int not null, 
  quantity int not null
  )
;
insert into ?SCHEMA?.Parts values
  (1, 10), (2, 61), (3, 22), (4, 43);
select * from ?SCHEMA?.Parts;

create table ?SCHEMA?.Part_Description
  (
  partno int not null,
  description varchar(30)
  )
;
insert into ?SCHEMA?.Part_Description values
  (1,'Wood Screws'),
  (1,'Metal Screws'),
  (2,'Bolts'),
  (3,'Nuts');
select * from ?SCHEMA?.Part_Description;