create table ?SCHEMA?.show_acctno( acctno int ) ;

insert into ?SCHEMA?.accounts_third(name, acctno) values
    ('Lastone',default);
  insert into ?SCHEMA?.show_acctno values (identity_val_local());

select * from ?SCHEMA?.show_acctno;
select * from ?SCHEMA?.accounts_third;
