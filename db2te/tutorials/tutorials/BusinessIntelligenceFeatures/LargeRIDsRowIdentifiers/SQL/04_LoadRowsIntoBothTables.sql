#
begin atomic
  declare i int default 0;

  while i <= 10000 do
    INSERT into ?SCHEMA?.TX_SMALL values (i);
    INSERT into ?SCHEMA?.TX_LARGE values (i);
    SET i = i + 1;
  end while;
end;