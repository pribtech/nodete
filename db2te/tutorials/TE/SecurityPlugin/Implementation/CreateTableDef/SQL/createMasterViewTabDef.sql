  SELECT 
            DB2AUTH.USERS.USERID AS USERID, 
            DB2AUTH.GROUPS.GROUPID AS GROUPID 
            
    FROM 
            DB2AUTH.USERS 
            FULL OUTER JOIN 
                 (DB2AUTH.GROUP_MEMBERSHIP 
                 RIGHT OUTER JOIN 
                       DB2AUTH.GROUPS 
                 ON 
                       DB2AUTH.GROUPS.GROUPID = DB2AUTH.GROUP_MEMBERSHIP.GROUPID) 
            ON 
                 DB2AUTH.USERS.USERID = DB2AUTH.GROUP_MEMBERSHIP.USERID 
        
ORDER BY    USERID