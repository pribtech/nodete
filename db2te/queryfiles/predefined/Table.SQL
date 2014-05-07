SELECT 
	t.snapshot_timestamp, 
	t.tabname, 
	t.tabschema, 
	t.tab_type, 
	t.rows_read, 
    t.rows_written, 
	t.page_reorgs, 
	t.data_object_pages, 
	t.index_object_pages,
	t.tab_file_id,
	t.lob_object_pages,
	t.xda_object_pages,
	t.overflow_accesses,
	t.dbPartitionNum,
  	t.tbsp_id,
	t.data_partition_id,
	ts.TBSPACE,
	ts.BUFFERPOOLID,
	b.BPNAME
FROM table(SNAP_GET_TAB_V91('', -2)) as T
join SYSCAT.TABLESPACES as ts
  on ts.TBSPACEID=t.TBSP_ID
join SYSCAT.BUFFERPOOLS as b
  on b.BUFFERPOOLID=ts.BUFFERPOOLID