select authority 
	from table(sysproc.auth_list_authorities_for_authid( ?,'U')) 
	where d_user = 'Y' or d_group = 'Y' or d_public = 'Y' or role_user = 'Y' or role_group = 'Y' or role_public = 'Y' or d_role = 'Y'
