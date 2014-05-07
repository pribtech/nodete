CREATE WORK CLASS SET all_class_types
    (WORK CLASS read_wc WORK TYPE READ,
     WORK CLASS write_wc WORK TYPE WRITE,
     WORK CLASS ddl_wc WORK TYPE DDL,
     WORK CLASS call_wc WORK TYPE CALL,
     WORK CLASS load_wc WORK TYPE LOAD,
     WORK CLASS all_wc WORK TYPE ALL POSITION LAST);