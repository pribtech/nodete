begin atomic
  declare v_school_id   int default 0;
  declare v_program_id  int default 0;
  declare v_student_num int default 0;
  declare v_student_id  int default 0;
  declare v_first_name  char(10);
  declare v_last_name   char(10);
  declare v_GPA         decimal(3,2) default 0;
  declare i             int default 1;
  declare name_start    int default 0;
  declare name_length   int default 0;
  declare name_chars    char(50) default 'ANDESTINGOURARTEDLILOPTISTANDORLOVWERTHEMASTESTIG';

  while i <= 100 do
    set v_school_id    = int(rand()*200) + 1;
    set v_program_id   = int(rand()*5) + 1;
    set v_student_num  = int(rand()*35) + 1;
    set v_student_id   = i;
    set name_start     = int(rand()*40) + 1;
    set name_length    = int(rand()*7) + 3;
    set v_first_name   = substr(name_chars,name_start,name_length);
    set name_start     = int(rand()*30) + 1;
    set name_length    = int(rand()*7) + 3;
    set v_last_name    = substr(name_chars,name_start,name_length);
    set v_GPA          = 4.0 * rand();

    insert into students values
      (v_school_id, v_program_id, v_student_num, v_student_id, v_first_name, v_last_name, v_GPA);
    set i = i + 1;
  end while;
end#