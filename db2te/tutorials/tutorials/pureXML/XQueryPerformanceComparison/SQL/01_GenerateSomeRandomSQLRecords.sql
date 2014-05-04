CREATE TABLE ?SCHEMA?.postaltxs
  (
  postcode varchar(5),
  custno int,
  custname varchar(10)
  )#

begin atomic
  declare v_custno int default 0;
  declare v_name        varchar(10);
  declare v_postcode    varchar(5);
  declare i             int default 1;
  declare v_start       int default 0;
  declare v_length      int default 0;
  declare name_chars    char(50) default 'ANDESTINGOURARTEDLILOPTISTANDORLOVWERTHEMASTESTIG';
  declare int_chars     char(50) default '9204528117209336273810987635281029836100288736466';

  while i <= 2000 do
    SET v_length       = 5;
    SET v_start        = int(rand()*30) + 1;
    SET v_postcode     = substr(int_chars,v_start,v_length);
    SET v_custno       = i;
    SET v_start        = int(rand()*40) + 1;
    SET v_length       = int(rand()*7) + 3;
    SET v_name         = substr(name_chars,v_start,v_length);

    INSERT into ?SCHEMA?.postaltxs values
      (v_postcode, v_custno, v_name);
    SET i = i + 1;
  end while;
end#
