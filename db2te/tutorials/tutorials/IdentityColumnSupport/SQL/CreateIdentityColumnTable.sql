create table ?SCHEMA?.accounts (
    name char(10),
    acctno smallint not null 
           generated always as identity)
    ;
    
insert into ?SCHEMA?.accounts(name) values
'George',
'Paul',
'Kevin',
'Jim',
'Bert',
'Glen';

select * from ?SCHEMA?.accounts;