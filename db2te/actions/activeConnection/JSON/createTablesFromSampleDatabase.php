<?php
/*******************************************************************************
 *  Copyright IBM Corp. 2007 All rights reserved.
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 *********************************************************************************/

/**
 * Use case: How to use this as an openAction on a tutorial
 	<openAction name="createTablesFromSampleDatabase" type="serverAction">
 		<parameterList>
  		<parameter name="action" type="fixed">
				<value>createTablesFromSampleDatabase</value>
			</parameter>
			<parameter name="schema" type="raw">
				<value>CHEUNGK</value>
			</parameter>
			<parameter name="table[]" type="raw">
				<value>EMPLOYEE</value>
			</parameter>
			<parameter name="table[]" type="raw">
				<value>DEPT</value>
			</parameter>
		</parameterList>
  </openAction>
 *
 */

$schema = getParameter('schema');
$table = getParameter('table');

$returnData = array();

$returndata['returnCode'] = "true";
$returndata['returnValue'] = "";

if($schema != null && $table != null)
{
	$schema = strtolower($schema);
	
	if(is_array($table))
	{
		foreach ($table as $tableName)
		{
			if (!createTableOfSampleDatabase(strtolower($tableName), $schema, $returndata))
				break;	
			
		} 
	}
	else {
		
		createTableOfSampleDatabase(strtolower($table), $schema, $returndata); 	
	}
	
}
else {
	$returndata['returnCode'] = "false";
	$returndata['returnValue'] = 0;
}

function createTableOfSampleDatabase($tableName, $schema, &$returnData){
	
	$tableCreationQuery;
	$tableLoadQuery;
	
	switch ($tableName){
		
		
		case "employee":
			
			$tableCreationQuery = "CREATE TABLE ".$schema.".EMPLOYEE  (EMPNO CHAR(6) NOT NULL ,FIRSTNME VARCHAR(12) NOT NULL , 
			                       MIDINIT CHAR(1) , LASTNAME VARCHAR(15) NOT NULL , WORKDEPT CHAR(3) , PHONENO CHAR(4) , 
		                           HIREDATE DATE , JOB CHAR(8) , EDLEVEL SMALLINT NOT NULL , SEX CHAR(1) , BIRTHDATE DATE , 
		  						   SALARY DECIMAL(9,2) , BONUS DECIMAL(9,2) , COMM DECIMAL(9,2), PRIMARY KEY (EMPNO) )  IN USERSPACE1 ";
			
			$tableLoadQuery = "INSERT INTO ".$schema.".EMPLOYEE VALUES
('000010','CHRISTINE','I','HAAS','A00','3978','1995-01-01','PRES',18,'F','1963-08-24',+0152750.00,+0001000.00,+0004220.00),
('000020','MICHAEL','L','THOMPSON','B01','3476','2003-10-10','MANAGER ',18,'M','1978-02-02',+0094250.00,+0000800.00,+0003300.00),
('000030','SALLY','A','KWAN','C01','4738','2005-04-05','MANAGER ',20,'F','1971-05-11',+0098250.00,+0000800.00,+0003060.00),
('000050','JOHN','B','GEYER','E01','6789','1979-08-17','MANAGER ',16,'M','1955-09-15',+0080175.00,+0000800.00,+0003214.00),
('000060','IRVING','F','STERN','D11','6423','2003-09-14','MANAGER ',16,'M','1975-07-07',+0072250.00,+0000500.00,+0002580.00 ),
('000070','EVA','D','PULASKI','D21','7831','2005-09-30','MANAGER ',16,'F','2003-05-26',+0096170.00,+0000700.00,+0002893.00 ),
('000090','EILEEN','W','HENDERSON','E11','5498','2000-08-15','MANAGER ',16,'F','1971-05-15',+0089750.00,+0000600.00,+0002380.00),
('000100','THEODORE','Q','SPENSER','E21','0972','2000-06-19','MANAGER ',14,'M','1980-12-18',+0086150.00,+0000500.00,+0002092.00),
		('000110','VINCENZO','G','LUCCHESSI','A00','3490','1988-05-16','SALESREP',19,'M','1959-11-05',+0066500.00,+0000900.00,+0003720.00),
('000120','SEAN','O', 'CONNELL','A00','2167','1993-12-05','CLERK',14,'M','1972-10-18',+0049250.00,+0000600.00,+0002340.00 ),
('000130','DELORES','M','QUINTANA','C01','4578','2001-07-28','ANALYST',16,'F','1955-09-15',+0073800.00,+0000500.00,+0001904.00 ),
('000140','HEATHER','A','NICHOLLS','C01','1793','2006-12-15','ANALYST ',18,'F','1976-01-19',+0068420.00,+0000600.00,+0002274.00),
('000150','BRUCE',' ','ADAMSON','D11','4510','2002-02-12','DESIGNER',16,'M','1977-05-17',+0055280.00,+0000500.00,+0002022.00),
('000160','ELIZABETH','R','PIANKA','D11','3782','2006-10-11','DESIGNER',17,'F','1980-04-12',+0062250.00,+0000400.00,+0001780.00 ),
('000170','MASATOSHI','J','YOSHIMURA','D11','2890','1999-09-15','DESIGNER',16,'M','1981-01-05',+0044680.00,+0000500.00,+0001974.00 ),
('000180','MARILYN','S','SCOUTTEN','D11','1682','2003-07-07','DESIGNER',17,'F','1979-02-21',+0051340.00,+0000500.00,+0001707.00 ),
('000190','JAMES','H','WALKER','D11','2986','2004-07-26','DESIGNER',16,'M','1982-06-25',+0050450.00,+0000400.00,+0001636.00 ),
('000200','DAVID',' ','BROWN','D11','4501','2002-03-03','DESIGNER',16,'M','1971-05-29',+0057740.00,+0000600.00,+0002217.00 ),
('000210','WILLIAM','T','JONES','D11','0942','1998-04-11','DESIGNER',17,'M','2003-02-23',+0068270.00,+0000400.00,+0001462.00 ),
('000220','JENNIFER','K','LUTZ','D11','0672','1998-08-29','DESIGNER',18,'F','1978-03-19',+0049840.00,+0000600.00,+0002387.00),
('000230','JAMES','J','JEFFERSON','D21','2094','1996-11-21','CLERK',14,'M','1980-05-30',+0042180.00,+0000400.00,+0001774.00 ),
('000240','SALVATORE','M','MARINO','D21','3780','2004-12-05','CLERK',17,'M','2002-03-31',+0048760.00,+0000600.00,+0002301.00 ),		
('000250','DANIEL','S','SMITH','D21','0961','1999-10-30','CLERK   ',15,'M','1969-11-12',+0049180.00,+0000400.00,+0001534.00),
('000260','SYBIL','P','JOHNSON','D21','8953','2005-09-11','CLERK   ',16,'F','1976-10-05',+0047250.00,+0000300.00,+0001380.00),
('000270','MARIA','L','PEREZ','D21','9001','2006-09-30','CLERK   ',15,'F','2003-05-26',+0037380.00,+0000500.00,+0002190.00 ),
('000280','ETHEL','R','SCHNEIDER','E11','8997','1997-03-24','OPERATOR',17,'F','1976-03-28',+0036250.00,+0000500.00,+0002100.00 ),
('000290','JOHN','R','PARKER','E11','4502','2006-05-30','OPERATOR',12,'M','1985-07-09',+0035340.00,+0000300.00,+0001227.00 ),
('000300','PHILIP','X','SMITH','E11','2095','2002-06-19','OPERATOR',14,'M','1976-10-27',+0037750.00,+0000400.00,+0001420.00 ),
('000310','MAUDE','F','SETRIGHT','E11','3332','1994-09-12','OPERATOR',12,'F','1961-04-21',+0035900.00,+0000300.00,+0001272.00 ),
('000320','RAMLAL','V','MEHTA','E21','9990','1995-07-07','FIELDREP',16,'M','1962-08-11',+0039950.00,+0000400.00,+0001596.00 ),
('000330','WING',' ','LEE','E21','2103','2006-02-23','FIELDREP',14,'M','1971-07-18',+0045370.00,+0000500.00,+0002030.00 ),
('000340','JASON','R','GOUNOT','E21','5698','1977-05-05','FIELDREP',16,'M','1956-05-17',+0043840.00,+0000500.00,+0001907.00 ),
('200010','DIAN','J','HEMMINGER','A00','3978','1995-01-01','SALESREP',18,'F','1973-08-14',+0046500.00,+0001000.00,+0004220.00 ),
('200120','GREG',' ','ORLANDO','A00','2167','2002-05-05','CLERK   ',14,'M','1972-10-18',+0039250.00,+0000600.00,+0002340.00 ),
('200140','KIM','N','NATZ','C01','1793','2006-12-15','ANALYST ',18,'F','1976-01-19',+0068420.00,+0000600.00,+0002274.00 ),
('200170','KIYOSHI',' ','YAMAMOTO','D11','2890','2005-09-15','DESIGNER',16,'M','1981-01-05',+0064680.00,+0000500.00,+0001974.00 ),
('200220','REBA','K','JOHN','D11','0672','2005-08-29','DESIGNER',18,'F','1978-03-19',+0069840.00,+0000600.00,+0002387.00 ),
('200240','ROBERT','M','MONTEVERDE','D21','3780','2004-12-05','CLERK   ',17,'M','1984-03-31',+0037760.00,+0000600.00,+0002301.00 ),
('200280','EILEEN','R','SCHWARTZ','E11','8997','1997-03-24','OPERATOR',17,'F','1966-03-28',+0046250.00,+0000500.00,+0002100.00 ),
('200310','MICHELLE','F','SPRINGER','E11','3332','1994-09-12','OPERATOR',12,'F','1961-04-21',+0035900.00,+0000300.00,+0001272.00 ),
('200330','HELENA',' ','WONG','E21','2103','2006-02-23','FIELDREP',14,'F','1971-07-18',+0035370.00,+0000500.00,+0002030.00 ),
('200340','ROY','R','ALONZO','E21','5698','1997-07-05','FIELDREP',16,'M','1956-05-17',+0031840.00,+0000500.00,+0001907.00 )";
   
		break;
		
		case "department":
			$tableCreationQuery = "CREATE TABLE ".$schema.".DEPARTMENT  (DEPTNO CHAR(3) NOT NULL , DEPTNAME VARCHAR(36) NOT NULL , 
		                           MGRNO CHAR(6) , ADMRDEPT CHAR(3) NOT NULL , LOCATION CHAR(16) )   IN USERSPACE1" ; 
			
			$tableLoadQuery = "INSERT INTO ".$schema.".DEPARTMENT  VALUES 
			('A00','SPIFFY COMPUTER SERVICE DIV.','000010','A00',''),
			('B01','PLANNING','000020','A00',''),
			('C01','INFORMATION CENTER','000030','A00',''),
			('D01','DEVELOPMENT CENTER', null,'A00',''),
			('D11','MANUFACTURING SYSTEMS','000060','D01',''),
			('D21','ADMINISTRATION SYSTEMS','000070','D01',''),
			('E01','SUPPORT SERVICES','000050','A00',''),
			('E11','OPERATIONS','000090','E01',''),
			('E21','SOFTWARE SUPPORT','000100','E01',''),
			('F22','BRANCH OFFICE F2',null,'E01',''),
			('G22','BRANCH OFFICE G2',null,'E01',''),
			('H22','BRANCH OFFICE H2',null,'E01',''),
			('I22','BRANCH OFFICE I2',null,'E01',''),
			('J22','BRANCH OFFICE J2',null,'E01','')";
			
			
		break;
		
		case "act":
			$tableCreationQuery = "CREATE TABLE ".$schema.".ACT (ACTNO SMALLINT NOT NULL , ACTKWD CHAR(6) NOT NULL , 
								   ACTDESC VARCHAR(20) NOT NULL )  IN USERSPACE1" ; 
			
			$tableLoadQuery = "INSERT INTO ".$schema.".ACT  VALUES 
			(10,'MANAGE','MANAGE/ADVISE'),
			(20,'ECOST ','ESTIMATE COST'),
			(30,'DEFINE','DEFINE SPECS'),
			(40,'LEADPR','LEAD PROGRAM/DESIGN'),
			(50,'SPECS ','WRITE SPECS'),
			(60,'LOGIC ','DESCRIBE LOGIC'),
			(70,'CODE  ','CODE PROGRAMS'),
			(80,'TEST  ','TEST PROGRAMS'),
			(90,'ADMQS ','ADM QUERY SYSTEM'),
			(100,'TEACH ','TEACH CLASSES'),
			(110,'COURSE','DEVELOP COURSES'),
			(120,'STAFF ','PERS AND STAFFING'),
			(130,'OPERAT','OPER COMPUTER SYS'),
			(140,'MAINT ','MAINT SOFTWARE SYS'),
			(150,'ADMSYS','ADM OPERATING SYS'),
			(160,'ADMDB ','ADM DATA BASES'),
			(170,'ADMDC ','ADM DATA COMM'),
			(180,'DOC   ','DOCUMENT')";	
				
			break;
			
		case "cl_sched":
			
			$tableCreationQuery = "CREATE TABLE ".$schema. ".CL_SCHED  (CLASS_CODE CHAR(7) , DAY SMALLINT , 
		                           STARTING TIME , ENDING TIME )  IN USERSPACE1" ; 
			
			$tableLoadQuery = "INSERT INTO ".$schema.".CL_SCHED VALUES 
			('042:BF ',4,'12.10.00','14.00.00'),
			('553:MJA',1,'10.30.00','11.00.00'),
			('543:CWM',3,'09.10.00','10.30.00'),
			('778:RES',2,'12.10.00','14.00.00'),
			('044:HD ',3,'17.12.30','18.00.00')";
			
			break;

		case "empprojact":
			$tableCreationQuery = "CREATE TABLE ".$schema.".EMPPROJACT  (EMPNO CHAR(6) NOT NULL , PROJNO CHAR(6) NOT NULL , 
		  						   ACTNO SMALLINT NOT NULL , EMPTIME DECIMAL(5,2) , EMSTDATE DATE , EMENDATE DATE )   
		 						   IN USERSPACE1" ; 
			$tableLoadQuery = "INSERT INTO ".$schema.".EMPPROJACT VALUES 
			('000010','AD3100',10,+000.50,'2002-01-01','2002-07-01'),
('000070','AD3110',10,+001.00,'2002-01-01','2003-02-01'),
('000230','AD3111',60,+001.00,'2002-01-01','2002-03-15'),
('000230','AD3111',60,+000.50,'2002-03-15','2002-04-15'),
('000230','AD3111',70,+000.50,'2002-03-15','2002-10-15'),
('000230','AD3111',80,+000.50,'2002-04-15','2002-10-15'),
('000230','AD3111',180,+000.50,'2002-10-15','2003-01-01'),
('000240','AD3111',70,+001.00,'2002-02-15','2002-09-15'),
('000240','AD3111',80,+001.00,'2002-09-15','2003-01-01'),
('000250','AD3112',60,+001.00,'2002-01-01','2002-02-01'),
('000250','AD3112',60,+000.50,'2002-02-01','2002-03-15'),
('000250','AD3112',60,+001.00,'2003-01-01','2003-02-01'),
('000250','AD3112',70,+000.50,'2002-02-01','2002-03-15'),
('000250','AD3112',70,+001.00,'2002-03-15','2002-08-15'),
('000250','AD3112',70,+000.25,'2002-08-15','2002-10-15'),
('000250','AD3112',80,+000.25,'2002-08-15','2002-10-15'),
('000250','AD3112',80,+000.50,'2002-10-15','2002-12-01'),
('000250','AD3112',180,+000.50,'2002-08-15','2003-01-01'),
('000260','AD3113',70,+000.50,'2002-06-15','2002-07-01'),
('000260','AD3113',70,+001.00,'2002-07-01','2003-02-01'),
('000260','AD3113',80,+001.00,'2002-01-01','2002-03-01'),
('000260','AD3113',80,+000.50,'2002-03-01','2002-04-15'),
('000260','AD3113',180,+000.50,'2002-03-01','2002-04-15'),
('000260','AD3113',180,+001.00,'2002-04-15','2002-06-01'),
('000260','AD3113',180,+001.00,'2002-06-01','2002-07-01'),
('000270','AD3113',60,+000.50,'2002-03-01','2002-04-01'),
('000270','AD3113',60,+001.00,'2002-04-01','2002-09-01'),
('000270','AD3113',60,+000.25,'2002-09-01','2002-10-15'),
('000270','AD3113',70,+000.75,'2002-09-01','2002-10-15'),
('000270','AD3113',70,+001.00,'2002-10-15','2003-02-01'), 
('000270','AD3113',80,+001.00,'2002-01-01','2002-03-01'),
('000270','AD3113',80,+000.50,'2002-03-01','2002-04-01'),
('000030','IF1000',10,+000.50,'2002-06-01','2003-01-01'),
('000130','IF1000',90,+001.00,'2002-10-01','2003-01-01'),
('000130','IF1000',100,+000.50,'2002-10-01','2003-01-01'),
('000140','IF1000',90,+000.50,'2002-10-01','2003-01-01'),
('000030','IF2000',10,+000.50,'2002-01-01','2003-01-01'),
('000140','IF2000',100,+001.00,'2002-01-01','2002-03-01'),
('000140','IF2000',100,+000.50,'2002-03-01','2002-07-01'),
('000140','IF2000',110,+000.50,'2002-03-01','2002-07-01'),
('000140','IF2000',110,+000.50,'2002-10-01','2003-01-01'),
('000010','MA2100',10,+000.50,'2002-01-01','2002-11-01'),
('000110','MA2100',20,+001.00,'2002-01-01','2003-03-01'),
('000010','MA2110',10,+001.00,'2002-01-01','2003-02-01'),
('000200','MA2111',50,+001.00,'2002-01-01','2002-06-15'),
('000200','MA2111',60,+001.00,'2002-06-15','2003-02-01'),
('000220','MA2111',40,+001.00,'2002-01-01','2003-02-01'),
('000150','MA2112',60,+001.00,'2002-01-01','2002-07-15'),
('000150','MA2112',180,+001.00,'2002-07-15','2003-02-01'),
('000170','MA2112',60,+001.00,'2002-01-01','2003-06-01'),
('000170','MA2112',70,+001.00,'2002-06-01','2003-02-01'),
('000190','MA2112',70,+001.00,'2002-01-01','2002-10-01'),
('000190','MA2112',80,+001.00,'2002-10-01','2003-10-01'),
('000160','MA2113',60,+001.00,'2002-07-15','2003-02-01'),
('000170','MA2113',80,+001.00,'2002-01-01','2003-02-01'),
('000180','MA2113',70,+001.00,'2002-04-01','2002-06-15'),
('000210','MA2113',80,+000.50,'2002-10-01','2003-02-01'),
('000210','MA2113',180,+000.50,'2002-10-01','2003-02-01'),
('000050','OP1000',10,+000.25,'2002-01-01','2003-02-01'),
('000090','OP1010',10,+001.00,'2002-01-01','2003-02-01'),
('000280','OP1010',130,+001.00,'2002-01-01','2003-02-01'),
('000290','OP1010',130,+001.00,'2002-01-01','2003-02-01'),
('000300','OP1010',130,+001.00,'2002-01-01','2003-02-01'),
('000310','OP1010',130,+001.00,'2002-01-01','2003-02-01'),
('000050','OP2010',10,+000.75,'2002-01-01','2003-02-01'),
('000100','OP2010',10,+001.00,'2002-01-01','2003-02-01'),
('000320','OP2011',140,+000.75,'2002-01-01','2003-02-01'),
('000320','OP2011',150,+000.25,'2002-01-01','2003-02-01'),
('000330','OP2012',140,+000.25,'2002-01-01','2003-02-01'),
('000330','OP2012',160,+000.75,'2002-01-01','2003-02-01'),
('000340','OP2013',140,+000.50,'2002-01-01','2003-02-01'),
('000340','OP2013',170,+000.50,'2002-01-01','2003-02-01'),
('000020','PL2100',30,+001.00,'2002-01-01','2002-09-15')";


			break;
			
		case "org":
			$tableCreationQuery = "CREATE TABLE ".$schema. ".ORG  (DEPTNUMB SMALLINT NOT NULL , DEPTNAME VARCHAR(14) , 
		  						   MANAGER SMALLINT , DIVISION VARCHAR(10) , LOCATION VARCHAR(13) )  IN USERSPACE1";
			
			$tableLoadQuery = "INSERT INTO ".$schema.".ORG VALUES 
			(10,'Head Office',160,'Corporate','New York'),
(15,'New England',50,'Eastern','Boston'),
(20,'Mid Atlantic',10,'Eastern','Washington'),
(38,'South Atlantic',30,'Eastern','Atlanta'),
(42,'Great Lakes',100,'Midwest','Chicago'),
(51,'Plains',140,'Midwest','Dallas'),
(66,'Pacific',270,'Western','San Francisco'),
(84,'Mountain',290,'Western','Denver')";
		
		break;
		
		case "projact":
			$tableCreationQuery = "CREATE TABLE ".$schema.".PROJACT  (PROJNO CHAR(6) NOT NULL , ACTNO SMALLINT NOT NULL , 
		  						   ACSTAFF DECIMAL(5,2) , ACSTDATE DATE NOT NULL , ACENDATE DATE )IN USERSPACE1" ; 
			
			$tableLoadQuery = "INSERT INTO ".$schema.".PROJACT (PROJNO , ACTNO , ACSTDATE ) VALUES 
			('AD3100',10,'2002-01-01'),
('AD3110',10,'2002-01-01'),
('AD3111',60,'2002-01-01'),
('AD3111',60,'2002-03-15'),
('AD3111',70,'2002-03-15'),
('AD3111',80,'2002-04-15'),
('AD3111',180,'2002-10-15'),
('AD3111',70,'2002-02-15'),
('AD3111',80,'2002-09-15'),
('AD3112',60,'2002-01-01'),
('AD3112',60,'2002-02-01'),
('AD3112',60,'2003-01-01'),
('AD3112',70,'2002-02-01'),
('AD3112',70,'2002-03-15'),
('AD3112',70,'2002-08-15'),
('AD3112',80,'2002-08-15'),
('AD3112',80,'2002-10-15'),
('AD3112',180,'2002-08-15'),
('AD3113',70,'2002-06-15'),
('AD3113',70,'2002-07-01'),
('AD3113',80,'2002-01-01'),
('AD3113',80,'2002-03-01'),
('AD3113',180,'2002-03-01'),
('AD3113',180,'2002-04-15'),
('AD3113',180,'2002-06-01'),
('AD3113',60,'2002-03-01'),
('AD3113',60,'2002-04-01'),
('AD3113',60,'2002-09-01'),
('AD3113',70,'2002-09-01'),
('AD3113',70,'2002-10-15'),
('IF1000',10,'2002-06-01'),
('IF1000',90,'2002-10-01'),
('IF1000',100,'2002-10-01'),
('IF2000',10,'2002-01-01'),
('IF2000',100,'2002-01-01'),
('IF2000',100,'2002-03-01'),
('IF2000',110,'2002-03-01'),
('IF2000',110,'2002-10-01'),
('MA2100',10,'2002-01-01'),
('MA2100',20,'2002-01-01'),
('MA2110',10,'2002-01-01'),
('MA2111',50,'2002-01-01'),
('MA2111',60,'2002-06-15'),
('MA2111',40,'2002-01-01'),
('MA2112',60,'2002-01-01'),
('MA2112',180,'2002-07-15'),
('MA2112',70,'2002-06-01'),
('MA2112',70,'2002-01-01'),
('MA2112',80,'2002-10-01'),
('MA2113',60,'2002-07-15'),
('MA2113',80,'2002-01-01'),
('MA2113',70,'2002-04-01'),
('MA2113',80,'2002-10-01'),
('MA2113',18,'2002-10-01'),
('OP1000',10,'2002-01-01'),
('OP1010',10,'2002-01-01'),
('OP1010',130,'2002-01-01'),
('OP2010',10,'2002-01-01'),
('OP2011',140,'2002-01-01'),
('OP2011',150,'2002-01-01'),
('OP2012',140,'2002-01-01'),
('OP2012',160,'2002-01-01'),
('OP2013',140,'2002-01-01'),
('OP2013',170,'2002-01-01'),
('PL2100',30,'2002-01-01')";

	
		break;
		
		case "project":
			$tableCreationQuery = "CREATE TABLE ".$schema.".PROJECT  (PROJNO CHAR(6) NOT NULL , PROJNAME VARCHAR(24) NOT NULL WITH DEFAULT '', 								   DEPTNO CHAR(3) NOT NULL , RESPEMP CHAR(6) NOT NULL ,PRSTAFF DECIMAL(5,2) , PRSTDATE DATE , 
			                       PRENDATE DATE , MAJPROJ CHAR(6) )   IN USERSPACE1" ; 
			
			$tableLoadQuery = "INSERT INTO ".$schema.".PROJECT VALUES 
			('AD3100','ADMIN SERVICES','D01','000010',+006.50,'2002-01-01','2003-02-01',''),
('AD3110','GENERAL ADMIN SYSTEMS','D21','000070',+006.00,'2002-01-01','2003-02-01','AD3100'),
('AD3111','PAYROLL PROGRAMMING','D21','000230',+002.00,'2002-01-01','2003-02-01','AD3110'),
('AD3112','PERSONNEL PROGRAMMING','D21','000250',+001.00,'2002-01-01','2003-02-01','AD3110'),
('AD3113','ACCOUNT PROGRAMMING','D21','000270',+002.00,'2002-01-01','2003-02-01','AD3110'),
('IF1000','QUERY SERVICES','C01','000030',+002.00,'2002-01-01','2003-02-01',''),
('IF2000','USER EDUCATION','C01','000030',+001.00,'2002-01-01','2003-02-01',''),
('MA2100','WELD LINE AUTOMATION','D01','000010',+012.00,'2002-01-01','2003-02-01',''),
('MA2110','W L PROGRAMMING','D11','000060',+009.00,'2002-01-01','2003-02-01','MA2100'),
('MA2111','W L PROGRAM DESIGN','D11','000220',+002.00,'2002-01-01','1982-12-01','MA2110'),
('MA2112','W L ROBOT DESIGN','D11','000150',+003.00,'2002-01-01','1982-12-01','MA2110'),
('MA2113','W L PROD CONT PROGS','D11','000160',+003.00,'2002-02-15','1982-12-01','MA2110'),
('OP1000','OPERATION SUPPORT','E01','000050',+006.00,'2002-01-01','2003-02-01',''),
('OP1010','OPERATION','E11','000090',+005.00,'2002-01-01','2003-02-01','OP1000'),
('OP2000','GEN SYSTEMS SERVICES','E01','000050',+005.00,'2002-01-01','2003-02-01',''),
('OP2010','SYSTEMS SUPPORT','E21','000100',+004.00,'2002-01-01','2003-02-01','OP2000'),
('OP2011','SCP SYSTEMS SUPPORT','E21','000320',+001.00,'2002-01-01','2003-02-01','OP2010'),
('OP2012','APPLICATIONS SUPPORT','E21','000330',+001.00,'2002-01-01','2003-02-01','OP2010'),
('OP2013','DB/DC SUPPORT','E21','000340',+001.00,'2002-01-01','2003-02-01','OP2010'),
('PL2100','WELD LINE PLANNING','B01','000020',+001.00,'2002-01-01','2002-09-15','MA2100')";


		break;
		
		case "sales":
			$tableCreationQuery = "CREATE TABLE ".$schema.".SALES  (SALES_DATE DATE , SALES_PERSON VARCHAR(15) , 
		                           REGION VARCHAR(15) , SALES INTEGER ) IN USERSPACE1" ; 
			
			$tableLoadQuery = "INSERT INTO ".$schema.".SALES VALUES
			('2005-12-31','LUCCHESSI','Ontario-South',1),
('2005-12-31','LEE','Ontario-South',3),
('2005-12-31','LEE','Quebec',1),
('2005-12-31','LEE','Manitoba',2),
('2005-12-31','GOUNOT','Quebec',1),
('2006-03-29','LUCCHESSI','Ontario-South',3),
('2006-03-29','LUCCHESSI','Quebec',1),
('2006-03-29','LEE','Ontario-South',2),
('1996-03-29','LEE','Ontario-North',2),
('2006-03-29','LEE','Quebec',3),
('2006-03-29','LEE','Manitoba',5),
('2006-03-29','GOUNOT','Ontario-South',3),
('2006-03-29','GOUNOT','Quebec',1),
('2006-03-29','GOUNOT','Manitoba',7),
('2006-03-30','LUCCHESSI','Ontario-South',1),
('2006-03-30','LUCCHESSI','Quebec',2),
('2006-03-30','LUCCHESSI','Manitoba',1),
('2006-03-30','LEE','Ontario-South',7),
('2006-03-30','LEE','Ontario-North',3),
('2006-03-30','LEE','Quebec',7),
('2006-03-30','LEE','Manitoba',4),
('2006-03-30','GOUNOT','Ontario-South',2),
('2006-03-30','GOUNOT','Quebec',18),
('2006-03-31','GOUNOT','Manitoba',1),
('2006-03-31','LUCCHESSI','Manitoba',1),
('2006-03-31','LEE','Ontario-South',14),
('2006-03-31','LEE','Ontario-North',3),
('2006-03-31','LEE','Quebec',7),
('2006-03-31','LEE','Manitoba',3),
('2006-03-31','GOUNOT','Ontario-South',2),
('2006-03-31','GOUNOT','Quebec',1),
('2006-04-01','LUCCHESSI','Ontario-South',3),
('2006-04-01','LUCCHESSI','Manitoba',1),
('2006-04-01','LEE','Ontario-South',8),
('2006-04-01','LEE','Ontario-North',NULL),
('2006-04-01','LEE','Quebec',8),
('2006-04-01','LEE','Manitoba',9),
('2006-04-01','GOUNOT','Ontario-South',3),
('2006-04-01','GOUNOT','Ontario-North',1),
('2006-04-01','GOUNOT','Quebec',3),
('2006-04-01','GOUNOT','Manitoba',7)";

			
			break;

		case "staff":
			$tableCreationQuery = "CREATE TABLE ".$schema.".STAFF  (ID SMALLINT NOT NULL ,NAME VARCHAR(9) , DEPT SMALLINT , 
		  						   JOB CHAR(5) , YEARS SMALLINT , SALARY DECIMAL(7,2) , COMM DECIMAL(7,2) )  IN USERSPACE1" ; 
			
			$tableLoadQuery = "INSERT INTO ".$schema.".STAFF VALUES
			(10,'Sanders',20,'Mgr  ',7,+98357.50,NULL),
(20,'Pernal',20,'Sales',8,+78171.25,+00612.45),
(30,'Marenghi',38,'Mgr  ',5,+77506.75,NULL),
(40,'O Brien',38,'Sales',6,+78006.00,+00846.55),
(50,'Hanes',15,'Mgr  ',10,+80659.80,NULL),
(60,'Quigley',38,'Sales',NULL,+66808.30,+00650.25),
(70,'Rothman',15,'Sales',7,+76502.83,+01152.00),
(80,'James',20,'Clerk',NULL,+43504.60,+00128.20),
(90,'Koonitz',42,'Sales',6,+38001.75,+01386.70),
(100,'Plotz',42,'Mgr  ',7,+78352.80,NULL),
(110,'Ngan',15,'Clerk',5,+42508.20,+00206.60),
(120,'Naughton',38,'Clerk',NULL,+42954.75,+00180.00),
(130,'Yamaguchi',42,'Clerk',6,+40505.90,+00075.60),
(140,'Fraye',51,'Mgr  ',6,+91150.00,NULL),
(150,'Williams',51,'Sales',6,+79456.50,+00637.65),
(160,'Molinare',10,'Mgr  ',7,+82959.20,NULL),
(170,'Kermisch',15,'Clerk',4,+42258.50,+00110.10),
(180,'Abrahams',38,'Clerk',3,+37009.75,+00236.50),
(190,'Sneider',20,'Clerk',8,+34252.75,+00126.50),
(200,'Scoutten',42,'Clerk',NULL,+41508.60,+00084.20),
(210,'Lu',10,'Mgr  ',10,+90010.00,NULL),
(220,'Smith',51,'Sales',7,+87654.50,+00992.80),
(230,'Lundquist',51,'Clerk',3,+83369.80,+00189.65),
(240,'Daniels',10,'Mgr  ',5,+79260.25,NULL),
(250,'Wheeler',51,'Clerk',6,+74460.00,+00513.30),
(260,'Jones',10,'Mgr  ',12,+81234.00,NULL),
(270,'Lea',66,'Mgr  ',9,+88555.50,NULL),
(9280,'Wilson',66,'Sales',9,+78674.50,+00811.50),
(290,'Quill',84,'Mgr  ',10,+89818.00,NULL),
(300,'Davis',84,'Sales',5,+65454.50,+00806.10),
(310,'Graham',66,'Sales',13,+71000.00,+00200.30),
(320,'Gonzales',66,'Sales',4,+76858.20,+00844.00),
(330,'Burke',66,'Clerk',1,+49988.00,+00055.50),
(340,'Edwards',84,'Sales',7,+67844.00,+01285.00),
(350,'Gafney',84,'Clerk',5,+43030.50,+00188.00)";

			
			break;
			
		default:
			$tableCreationQuery = false;
		break;
	}
	
	if ($tableCreationQuery != false){	
			
		$statement1 = connectionManager::getNewStatement($tableCreationQuery);	
		
		if($statement1->errorMsg() == "" && $tableLoadQuery != false){
			
			$statement2 = connectionManager::getNewStatement ($tableLoadQuery);
			
			if ($statement2->errorMsg() == ""){	
				$returnData['returnCode'] = "true";
				$returnData['returnValue'] = 1;	
			return true;
			}
			else {
				$returnData['returnCode'] = $statement2->sqlstate;
				$returnData['returnValue'] = $statement2->sqlerror;
				return false;
			}
		}
		else {
			$returnData['returnCode'] = $statement1->sqlstate;
			$returnData['returnValue'] = $statement1->sqlerror;
			return false;
		}
	}
	else {
		$returnData['returnCode'] = "false";
		$returnData['returnValue'] = 0;	
		return true;
	}		
}


echo json_encode($returndata);	


?>
