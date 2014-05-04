
    SELECT 
        info.snapshot_timestamp, 
        info.appl_name, 
        info.appl_status, 
        info.agent_id, 
        appl.locks_held, 
        lockw.agent_id_holding_lk, 
        lockw.lock_name, 
        lockw.lock_mode, 
        lockw.lock_object_type, 
        lock.lock_status, 
        lock.lock_count, 
        lockw.tbsp_name 
      FROM 
        table(SNAP_GET_APPL('', -2)) as APPL 
          LEFT OUTER JOIN 
        table(SNAP_GET_APPL_INFO('', -2)) as INFO 
          ON 
            APPL.agent_id = INFO.agent_id 
              LEFT OUTER JOIN 
            table(SNAP_GET_LOCKWAIT('', -2)) as LOCKW 
              ON 
                APPL.agent_id = LOCKW.agent_id 
                  LEFT OUTER JOIN 
                table(SNAP_GET_LOCK('', -2)) as LOCK 
                  ON 
                    APPL.agent_id = LOCK.agent_id