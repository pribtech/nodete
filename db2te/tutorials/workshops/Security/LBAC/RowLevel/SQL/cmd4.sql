-- Grant security label 'sales_organization' to SECADM pat so that he can alter sales.dailysales table and insert data.
GRANT SECURITY LABEL Sec_Policy.sales_organization TO USER pat FOR ALL ACCESS;