<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010-20012 All rights reserved.

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

      http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
  
-->
<xsl:param name="title"/>
<xsl:param name="type"/>
<xsl:param name="table"/>
<xsl:param name="schema"/>
<xsl:param name="heading"/>
<xsl:param name="delimiter">@</xsl:param>
<xsl:param name="newLine"><xsl:text>&#xa;</xsl:text></xsl:param>
<xsl:param name="tab"><xsl:text>&#x9;</xsl:text></xsl:param>
<xsl:param name="space"><xsl:text>&#x20;</xsl:text></xsl:param>
<xsl:param name="spaceNoBreak"><xsl:text>&#xa0;</xsl:text></xsl:param>
<xsl:param name="databaseDBMS"/>
<xsl:param name="databaseVersion"/>
<xsl:param name="databaseFixpak"/>
<xsl:param name="to"/>
<xsl:param name="grantee">group agroup</xsl:param>

<xsl:template match="/">
	<xsl:choose>
		<xsl:when test="$title = ''">
-- generated script (v1): <xsl:value-of select="count(differences/row)"/> statements, Schema: <xsl:value-of select="$schema"/> table: <xsl:value-of select="$table"/> Type: <xsl:value-of select="$type"/> DBMS: <xsl:value-of select="$databaseDBMS"/> Version: <xsl:value-of select="$databaseVersion"/> 
		</xsl:when>
		<xsl:when test="$title = 'no'"></xsl:when>
		<xsl:otherwise>
			<xsl:choose>
				<xsl:when test="$type = 'html'">&lt;h1&gt;<xsl:value-of select="$title"/>&lt;/h1&gt;<xsl:value-of select="$newLine"/></xsl:when>
				<xsl:when test="$type = 'xml'">&lt;query&gt;<xsl:value-of select="$title"/>&lt;/query&gt;<xsl:value-of select="$newLine"/></xsl:when>
				<xsl:otherwise><xsl:value-of select="$title"/><xsl:value-of select="$newLine"/></xsl:otherwise>
			</xsl:choose>
		</xsl:otherwise>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="$type = 'html'">&lt;table&gt;</xsl:when>
		<xsl:when test="$type = 'xml'">&lt;<xsl:value-of select="$table"/>s&gt;</xsl:when>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="$heading = 'column' and $type='csv'">
			<xsl:for-each select="/differences/columns/column"><xsl:value-of select="@name"></xsl:value-of><xsl:if test="not(position()=last())"> , </xsl:if></xsl:for-each><xsl:value-of select="$newLine"/>
		</xsl:when>
		<xsl:when test="$heading = 'column' and $type='csvTab'">
			<xsl:for-each select="/differences/columns/column"><xsl:value-of select="@name"></xsl:value-of><xsl:if test="not(position()=last())"><xsl:value-of select="$tab"/></xsl:if></xsl:for-each><xsl:value-of select="$newLine"/>
		</xsl:when>
		<xsl:when test="$heading = 'column' and $type='html'">
&lt;tr&gt;<xsl:for-each select="/differences/columns/column">&lt;th&gt;<xsl:value-of select="@name"/>&lt;/th&gt;</xsl:for-each>&lt;/tr&gt;</xsl:when>
	</xsl:choose>
	<xsl:apply-templates select="differences"/>
	<xsl:choose>
		<xsl:when test="$type = 'html'">&lt;/table&gt;</xsl:when>
		<xsl:when test="$type = 'xml'">&lt;/<xsl:value-of select="$table"/>s&gt;</xsl:when>
	</xsl:choose>
	<xsl:choose>
		<xsl:when test="$title = ''">
-- end generated script
		</xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template match="differences">
<xsl:choose>
	<xsl:when test="$table = 'AdminTask/adminStatusView'"><xsl:call-template name="adminStatusView"/></xsl:when>
	<xsl:when test="$table = 'Authority/privileges'"><xsl:call-template name="privilegesAll"/></xsl:when>
	<xsl:when test="$table = 'Authority/routineauth'"><xsl:call-template name="routineauth"/></xsl:when>
	<xsl:when test="$table = 'alias'"><xsl:call-template name="alias"/></xsl:when>
	<xsl:when test="$table = 'bufferpool'"><xsl:call-template name="bufferpool"/></xsl:when>
	<xsl:when test="$table = 'container'"><xsl:call-template name="container"/></xsl:when>
	<xsl:when test="$table = 'DB2Catalog/trigger'"><xsl:call-template name="trigger"/></xsl:when>
	<xsl:when test="$table = 'dbcfg'"><xsl:call-template name="dbcfg"/></xsl:when>
	<xsl:when test="$table = 'DBCFG'"><xsl:call-template name="dbcfg"/></xsl:when>
	<xsl:when test="$table = 'dbmcfg'"><xsl:call-template name="dbmcfg"/></xsl:when>
	<xsl:when test="$table = 'Federation/serverOptions'"><xsl:call-template name="federationServerOptions"/></xsl:when>
	<xsl:when test="$table = 'Federation/userOptions'"><xsl:call-template name="federationUserOptions"/></xsl:when>
	<xsl:when test="$table = 'FUNCTIONS'"><xsl:call-template name="function"/></xsl:when>
	<xsl:when test="$table = 'function'"><xsl:call-template name="function"/></xsl:when>
	<xsl:when test="$table = 'indexcat'"><xsl:call-template name="index"/></xsl:when>
	<xsl:when test="$table = 'SYSPLAN'"><xsl:call-template name="plan"/></xsl:when>
	<xsl:when test="$table = 'plan'"><xsl:call-template name="plan"/></xsl:when>
	<xsl:when test="$table = 'procedure'"><xsl:call-template name="procedure"/></xsl:when>
	<xsl:when test="$table = 'PROCEDURES'"><xsl:call-template name="procedure"/></xsl:when>
	<xsl:when test="$table = 'ROUTINEDEP'"><xsl:call-template name="routineDep"/></xsl:when>
	<xsl:when test="$table = 'regvar'"><xsl:call-template name="regvar"/></xsl:when>
	<xsl:when test="$table = 'SERVERS'"><xsl:call-template name="server"/></xsl:when>
	<xsl:when test="$table = 'sequence'"><xsl:call-template name="sequence"/></xsl:when>
	<xsl:when test="$table = 'snapshotStoragePaths'"><xsl:call-template name="storagePath"/></xsl:when>
	<xsl:when test="$table = 'tablecat'"><xsl:call-template name="tableCat"/></xsl:when>
	<xsl:when test="$table = 'table'"><xsl:call-template name="table"/></xsl:when>
	<xsl:when test="$table = 'tablespaces'"><xsl:call-template name="tablespace"/></xsl:when>
	<xsl:when test="$table = 'viewcat'"><xsl:call-template name="viewcat"/></xsl:when>
	<xsl:when test="$table = 'Oracle/constraint'"><xsl:call-template name="oracleConstraint"/></xsl:when>
	<xsl:when test="$table = 'Oracle/object'"><xsl:call-template name="oracleObject"/></xsl:when>
	<xsl:when test="$table = 'Oracle/trigger'"><xsl:call-template name="oracleTrigger"/></xsl:when>
	<xsl:when test="$table = 'Oracle/table'"><xsl:call-template name="oracleTable"/></xsl:when>
	<xsl:when test="$table = 'MGW$_MQSERIES_LINKS'"><xsl:call-template name="oracleMQLinks"/></xsl:when>
	<xsl:when test="$table = 'MGW$_FOREIGN_QUEUES'"><xsl:call-template name="oracleMgwForeignQueues"/></xsl:when>
	<xsl:when test="$table = 'ALL_QUEUES'"><xsl:call-template name="oracleQueue"/></xsl:when>
	<xsl:when test="$table = 'MGW$_SUBSCRIBERS'"><xsl:call-template name="oracleSubscriber"/></xsl:when>
	<xsl:when test="$table = 'MGW$_SCHEDULES'"><xsl:call-template name="oracleMgwSchedule"/></xsl:when>
	<xsl:otherwise><xsl:apply-templates select="row"/></xsl:otherwise>
</xsl:choose></xsl:template>

<!-- ============================================== row ==============================================================-->
<xsl:template match="row"><xsl:choose>
	<xsl:when test="@action = 'insert'">
insert into <xsl:call-template name="tableName"/>
  (<xsl:for-each select="/differences/columns/column[@editable='true']">"<xsl:value-of select="@name"/>"<xsl:if test="not(position()=last())">,</xsl:if></xsl:for-each>)
  values(<xsl:apply-templates select="key"/><xsl:if test="count(key)>0 and count(data)>0">,</xsl:if><xsl:apply-templates select="data"/>)<xsl:value-of select="$delimiter"/>

  		</xsl:when>
	<xsl:when test="@action = 'delete'">
delete from <xsl:call-template name="tableName"/> <xsl:call-template name="where"/> <xsl:value-of select="$delimiter"/>
</xsl:when>
	<xsl:when test="@action = 'update'">
update <xsl:call-template name="tableName"/> <xsl:call-template name="set"/> <xsl:call-template name="where"/> <xsl:value-of select="$delimiter"/>
	</xsl:when>
	<xsl:when test="@action = 'csv'">
<xsl:apply-templates select="key"/><xsl:if test="count(key)>0 and count(data)>0"> , </xsl:if><xsl:apply-templates select="data"/><xsl:value-of select="$newLine"/>
	</xsl:when>
	<xsl:when test="@action = 'csvTab'">
<xsl:apply-templates select="key"><xsl:with-param name="separator" select="$tab"/></xsl:apply-templates><xsl:if test="count(key)>0 and count(data)>0"><xsl:value-of select="$tab"/></xsl:if><xsl:apply-templates select="data"><xsl:with-param name="separator" select="$tab"/></xsl:apply-templates><xsl:value-of select="$newLine"/>
	</xsl:when>
	<xsl:when test="@action = 'html'">
&lt;tr&gt;<xsl:apply-templates select="key"><xsl:with-param name="separator" select="''"/></xsl:apply-templates><xsl:apply-templates select="data"><xsl:with-param name="separator" select="''"/></xsl:apply-templates>&lt;/tr&gt;</xsl:when>
	<xsl:when test="@action = 'xml'">
&lt;<xsl:value-of select="$table"/>&gt;<xsl:apply-templates select="key"><xsl:with-param name="separator" select="''"/></xsl:apply-templates><xsl:apply-templates select="data"><xsl:with-param name="separator" select="''"/></xsl:apply-templates>&lt;/<xsl:value-of select="$table"/>&gt;</xsl:when>
	<xsl:otherwise>
--	*** error action: "<xsl:value-of select="@action"/>" for <xsl:call-template name="tableName"/>
	</xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template match="key">
<xsl:param name="separator"> , </xsl:param>
<xsl:call-template name="dataContent"/><xsl:if test="not(position()=last())">"<xsl:value-of select="$separator"/>"</xsl:if></xsl:template>

<xsl:template match="data">
<xsl:param name="separator"> , </xsl:param>
<xsl:param name="name"><xsl:value-of select="@name"/></xsl:param>
<xsl:if test="//differences/columns/column[@name=$name and @editable='true']"><xsl:apply-templates select="new"/><xsl:if test="not(position()=last())"><xsl:value-of select="$separator"/></xsl:if></xsl:if></xsl:template>

<xsl:template name="tableName">
<xsl:if test="$schema != '' ">"<xsl:value-of select="$schema"/>".</xsl:if>"<xsl:value-of select="$table"/>"</xsl:template>

<xsl:template name="where">
where <xsl:for-each select="key">"<xsl:value-of select="@name"/>" = <xsl:call-template name="dataContent"/> <xsl:if test="not(position()=last())"> and </xsl:if></xsl:for-each></xsl:template>

<xsl:template name="set">
set <xsl:for-each select="data">"<xsl:value-of select="@name"/>" = <xsl:apply-templates select="new"/> <xsl:if test="not(position()=last())"> , &#xA;</xsl:if>
</xsl:for-each>
</xsl:template>

<xsl:template match="new"><xsl:call-template name="dataContent"><xsl:with-param name="name" select="../@name"/></xsl:call-template></xsl:template>

<xsl:template name="dataContent">
<xsl:param name="value"><xsl:value-of select="text()"/></xsl:param>
<xsl:param name="name"><xsl:value-of select="@name"/></xsl:param>
<xsl:choose>
	<xsl:when test="$type='html'">&lt;td
		<xsl:choose>
			<xsl:when test="/differences/columns/column[@name=$name and contains('int real',@type)]"> align="right"</xsl:when>
		</xsl:choose>
		&gt;<xsl:value-of select="$value"/>&lt;/td&gt;</xsl:when>
	<xsl:when test="$type='xml'">&lt;<xsl:value-of select="$name"/>&gt;<xsl:value-of select="$value"/>&lt;/<xsl:value-of select="$name"/>&gt;</xsl:when>
	<xsl:when test="/differences/columns/column[@name=$name]/@type= 'string'">'<xsl:value-of select="$value"/>'</xsl:when>
	<xsl:when test="/differences/columns/column[@name=$name]/@type= 'timestamp'">timestamp('<xsl:value-of select="$value"/>')</xsl:when>
	<xsl:when test="/differences/columns/column[@name=$name]/@type= 'date'">date('<xsl:value-of select="$value"/>')</xsl:when>
	<xsl:otherwise><xsl:value-of select="."/></xsl:otherwise>
</xsl:choose>
</xsl:template>

<!-- ==============================================adminStatusView ==============================================================-->

<xsl:template name="adminStatusView">
<xsl:for-each select="row">
delete from SYSTOOLS.ADMINTASKSTATUS <xsl:call-template name="where"/> <xsl:value-of select="$delimiter"/>
</xsl:for-each>
</xsl:template>

<!-- ==============================================privileges ==============================================================-->

<xsl:template name="privilegesAll">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="grant"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="revoke"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
		<xsl:call-template name="revoke"/>
		<xsl:call-template name="grant"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="objectNamePrivilege">
<xsl:param name="objectType"><xsl:value-of select="key[@name ='OBJECTTYPE']/text()"/></xsl:param>
<xsl:choose>
<xsl:when test="$objectType = 'NICKNAME'">TABLE </xsl:when>
<xsl:when test="$objectType = 'VIEW'">TABLE </xsl:when>
<xsl:otherwise><xsl:value-of select="$objectType"> </xsl:value-of></xsl:otherwise>
</xsl:choose> "<xsl:value-of select="key[@name ='OBJECTSCHEMA']/text()"/>"<xsl:if test="string-length(key[@name ='OBJECTNAME']/text()) > 0">."<xsl:value-of select="key[@name ='OBJECTNAME']/text()"/>"</xsl:if></xsl:template>

<xsl:template name="grant">
GRANT <xsl:call-template name="privilege"/>  ON <xsl:call-template name="objectNamePrivilege"/> TO <xsl:call-template name="auth"/> <xsl:if test="data[@name ='OBJECTSCHEMA']/new/text() = 'Y' ">WITH GRANT</xsl:if> <xsl:value-of select="$delimiter"/>

</xsl:template>
<xsl:template name="revoke">
REVOKE <xsl:call-template name="privilege"/> ON <xsl:call-template name="objectNamePrivilege"/> FROM <xsl:call-template name="auth"/> <xsl:if test="data[@name ='OBJECTSCHEMA']/text() = 'Y' ">WITH GRANT</xsl:if> <xsl:value-of select="$delimiter"/>

</xsl:template>

<xsl:template name="auth">
<xsl:param name="type"><xsl:value-of select="key[@name ='AUTHIDTYPE']/text()"/></xsl:param>
<xsl:param name="name"><xsl:value-of select="key[@name ='AUTHID']/text()"/></xsl:param>
<xsl:choose>
<xsl:when test="$type = 'U'">USER </xsl:when>
<xsl:when test="$type = 'G' and not($name = 'PUBLIC  ')">GROUP </xsl:when>
</xsl:choose><xsl:value-of select="$name"/></xsl:template>

<xsl:template name="privilege">
<xsl:param name="privilege"><xsl:value-of select="key[@name ='PRIVILEGE']/text()"/></xsl:param>
<xsl:choose>
<xsl:when test="$privilege = 'REFERENCE'">REFERENCES</xsl:when>
<xsl:otherwise><xsl:value-of select="$privilege"/></xsl:otherwise>
</xsl:choose></xsl:template>

<!-- ==============================================routineauth ==============================================================-->

<xsl:template name="routineauth">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="grantroutineauth"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="revokeroutineauth"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
		<xsl:call-template name="revokeroutineauth"/>
		<xsl:call-template name="grantroutineauth"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="authroutineauth">
<xsl:param name="type"><xsl:value-of select="key[@name ='GRANTEETYPE']/text()"/></xsl:param>
<xsl:param name="name"><xsl:value-of select="key[@name ='GRANTEE']/text()"/></xsl:param>
<xsl:choose>
<xsl:when test="$type = 'U'">USER </xsl:when>
<xsl:when test="$type = 'G' and not($name = 'PUBLIC  ')">GROUP </xsl:when>
</xsl:choose><xsl:value-of select="$name"/></xsl:template>

<xsl:template name="grantroutineauth">
GRANT EXECUTE ON SPECIFIC PROCEDURE "<xsl:value-of select="key[@name ='SCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='SPECIFICNAME']/text()"/>" TO <xsl:call-template name="authroutineauth"/> <xsl:if test="data[@name ='EXECUTEAUTH']/new/text() = 'Y' "> WITH GRANT</xsl:if> <xsl:value-of select="$delimiter"/>

</xsl:template>
<xsl:template name="revokeroutineauth">
REVOKE EXECUTE SPECIFIC ON PROCEDURE "<xsl:value-of select="key[@name ='SCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='SPECIFICNAME']/text()"/>"  FROM <xsl:call-template name="authroutineauth"/> <xsl:if test="data[@name ='EXECUTEAUTH']/text() = 'Y' "> WITH GRANT</xsl:if> <xsl:value-of select="$delimiter"/>

</xsl:template>

<!-- ============================================== container  ==============================================================-->

<xsl:template name="container">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="addContainer"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropContainer"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropContainer"/>
			<xsl:call-template name="addContainer"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropContainer">
ALTER TABLESPACE "<xsl:value-of select="data[@name ='TBSP_NAME']/text()"/>" DROP(<xsl:call-template name="containerType"/> '<xsl:value-of select="data[@name ='CONTAINER_NAME']/text()"/>')<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="addContainer">
ALTER TABLESPACE "<xsl:value-of select="data[@name ='TBSP_NAME']/text()"/>" ADD (<xsl:call-template name="containerType"/> '<xsl:value-of select="data[@name ='CONTAINER_NAME']/text()"/>' <xsl:value-of select="data[@name ='TOTAL_PAGES']/text()"/> )<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="containerType">
	<xsl:choose>
		<xsl:when test="data[@name ='CONTAINER_TYPE']/text()='FILE_EXTENT_TAG'">FILE</xsl:when>
		<xsl:otherwise><xsl:value-of select="data[@name ='CONTAINER_TYPE']/text()"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

<!-- ============================================== federationServerOptions  ==============================================================-->

<xsl:template name="federationServerOptions">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'">
ALTER SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>" 
     OPTIONS (ADD <xsl:value-of select="key[@name ='OPTION']/text()"/> '<xsl:value-of select="data[@name ='SETTING']/text()"/>')<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'">
ALTER SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>" 
     OPTIONS (SET <xsl:value-of select="key[@name ='OPTION']/text()"/> )<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
ALTER SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>" 
     OPTIONS (SET <xsl:value-of select="key[@name ='OPTION']/text()"/> '<xsl:value-of select="data[@name ='SETTING']/text()"/>')<xsl:value-of select="$delimiter"/>
 <xsl:value-of select="$delimiter"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== federationUserOptions  ==============================================================-->

<xsl:template name="federationUserOptions">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'">
ALTER USER MAPPING FOR "<xsl:value-of select="key[@name ='AUTHID']/text()"/>" SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>" 
     OPTIONS (ADD <xsl:value-of select="key[@name ='OPTION']/text()"/> '<xsl:value-of select="data[@name ='SETTING']/text()"/>')<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'">
ALTER USER MAPPING FOR "<xsl:value-of select="key[@name ='AUTHID']/text()"/>" SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>" 
     OPTIONS (SET <xsl:value-of select="key[@name ='OPTION']/text()"/> )<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
ALTER USER MAPPING FOR "<xsl:value-of select="key[@name ='AUTHID']/text()"/>" SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>" 
     OPTIONS (SET <xsl:value-of select="key[@name ='OPTION']/text()"/> '<xsl:value-of select="data[@name ='SETTING']/text()"/>')<xsl:value-of select="$delimiter"/>
 <xsl:value-of select="$delimiter"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== storagePath  ==============================================================-->

<xsl:template name="storagePath">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createStoragePath"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropStoragePath"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropStoragePath"/>
			<xsl:call-template name="createStoragePath"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropStoragePath">
ALTER DATABASE DROP STORAGE ON ('<xsl:value-of select="key[@name ='DB_STORAGE_PATH']/text()"/>')<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createStoragePath">
ALTER DATABASE ADD STORAGE ON ('<xsl:value-of select="key[@name ='DB_STORAGE_PATH']/text()"/>')<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== tablespace  ==============================================================-->

<xsl:template name="tablespace">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createTablespace"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropTablespace"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropTablespace"/>
			<xsl:call-template name="createTablespace"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropTablespace">
DROP TABLESPACE "<xsl:value-of select="key[@name ='TBSPACE']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createTablespace">
-- *** to be done ***
<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== trigger  ==============================================================-->

<xsl:template name="trigger">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createTrigger"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropTrigger"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropTrigger"/>
			<xsl:call-template name="createTrigger"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropTrigger">
DROP TRIGGER "<xsl:value-of select="key[@name ='TRIGSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TRIGNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createTrigger">
set current schema = "<xsl:value-of select="data[@name ='QUALIFIER']/new/text()"/>"<xsl:value-of select="$delimiter"/>
<xsl:value-of select="data[@name ='TEXT']/new/text()"/>
<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== views  ==============================================================-->

<xsl:template name="viewcat">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createView"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropView"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropView"/>
			<xsl:call-template name="createView"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropView">
DROP VIEW "<xsl:value-of select="key[@name ='VIEWSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='VIEWNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createView">
set current schema = "<xsl:value-of select="data[@name ='QUALIFIER']/new/text()"/>"<xsl:value-of select="$delimiter"/>
<xsl:value-of select="data[@name ='VIEWTEXT']/new/text()"/>
<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== plan  ==============================================================-->

<xsl:template name="plan">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="$type = 'rebind'">
call REBIND_ROUTINE_PACKAGE ('SP','<xsl:value-of select="data[@name ='ROUTINESCHEMA']/text()"/><xsl:choose><xsl:when test="$databaseVersion>9.5">','</xsl:when><xsl:otherwise>.</xsl:otherwise></xsl:choose><xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>','ANY')<xsl:value-of select="$delimiter"/> -- <xsl:value-of select="key[@name ='CREATOR']/text()"/> , <xsl:value-of select="key[@name ='NAME']/text()"/> , <xsl:value-of select="data[@name ='ROUTINENAME']/text()"/>
		</xsl:when>
		<xsl:when test="starts-with(key[@name ='CREATOR']/text(),'SYS')"></xsl:when>
		<xsl:when test="@action = 'delete'">
DROP PACKAGE "<xsl:value-of select="key[@name ='CREATOR']/text()"/>"."<xsl:value-of select="key[@name ='NAME']/text()"/>"<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:otherwise>
-- to be done action: <xsl:value-of select="$action"/> type: <xsl:value-of select="$type"/> id:  "<xsl:value-of select="key[@name ='CREATOR']/text()"/>"."<xsl:value-of select="key[@name ='NAME']/text()"/>"
		</xsl:otherwise>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== procedures  ==============================================================-->

<xsl:template name="procedure">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="$type = 'rebind'">
call REBIND_ROUTINE_PACKAGE ('P','<xsl:value-of select="key[@name ='PROCSCHEMA']/text()"/><xsl:choose><xsl:when test="$databaseVersion>9.5">','</xsl:when><xsl:otherwise>.</xsl:otherwise></xsl:choose><xsl:value-of select="key[@name ='PROCNAME']/text()"/>','ANY')<xsl:value-of select="$delimiter"/> 
		</xsl:when>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createProcedure"/></xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropProcedure"/></xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropProcedure"/>
			<xsl:call-template name="createProcedure"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropProcedure">
<xsl:param name="schema"><xsl:value-of select="key[@name ='PROCSCHEMA']/text()"/></xsl:param>
<xsl:choose>
	<xsl:when test="starts-with($schema,'SYS')">
--System DROP PROCEDURE "<xsl:value-of select="$schema"/>"."<xsl:value-of select="key[@name ='PROCNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
	</xsl:when>
	<xsl:otherwise>
--DROP PROCEDURE "<xsl:value-of select="$schema"/>"."<xsl:value-of select="key[@name ='PROCNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
DROP SPECIFIC  PROCEDURE "<xsl:value-of select="$schema"/>"."<xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
	</xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template name="createProcedure">
<xsl:param name="language"><xsl:value-of select="data[@name ='LANGUAGE']/new/text()"/></xsl:param>
<xsl:param name="schema"><xsl:value-of select="key[@name ='PROCSCHEMA']/text()"/></xsl:param>
<xsl:choose>
	<xsl:when test="starts-with($schema,'SQL')">
--System PROCEDURE "<xsl:value-of select="$schema"/>"."<xsl:value-of select="key[@name ='PROCNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
	</xsl:when>
	<xsl:when test="starts-with($language,'SQL')">
--
<xsl:value-of select="data[@name ='TEXT']/new/text()"/>
<xsl:value-of select="$delimiter"/>
	</xsl:when>
	<xsl:otherwise>
-- to do "<xsl:value-of select="$schema"/>"."<xsl:value-of select="key[@name ='PROCNAME']/text()"/>" <xsl:value-of select="$language"></xsl:value-of>
	</xsl:otherwise>
</xsl:choose>
</xsl:template>

<!-- ============================================== routineDep  ==============================================================-->

<xsl:template name="routineDep">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="$type = 'rebind'">
call REBIND_ROUTINE_PACKAGE ('SP','<xsl:value-of select="key[@name ='ROUTINESCHEMA']/text()"/><xsl:choose><xsl:when test="$databaseVersion>9.5">','</xsl:when><xsl:otherwise>.</xsl:otherwise></xsl:choose><xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>','ANY')<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="starts-with(key[@name ='ROUTINESCHEMA']/text(),'SYS')">
-- Ignored as DB2 object  Schema: <xsl:value-of select="key[@name ='ROUTINESCHEMA']/text()"/> Specific Name: <xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>
		</xsl:when>
		<xsl:otherwise>
-- to do "<xsl:value-of select="$schema"/>"."<xsl:value-of select="key[@name ='ROUTINESCHEMA']/text()"/>"  Specific Name: <xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>
		</xsl:otherwise>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== dbcfg  ==============================================================-->

<xsl:template name="dbcfg">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="updateDbcfg"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'">
CALL SYSPROC.ADMIN_CMD ('update db cfg using <xsl:value-of select="key[@name ='NAME']/text()"/> immediate')<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'"><xsl:call-template name="updateDbcfg"/></xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="updateDbcfg">
CALL SYSPROC.ADMIN_CMD ('update db cfg using <xsl:value-of select="key[@name ='NAME']/text()"/><xsl:value-of select="concat(' ',data[@name ='VALUE']/new/text())"/> immediate')<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== dbmcfg  ==============================================================-->

<xsl:template name="dbmcfg">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="updateDbmcfg"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'">
CALL SYSPROC.ADMIN_CMD ('update dbm cfg using <xsl:value-of select="key[@name ='NAME']/text()"/> immediate')<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'"><xsl:call-template name="updateDbcfg"/></xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="updateDbmcfg">
CALL SYSPROC.ADMIN_CMD ('update dbm cfg using <xsl:value-of select="key[@name ='NAME']/text()"/> <xsl:value-of select="concat(' ',data[@name ='VALUE']/new/text())"/> immediate')<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== regvar  ==============================================================-->

<xsl:template name="regvar">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="key[@name ='LEVEL']/text() = 'G' ">
db2set -g <xsl:call-template name="processRegvar"/>
		</xsl:when>
		<xsl:when test="key[@name ='LEVEL']/text() = 'I' ">
db2set <xsl:call-template name="processRegvar"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="processRegvar">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="updateRegvar"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:value-of select="key[@name ='REG_VAR_NAME']/text()"/>=</xsl:when>
		<xsl:when test="@action = 'update'"><xsl:call-template name="updateRegvar"/></xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="updateRegvar">
<xsl:value-of select="key[@name ='REG_VAR_NAME']/text()"/>=<xsl:value-of select="data[@name ='REG_VAR_VALUE']/new/text()"/>
</xsl:template>

<!-- ============================================== server  ==============================================================-->

<xsl:template name="server">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createServer"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropServer"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropServer"/>
			<xsl:call-template name="createServer"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropServer">
DROP SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createServer">

CREATE SERVER "<xsl:value-of select="key[@name ='SERVERNAME']/text()"/>" 
   TYPE <xsl:value-of select="data[@name ='SERVERTYPE']/text()"/>
   VERSION <xsl:value-of select="data[@name ='WRAPNAME']/text()"/>
   WRAPPER "<xsl:value-of select="data[@name ='SERVERVERSION']/text()"/>" 
--   AUTHORIZATION "???"
--   PASSWORD ????
--   OPTIONS ( ??);
-- remarks "<xsl:value-of select="data[@name ='REMARKS']/text()"/>" 

-- to be done
<xsl:value-of select="$delimiter"/>

</xsl:template>

<!-- ============================================== sequence  ==============================================================-->

<xsl:template name="sequence">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createSequence"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropSequence"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropSequence"/>
			<xsl:call-template name="createSequence"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropSequence">
DROP SEQUENCE "<xsl:value-of select="key[@name ='SEQSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='SEQNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createSequence">
CREATE SEQUENCE "<xsl:value-of select="key[@name ='SEQSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='SEQNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
  AS <xsl:value-of select="data[@name ='DATATYPENAME']/text()"/>
  START WITH <xsl:value-of select="data[@name ='NEXTCACHEFIRSTVALUE']/text()"/>
  INCREMENT BY <xsl:value-of select="data[@name ='INCREMENT']/text()"/>
  MINVALUE <xsl:value-of select="data[@name ='MINVALUE']/text()"/>
  MAXVALUE <xsl:value-of select="data[@name ='MAXVALUE']/text()"/>
  <xsl:if test="data[@name ='CYCLE']/text() ='N'"> NO</xsl:if> CYCLE
<xsl:choose>
	<xsl:when test="data[@name ='CACHE']/text() ='-1'">NO CACHE</xsl:when>
	<xsl:otherwise>  CACHE <xsl:value-of select="data[@name ='CACHE']/text()"/></xsl:otherwise>
</xsl:choose>
  <xsl:if test="data[@name ='ORDER']/text() ='N'"> NO</xsl:if> ORDER <xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== alias  ==============================================================-->

<xsl:template name="alias">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createAlias"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropAlias"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropAlias"/>
			<xsl:call-template name="createAlias"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropAlias">
DROP ALIAS "<xsl:value-of select="key[@name ='ALIASSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='ALIASNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createAlias">
CREATE ALIAS "<xsl:value-of select="key[@name ='ALIASSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='ALIASNAME']/text()"/>"
	FOR TABLE "<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'TABLESCHEMA'"/></xsl:call-template>"."<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'TABLENAME'"/></xsl:call-template>"
<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== bufferpool  ==============================================================-->

<xsl:template name="bufferpool">
	<xsl:param name="object"/>
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createBufferpool"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropBufferpool"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="alterBufferpool"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropBufferpool">
DROP BUFFERPOOL "<xsl:value-of select="key[@name ='BPNAME']/text()"/>"
<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createBufferpool">
CREATE BUFFERPOOL "<xsl:value-of select="key[@name ='BPNAME']/text()"/>"
	SIZE <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'NPAGES'"/></xsl:call-template>
	PAGESIZE <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'PAGESIZE'"/></xsl:call-template>
<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="alterBufferpool">
ALTER BUFFERPOOL "<xsl:value-of select="key[@name ='BPNAME']/text()"/>"
	SIZE <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'NPAGES'"/></xsl:call-template>
<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== function  ==============================================================-->

<xsl:template name="function">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="starts-with(key[@name ='FUNCSCHEMA']/text(),'SYS')"></xsl:when>
		<xsl:when test="$type = 'rebind'">
call REBIND_ROUTINE_PACKAGE ('SP','<xsl:value-of select="key[@name ='FUNCSCHEMA']/text()"/><xsl:choose><xsl:when test="$databaseVersion>9.5">','</xsl:when><xsl:otherwise>.</xsl:otherwise></xsl:choose><xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>','ANY')<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="$type = 'grant'">
grant execute on specific function "<xsl:value-of select="key[@name ='FUNCSCHEMA']/text()"/>"."<xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>" to <xsl:value-of select="$to"/> <xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createFunction"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropFunction"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropFunction"/>
			<xsl:call-template name="createFunction"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropFunction">
--DROP FUNCTION "<xsl:value-of select="key[@name ='FUNCSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='FUNCNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
DROP SPECIFIC FUNCTION "<xsl:value-of select="key[@name ='FUNCSCHEMA']/text()"/>"."<xsl:value-of select="data[@name ='SPECIFICNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createFunction">
	<xsl:choose>
		<xsl:when test="normalize-space(data[@name='LANGUAGE']/new/text())='SQL'">
<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'BODY'"/></xsl:call-template>
		</xsl:when>
		<xsl:when test="normalize-space(data[@name='LANGUAGE']/text())='SQL'">
<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'BODY'"/></xsl:call-template>
		</xsl:when>
		<xsl:otherwise>
CREATE FUNCTION "<xsl:value-of select="key[@name ='FUNCSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='FUNCNAME']/text()"/>"
	LANGUAGE <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'LANGUAGE'"/></xsl:call-template>"
	?????????
		</xsl:otherwise>
	</xsl:choose>
<xsl:value-of select="$delimiter"/>
</xsl:template>
<!-- ============================================== Index  ==============================================================-->

<xsl:template name="index">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createIndex"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropIndex"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropIndex"/>
			<xsl:call-template name="createIndex"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropIndex">
DROP INDEX "<xsl:value-of select="key[@name ='INDSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='INDNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createIndex">
CREATE <xsl:if test="not(data[@name='UNIQUERULE']/new/text()='D')">UNIQUE</xsl:if> INDEX  "<xsl:value-of select="key[@name ='INDSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='INDNAME']/text()"/>"
  ON "<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'TABSCHEMA'"/></xsl:call-template>"."<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'TABNAME'"/></xsl:call-template>"
	( <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'COLNAMES'"/></xsl:call-template> )
 	<xsl:if test="data[@name='INDEXTYPE']/new/text()='CLUS'"><xsl:value-of select="$newLine"/>	CLUSTER</xsl:if>
 	<xsl:if test="data[@name='PCTFREE']/new/text() > -1"><xsl:value-of select="$newLine"/>	PCTFREE <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'PCTFREE'"/></xsl:call-template></xsl:if>
 	<xsl:if test="data[@name='LEVEL2PCTFREE']/new/text() > -1"><xsl:value-of select="$newLine"/>	LEVEL2 PCTFREE <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'LEVEL2PCTFREE'"/></xsl:call-template></xsl:if>
	<xsl:value-of select="$newLine"/>	MINPCTUSED <xsl:call-template name="dataNew"><xsl:with-param name="col" select="'MINPCTUSED'"/></xsl:call-template> 
	<xsl:value-of select="$newLine"/><xsl:text>	</xsl:text><xsl:if test="not (data[@name='REVERSE_SCANS']/new/text()='Y')">DIS</xsl:if>ALLOW REVERSE SCANS
	PAGE SPLIT <xsl:choose>
		<xsl:when test="data[@name='PAGESPLIT']/new/text() = 'S'">SYMMETRIC</xsl:when>
		<xsl:when test="data[@name='PAGESPLIT']/new/text() = 'H'">HIGH</xsl:when>
		<xsl:when test="data[@name='PAGESPLIT']/new/text() = 'L'">LOW</xsl:when>
		<xsl:otherwise>???@PAGESPLIT = "<xsl:value-of select="data[@name='PAGESPLIT']/new/text()"/>" ???</xsl:otherwise>
	</xsl:choose>
	<xsl:if test="data[@name='COMPRESS']/new/text() = 'Y'"><xsl:value-of select="$newLine"/>	COMPRESS YES</xsl:if><xsl:value-of select="$newLine"/>
<xsl:value-of select="$delimiter"/>
</xsl:template>
<!-- ============================================== table  ==============================================================-->

<xsl:template name="table">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="$type = 'grant'">
GRANT SELECT ON TABLE "<xsl:value-of select="key[@name ='TABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TABNAME']/text()"/>" TO <xsl:value-of select="$grantee"/><xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'insert'"></xsl:when>
		<xsl:when test="@action = 'delete' or $type = 'delete'">
DROP TABLE "<xsl:value-of select="key[@name ='TABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TABNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== tableCat  ==============================================================-->

<xsl:template name="tableCat">
<xsl:for-each select="row">
DROP <xsl:choose>
	<xsl:when test="data[@name ='TYPE']/text() = 'A'">ALIAS</xsl:when>
	<xsl:when test="data[@name ='TYPE']/text() = 'N'">NICKNAME</xsl:when>
	<xsl:when test="data[@name ='TYPE']/text() = 'S'">TABLE</xsl:when>
	<xsl:when test="data[@name ='TYPE']/text() = 'T'">TABLE</xsl:when>
	<xsl:when test="data[@name ='TYPE']/text() = 'V'">VIEW</xsl:when>
	<xsl:otherwise>??? type <xsl:value-of select="data[@name ='TYPE']/text()"/> to be done</xsl:otherwise>
</xsl:choose> "<xsl:value-of select="key[@name ='TABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TABNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:for-each>
</xsl:template>

<!-- ============================================== Oracle/constraint  ==============================================================-->

<xsl:template name="oracleConstraint">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createOracleConstraint"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropOracleConstraint"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropOracleConstraint"/>
			<xsl:call-template name="createOracleConstraint"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropOracleConstraint">
ALTER TABLE "<xsl:value-of select="key[@name ='OWNER']/text()"/>"."<xsl:value-of select="data[@name ='TABLE_NAME']/text()"/>" DROP CONSTRAINT "<xsl:value-of select="key[@name = 'CONSTRAINT_NAME']/text()"/>" <xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createOracleConstraint">
-- to be done ALTER TABLE "<xsl:value-of select="key[@name ='OWNER']/text()"/>"."<xsl:value-of select="data[@name ='TABLE_NAME']/text()"/>" (ADD CONSTRAINT "<xsl:value-of select="key[@name = 'CONSTRAINT_NAME']/text()"/>" )<xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== Oracle/table  ==============================================================-->

<xsl:template name="oracleObject">
<xsl:for-each select="row">
DROP <xsl:value-of select="data[@name ='OBJECT_TYPE']/text()"/> "<xsl:value-of select="key[@name ='OWNER']/text()"/>"."<xsl:value-of select="key[@name ='OBJECT_NAME']/text()"/>" <xsl:value-of select="$delimiter"/>
</xsl:for-each>
</xsl:template>
<!-- ============================================== Oracle/trigger  ==============================================================-->

<xsl:template name="oracleTrigger">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'"><xsl:call-template name="createOracleTrigger"/>
		</xsl:when>
		<xsl:when test="@action = 'delete'"><xsl:call-template name="dropOracleTrigger"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
			<xsl:call-template name="dropOracleTrigger"/>
			<xsl:call-template name="createOracleTrigger"/>
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<xsl:template name="dropOracleTrigger">
DROP TRIGGER "<xsl:value-of select="key[@name ='OWNER']/text()"/>"."<xsl:value-of select="key[@name ='TRIGGER_NAME']/text()"/>" <xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="createOracleTrigger">
-- to be done CREATE TRIGGER "<xsl:value-of select="key[@name ='OWNER']/text()"/>"."<xsl:value-of select="key[@name ='TRIGGER_NAME']/text()"/>" <xsl:value-of select="$delimiter"/>
</xsl:template>

<!-- ============================================== Oracle SYS.MGW$_MQSERIES_LINKS  ==============================================================-->

<xsl:template name="oracleMQLinks">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'">
declare
    v_options sys.mgw_properties;
    v_prop sys.mgw_mqseries_properties;
begin
    v_prop := sys.mgw_mqseries_properties.construct();
    v_prop.max_connections := <xsl:value-of select="data[@name ='MAX_CONNECTIONS']/text()"/>;
    v_prop.interface_type :=  <xsl:choose><xsl:when test="data[@name ='INTERFACE_TYPE']/text()='1'" >DBMS_MGWADM.MQSERIES_BASE_JAVA_INTERFACE</xsl:when><xsl:otherwise><xsl:value-of select="data[@name ='INTERFACE_TYPE']/text()"/></xsl:otherwise></xsl:choose>;
    v_prop.username := <xsl:choose><xsl:when test="data[@name ='USERNAME']/text()=''" >null</xsl:when><xsl:otherwise>'<xsl:value-of select="data[@name ='USERNAME']/text()"/>'</xsl:otherwise></xsl:choose>;
    v_prop.password := <xsl:choose><xsl:when test="data[@name ='USERNAME']/text()=''" >null</xsl:when><xsl:otherwise>'<xsl:value-of select="data[@name ='PASSWORD']/text()"/>'</xsl:otherwise></xsl:choose>;
    v_prop.hostname := '<xsl:value-of select="data[@name ='HOSTNAME']/text()"/>';
    v_prop.port     := <xsl:value-of select="data[@name ='PORT']/text()"/>;
    v_prop.channel  := '<xsl:value-of select="data[@name ='CHANNEL']/text()"/>';
    v_prop.queue_manager := '<xsl:value-of select="data[@name ='QUEUE_MANAGER']/text()"/>'; 
    v_prop.outbound_log_queue := <xsl:choose><xsl:when test="data[@name ='OUTBOUND_LOG_QUEUE']/text()=''" >null</xsl:when><xsl:otherwise>'<xsl:value-of select="data[@name ='OUTBOUND_LOG_QUEUE']/text()"/>'</xsl:otherwise></xsl:choose>;
    v_prop.inbound_log_queue := <xsl:choose><xsl:when test="data[@name ='INBOUND_LOG_QUEUE']/text()=''" >null</xsl:when><xsl:otherwise>'<xsl:value-of select="data[@name ='INBOUND_LOG_QUEUE']/text()"/>'</xsl:otherwise></xsl:choose>;
       
    dbms_mgwadm.create_msgsystem_link(
         linkname => '<xsl:value-of select="key[@name ='LINK_NAME']/text()"/>'
        ,properties => v_prop
        ,options => v_options
    );
end;
<xsl:value-of select="$delimiter"/>
 		</xsl:when>
		<xsl:when test="@action = 'delete'">
begin 
    dbms_mgwadm.remove_msgsystem_link('<xsl:value-of select="key[@name ='LINK_NAME']/text()"/>');
end;
<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
-- to be done
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== Oracle SYS.MGW$_FOREIGN_QUEUES  ==============================================================-->

<xsl:template name="oracleMgwForeignQueues">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'">
begin
   dbms_mgwadm.register_foreign_queue
       (name => '<xsl:value-of select="key[@name ='NAME']/text()"/>'
       ,linkname => '<xsl:value-of select="key[@name ='LINK_NAME']/text()"/>'
       ,provider_queue => '<xsl:value-of select="data[@name ='PROVIDER_QUEUE']/text()"/>'
       ,domain => <xsl:value-of select="data[@name ='DOMAIN']/text()"/>
    );
end;
<xsl:value-of select="$delimiter"/>
  		</xsl:when>
		<xsl:when test="@action = 'delete'">
begin
    dbms_mgwadm.unregister_foreign_queue(name =>'<xsl:value-of select="key[@name ='NAME']/text()"/>', linkname =>'<xsl:value-of select="key[@name ='LINK_NAME']/text()"/>');
end;
<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
-- to be done
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== Oracle ALL_QUEUES  ==============================================================-->

<xsl:template name="oracleQueue">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'">
begin
    DBMS_AQADM.CREATE_QUEUE_TABLE 
        (  Queue_table       => '<xsl:value-of select="data[@name ='QUEUE_TABLE']/text()"/>'
        , multiple_consumers => FALSE
        , Queue_payload_type => 'sys.mgw_basic_msg_t'
        );
end;
<xsl:value-of select="$delimiter"/>
begin
    DBMS_AQADM.CREATE_QUEUE 
        ( Queue_name =>  '<xsl:value-of select="key[@name ='OWNER']/text()"/>.<xsl:value-of select="key[@name ='NAME']/text()"/>' 
        , Queue_table => '<xsl:value-of select="data[@name ='QUEUE_TABLE']/text()"/>'
        );
        DBMS_AQADM.START_QUEUE (Queue_name => '<xsl:value-of select="key[@name ='OWNER']/text()"/>.<xsl:value-of select="key[@name ='NAME']/text()"/>');
end;
<xsl:value-of select="$delimiter"/>
  		</xsl:when>
		<xsl:when test="@action = 'delete'">
begin
  DBMS_AQADM.STOP_QUEUE (Queue_name => '<xsl:value-of select="key[@name ='OWNER']/text()"/>.<xsl:value-of select="key[@name ='NAME']/text()"/>');
  DBMS_AQADM.DROP_QUEUE( Queue_name => '<xsl:value-of select="key[@name ='OWNER']/text()"/>.<xsl:value-of select="key[@name ='NAME']/text()"/>' );
  DBMS_AQADM.DROP_QUEUE_TABLE ( Queue_table => '<xsl:value-of select="data[@name ='QUEUE_TABLE']/text()"/>' , force => TRUE);
end;
<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
-- to be done
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>



<!-- ============================================== Oracle MGW$_SUBSCRIBERS  ==============================================================-->

<xsl:template name="oracleSubscriber">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'">
begin
    dbms_mgwadm.add_subscriber
        (subscriber_id => '<xsl:value-of select="key[@name ='SUBSCRIBER_ID']/text()"/>'
        ,propagation_type => <xsl:choose><xsl:when test="data[@name ='PROP_TYPE']/text()='2'" >dbms_mgwadm.inbound_propagation</xsl:when><xsl:otherwise>dbms_mgwadm.outbound_propagation<xsl:value-of select="data[@name ='INTERFACE_TYPE']/text()"/></xsl:otherwise></xsl:choose>
        ,queue_name => '<xsl:value-of select="data[@name ='QUEUE_NAME']/text()"/>'
        ,destination =>'<xsl:value-of select="data[@name ='DESTINATION']/text()"/>'
        );
end;
<xsl:value-of select="$delimiter"/>
  		</xsl:when>
		<xsl:when test="@action = 'delete'">
begin
  dbms_mgwadm.remove_subscriber('<xsl:value-of select="key[@name ='SUBSCRIBER_ID']/text()"/>', dbms_mgwadm.FORCE);
end;
<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
-- to be done
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>

<!-- ============================================== Oracle MGW$_SCHEDULES  ==============================================================-->

<xsl:template name="oracleMgwSchedule">
<xsl:for-each select="row">
	<xsl:choose>
		<xsl:when test="@action = 'insert'">
begin
    dbms_mgwadm.schedule_propagation  
       (schedule_id => '<xsl:value-of select="key[@name ='SCHEDULE_ID']/text()"/>'
       ,propagation_type => <xsl:choose><xsl:when test="data[@name ='PROP_TYPE']/text()='2'" >dbms_mgwadm.inbound_propagation</xsl:when><xsl:otherwise>dbms_mgwadm.outbound_propagation<xsl:value-of select="data[@name ='INTERFACE_TYPE']/text()"/></xsl:otherwise></xsl:choose>
       ,source =>  '<xsl:value-of select="data[@name ='SOURCE']/text()"/>'
       ,destination => '<xsl:value-of select="data[@name ='DESTINATION']/text()"/>'
       ,latency => <xsl:value-of select="data[@name ='LATENCY']/text()"/>
       );
       dbms_mgwadm.enable_propagation_schedule('<xsl:value-of select="key[@name ='SCHEDULE_ID']/text()"/>');
end;
<xsl:value-of select="$delimiter"/>
  		</xsl:when>
		<xsl:when test="@action = 'delete'">
begin
  dbms_mgwadm.disable_propagation_schedule('<xsl:value-of select="key[@name ='SCHEDULE_ID']/text()"/>');
end;
<xsl:value-of select="$delimiter"/>
begin
  dbms_mgwadm.unschedule_propagation('<xsl:value-of select="key[@name ='SCHEDULE_ID']/text()"/>');
end;
<xsl:value-of select="$delimiter"/>
		</xsl:when>
		<xsl:when test="@action = 'update'">
-- to be done
		</xsl:when>
	</xsl:choose>
</xsl:for-each>
</xsl:template>
<!-- ============================================== Oracle/table  ==============================================================-->

<xsl:template name="oracleTable">
<xsl:for-each select="row">
DROP TABLE "<xsl:value-of select="key[@name ='OWNER']/text()"/>"."<xsl:value-of select="key[@name ='TABLE_NAME']/text()"/>" <xsl:value-of select="$delimiter"/>
</xsl:for-each>
</xsl:template>

<!-- ============================================== wrongGenerator  ==============================================================-->

<xsl:template name="wrongGenerator">
-- wrong generator for action: <xsl:value-of select="@action"/>
</xsl:template>

<!-- ============================================== dataNew  ==============================================================-->

<xsl:template name="dataNew">
	<xsl:param name="col"/>
	<xsl:choose>
		<xsl:when test="data[@name=$col]/new/text()=''"><xsl:value-of select="data[@name=$col]/text()"/></xsl:when>
		<xsl:otherwise><xsl:value-of select="data[@name =$col]/new/text()"/></xsl:otherwise>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>
