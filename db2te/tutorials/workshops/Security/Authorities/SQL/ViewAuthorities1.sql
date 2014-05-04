-- View authorities granted to user Sam 
SELECT char(authority, 26) authority, d_user, 
       d_group, d_public,role_user, role_group, 
       role_public, d_role 
  FROM TABLE (AUTH_LIST_AUTHORITIES_FOR_AUTHID ('SAM', 'U')) as T;





