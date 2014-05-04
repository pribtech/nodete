create table ?SCHEMA?.accounts_second (
    name char(10),
    acctno smallint not null 
           generated always as 
           identity(start with 100, increment by 10))
    ;
    
insert into ?SCHEMA?.accounts_second(name) values
'George',
'Paul',
'Kevin',
'Jim',
'Bert',
'Glen';

select * from ?SCHEMA?.accounts_second;