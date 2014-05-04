    SELECT 
        stmt.snapshot_timestamp, 
        info.appl_name, 
        info.appl_status, 
        info.primary_auth_id, 
        stmt.agent_id, 
        stmt.rows_read, 
        stmt.rows_written, 
        stmt.stmt_type, 
        stmt.stmt_start, 
        stmt.stmt_stop, 
        stmt.stmt_operation, 
        stmt.cursor_name, 
        stmt.section_number, 
        stmt.query_cost_estimate, 
        stmt.query_card_estimate, 
        stmt.stmt_sys_cpu_time_ms, 
        stmt.stmt_usr_cpu_time_ms,
        stmt.package_name,
        stmt.creator 
      FROM 
        table(SNAP_GET_STMT('', -2)) AS STMT, 
        table(SNAP_GET_APPL_INFO('', -2)) AS INFO 
      WHERE 
        STMT.agent_id = INFO.agent_id
        AND stmt.stmt_operation not in ('NONE','STATIC_COMMIT')