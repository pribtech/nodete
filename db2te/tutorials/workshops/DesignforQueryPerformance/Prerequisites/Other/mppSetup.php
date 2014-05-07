<?php
  $baseDIR = $_POST["BASE_DIR"];
?>

<h4>Instance and database setup</h4>
<ol>
<li>Setup a multiple partition processing environment with four nodes as follows :</li>
<ol type='a'>
<li><b>On Windows :</b></li>
<ul type='i'>
<li>Open the <b>DB2 CLP window</b></li>
<li><b>db2icrt  <CODE>MPP</CODE></b> -s <CODE>ese</CODE> -u <CODE>user_name,password</CODE> -r <CODE>50005,50009</CODE></li>
	<ul>
	<li>where <CODE>MPP</CODE> is the instance name</li>
	<li><CODE>ese</CODE> is the DB2 edition being used</li>
	<li><CODE>50005, 50009</CODE> is the starting and ending port number for the instance</li>
	<li>replace the user_name and password accordingly</li>
	</ul>
<li><b>set DB2INSTANCE=MPP</b></li>
<li><b>db2ncrt</b> /n:1 /u:<CODE>user_name,password</CODE> /p:1</li>
<li><b>db2ncrt</b> /n:2 /u:<CODE>user_name,password</CODE> /p:2</li>
<li><b>db2ncrt</b> /n:3 /u:<CODE>user_name,password</CODE> /p:3</li>
<li><b>db2start</b></li>
</ul><br>

<li><b>On Linux/Unix :</b></li>
<BR><h4><B><u><FONT style="COLOR: red">Note :</FONT>Some of the steps might require root permission</u></B></h4><BR>
<ul type='i'>
<li>Open the <b>DB2 terminal</b></li>
<li>Edit the <b>/etc/services</b> file to add the line "<b>DB2_<CODE>instancename</CODE>_END    50009/tcp</b>"  <b>(assuming DB2_instancename_1    50005/tcp)</b></li>
	<ul>
	<li>where <CODE>instancename</CODE> is the name of the user instance or login id</li>
	<li>set the DB2_instancename_END port number, depending on the DB2_instancename_1 value, such that the difference between the end and first port number is '4' (i.e difference between DB2_instancename_END and DB2_instancename_1 is '4')</li>
    </ul>
<li>Open the .rhosts file in the home directory : <b>vi ~/.rhosts</b></li>
<li>Enter the following information in the .rhosts file (if not already present), save and exit : <CODE><b>hostname user_name</b></CODE></li>
	<ul>
	<li>where <CODE>hostname</CODE> is the machine name</li>
	<li>where <CODE>user_name</CODE> is the login id or instance name</li>
    </ul>
<li><b>db2stop</b></li>
<li>Change to directory DB2_install_directory/sqllib</li>
<li>Open <b>vi db2nodes.cfg</b></li>
<li>Enter the following information in the db2nodes.cfg file and save and exit :</li>
<ul>
<li>0 hostname 0</li>
<li>1 hostname 1</li>
<li>2 hostname 2</li>
<li>3 hostname 3</li>
	<ul>
	<li>where <CODE>hostname</CODE> is the machine name</li>
    </ul>
</ul>

<li><b>db2start</b></li>
</li>
</ul>
</ol><br>

<li><b>db2set DB2COMM=TCPIP</b></li>
<li>Run '<b>db2set DB2_COMPATIBILITY_VECTOR=</b>'. This is to ensure that the database is not created in Oracle compatibility mode.</li>
<li><b>db2 terminate</b></li>
<li><b>db2stop</b></li>
<li><b>db2start</b></li>
<li>db2 CREATE DATABASE <CODE>designdb</CODE> ON <code><b>d:\mydbpath</b></code> USING CODESET UTF-8 TERRITORY US PAGESIZE 32 K</li>
	<ul><li><CODE>designdb</CODE> is the database name</li>
	    <li><b>The database will contain about 1.5Gig of data, select a path or file system mount point with sufficient space and replace <code>d:\mydbpath</code> accordingly</b></li>
	</ul>
<li>db2 UPDATE DB CFG FOR <CODE>designdb</CODE> USING LOGSECOND 30</li>
<li>db2 UPDATE DB CFG FOR <CODE>designdb</CODE> USING LOGFILSIZ 2048</li>
<li>db2 UPDATE DBM CFG USING SVCENAME 50005</li>
<li><b>db2stop</b></li>
<li><b>db2start</b></li>

<li>In the DB2 terminal/CLP window:
	<ol type='a'>
	<li>Traverse to the <b>LoadFiles</b> directory that contains the data for the base tables.</li>
	<li>Run <b>db2 -td@ -vf prerequisites.db2 -z prerequisites.out</b>. It creates the tablespaces, db partition groups and base tables with data to be used in the workshop. Fair amount of data is populated into the tables.</li>
	<li>Check prerequisites.out to confirm required database objects are created successfully.</li>
	</ol>
</li><br>

<li>Edit the file <b>Apache_install_directory/conf/httpd.conf on windows</b> or <b>/etc/httpd/conf/httpd.conf (or etc/apache/httpd.conf) on Linux/Unix</b>with '<b>Timeout 100000</b>' or add it as the last line if not already present.</li>
<li><b>Restart Apache</b> for the changes to take effect:</li>
<ul>
<li>On windows: Open the services.msc file from run, find Apache, right click on restart</li>
<li>On linux: Run '/etc/init.d/apache restart' or 'apachectl graceful'</li>
</ul>


<li>From the TE, connect to the database designdb with the following information :
<ol type='a'>
<li>Database: designdb</li>
<li>Hostname: localhost</li>
<li>Port number: 50005</li>
<li>Username/password: as appropriate</li>
</ol>
</li><br>

</ol>
