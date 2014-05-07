-- View authorities granted to the database as the current user
SELECT char(authority, 26) authority, d_user, 
       d_group, d_public,role_user, role_group, 
       role_public, d_role 
  FROM TABLE (AUTH_LIST_AUTHORITIES_FOR_AUTHID (CURRENT USER, 'U')) as T
 WHERE authority='SYSADM' or authority='DBADM';





