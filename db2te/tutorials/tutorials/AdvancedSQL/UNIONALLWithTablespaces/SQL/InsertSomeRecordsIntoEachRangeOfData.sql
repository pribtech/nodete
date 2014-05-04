begin atomic
  declare count_quarter int default 0;
  declare cur_quarter   int default 0;
  declare cur_amt       int default 0;
  declare cur_tx        int default 0;
  declare cur_date      date;
  declare cur_item      char(10);
  declare i             int default 1;
  declare j             int default 0;

  while i <= 10000 do
    set cur_tx = i;
    set cur_quarter = int(rand()*4);
    if (cur_quarter = 4) then 
	set cur_quarter = 0;
    end if;
    set cur_amt = int(rand()*100);
    set j = int(rand()*6);
    if (j = 0) then
      set cur_item = 'X22';
    elseif (j = 1) then
      set cur_item = 'T21';
    elseif (j = 2) then
      set cur_item = 'R31';
    elseif (j = 3) then
      set cur_item = 'A40';
    elseif (j = 4) then
      set cur_item = 'S15';
    elseif (j = 5) then
      set cur_item = 'U01';
    else
      set cur_item = 'Y52';
    end if;
    if (cur_quarter = 0) then
      set cur_date = date('2001-01-01') + (mod(i,89) + 1) days;
      insert into Q1_2001 values (cur_tx, cur_item, cur_amt, cur_date);
    elseif (cur_quarter = 1) then
      set cur_date = date('2001-04-01') + (mod(i,89) + 1) days;
      insert into Q2_2001 values (cur_tx, cur_item, cur_amt, cur_date);
    elseif (cur_quarter = 2) then
      set cur_date = date('2001-07-01') + (mod(i,89) + 1) days;
      insert into Q3_2001 values (cur_tx, cur_item, cur_amt, cur_date);
    elseif (cur_quarter = 3) then
      set cur_date = date('2001-10-01') + (mod(i,89) + 1) days;
      insert into Q4_2001 values (cur_tx, cur_item, cur_amt, cur_date);
    else
    end if;
    set i = i + 1;
  end while;
end#