-- Create security label component ARRAY to control access to columns of 'credit_card' table by users.
CREATE SECURITY LABEL COMPONENT securityLevel ARRAY ['TOP_SECRET','SECRET','CONFIDENTIAL','PUBLIC'];

-- Create security policy to define who has read or write access to the columns of the table.
CREATE SECURITY POLICY DataAccess COMPONENTS securityLevel WITH DB2LBACRULES;

-- Create security label 'TOP_SECRET' to allow users to access protected data
CREATE SECURITY LABEL DataAccess.TOP_SECRET COMPONENT securityLevel 'TOP_SECRET';

-- Create security label 'SECRET' to allow users to access protected data
CREATE SECURITY LABEL DataAccess.SECRET COMPONENT securityLevel 'SECRET';


