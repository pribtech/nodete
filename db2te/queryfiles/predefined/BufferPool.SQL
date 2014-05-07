
    SELECT 
        t.snapshot_timestamp,
        t.db_name, 
        t.bp_name, 
        t.direct_reads, 
        t.pool_data_l_reads, 
        t.pool_temp_data_l_reads, 
        t.pool_temp_index_l_reads,
        t.pool_data_p_reads, 
        t.pool_index_l_reads, 
        t.pool_index_p_reads, 
        t.pool_temp_data_p_reads, 
        t.pool_temp_index_p_reads, 
        t.pool_async_data_reads, 
        t.pool_async_index_reads, 
        t.direct_writes, 
        t.pool_data_writes, 
        t.pool_index_writes, 
        t.pool_async_data_writes, 
        t.pool_async_index_writes, 
        t.files_closed, 
        t.pool_no_victim_buffer, 
        t.vectored_ios, 
        t.unread_prefetch_pages, 
        t2.bp_cur_buffsz 
      FROM 
        TABLE(SNAP_GET_BP('', -2)) AS T,
        TABLE(
          SELECT 
              bp_name, 
              bp_cur_buffsz 
            FROM 
              table(SNAP_GET_BP_PART('', -2)
          ) as t) AS T2 
      WHERE 
        t.bp_name = t2.bp_name