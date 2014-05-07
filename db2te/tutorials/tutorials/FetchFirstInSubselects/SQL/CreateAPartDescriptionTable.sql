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