begin atomic
  declare v_school_id   int default 0;
  declare v_class_id    int default 0;
  declare v_student_num int default 0;
  declare v_student_id  int default 0;
  declare v_first_name  char(10);
  declare v_last_name   char(10);
  declare v_GPA         decimal(3,2) default 0;
  declare i_sch         int default 1;
  declare i_class       int default 1;
  declare i_stud        int default 1;
  declare name_start    int default 0;
  declare name_length   int default 0;
  declare name_chars    char(50) default 'ANDESTINGOURARTEDLILOPTISTANDORLOVWERTHEMASTESTIG';

  set i_sch = 1;
  while i_sch <= 5 do
    set i_class = 1;
    while i_class <= 10 do
      set i_stud = 1;
      while i_stud <= 20 do
        set v_school_id    = i_sch;
	set v_class_id     = i_class;
    	set v_student_num  = I_stud;
        set v_student_id   = (i_sch - 1) * 5 + (i_class - 1) * 10 + i_stud;
        set name_start     = int(rand()*40) + 1;
        set name_length    = int(rand()*7) + 3;
        set v_first_name   = substr(name_chars,name_start,name_length);
        set name_start     = int(rand()*30) + 1;
        set name_length    = int(rand()*7) + 3;
        set v_last_name    = substr(name_chars,name_start,name_length);
        set v_GPA          = 4.0 * rand();

        insert into STUDENTS_NEW values
          (v_school_id, v_class_id, v_student_num, v_student_id, v_first_name, v_last_name, v_GPA);
        set i_stud = i_stud + 1;
      end while;
      set i_class = i_class + 1;      
    end while;
    set i_sch = i_sch + 1;
  end while;
end#