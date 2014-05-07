-- Create Security label component
CREATE SECURITY LABEL COMPONENT Sec_Comp 
TREE ('SALES_ORGANIZATION' ROOT,
      'CENTRAL' UNDER 'SALES_ORGANIZATION', 
      'COASTAL' UNDER 'SALES_ORGANIZATION', 
      'EAST' UNDER 'COASTAL',
      'WEST' UNDER 'COASTAL',
      'NORTH' UNDER 'CENTRAL',
      'SOUTH' UNDER 'CENTRAL');

-- Create security label
CREATE SECURITY POLICY Sec_Policy COMPONENTS Sec_Comp WITH DB2LBACRULES;

-- Create security label
CREATE SECURITY LABEL Sec_Policy.EAST COMPONENT Sec_Comp 'EAST';

-- Create security label
CREATE SECURITY LABEL Sec_Policy.WEST COMPONENT Sec_Comp 'WEST';

-- Create security label
CREATE SECURITY LABEL Sec_Policy.NORTH COMPONENT Sec_Comp 'NORTH';

-- Create security label
CREATE SECURITY LABEL Sec_Policy.SOUTH COMPONENT Sec_Comp 'SOUTH';

-- Create security label
CREATE SECURITY LABEL Sec_Policy.CENTRAL COMPONENT Sec_Comp 'CENTRAL';

-- Create security label
CREATE SECURITY LABEL Sec_Policy.COASTAL COMPONENT Sec_Comp 'COASTAL';

-- Create security label
CREATE SECURITY LABEL Sec_Policy.SALES_ORGANIZATION COMPONENT Sec_Comp 'SALES_ORGANIZATION';
