<?xml version="1.0" encoding="ISO-8859-1"?>
<xsl:stylesheet version="2.0" 
xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
xmlns:fo="http://www.w3.org/1999/XSL/Format"
xmlns:xs="http://www.w3.org/2001/XMLSchema"
xmlns:fn="http://www.w3.org/2005/xpath-functions"
xmlns:xdt="http://www.w3.org/2005/xpath-datatypes"
xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
>
<xsl:output method="text"/>

 <!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2011 All rights reserved.

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
<xsl:param name="delimiter">@</xsl:param>
<xsl:param name="newLine"><xsl:text>&#xa;</xsl:text></xsl:param>

<xsl:template match="/">
--  **** not fully completed, missing parts ***  

	<xsl:apply-templates select="table"/>
</xsl:template>

<xsl:template match="table">

CREATE TABLE "<xsl:value-of select="@OWNER"/>"."<xsl:value-of select="@TABLE_NAME"/>"
	(<xsl:apply-templates select="columns"/>	)
	<xsl:choose>
		<xsl:when test="TABLESPACE_NAME != ''">TABLESPACE "<xsl:value-of select="@TABLESPACE_NAME"/>"<xsl:if test="@INDEX_TABLESPACE != ''"> INDEX IN "<xsl:value-of select="@INDEX_TABLESPACE"/>"</xsl:if>
		</xsl:when>
		<xsl:otherwise>TABLESPACE ????????????????? to be done</xsl:otherwise>	
	</xsl:choose>
	<xsl:if test="@COMPRESSION='R'"><xsl:value-of select="$newLine"/>	COMPRESS YES</xsl:if>
<xsl:value-of select="$newLine"/><xsl:value-of select="$delimiter"/>
<xsl:if test="@VOLATILE='Y'"><xsl:value-of select="$newLine"/>ALTER TABLE "<xsl:value-of select="@OWNER"/>"."<xsl:value-of select="@TABNAME"/>"	VOLATILE<xsl:value-of select="$delimiter"/></xsl:if>
-- indices
<xsl:apply-templates select="indices"/>
-- primary key
<xsl:apply-templates select="primaryKey"/>
-- foreign keys
<xsl:apply-templates select="foreignKeys"/>
-- grants
<xsl:apply-templates select="grants"/>
</xsl:template>

<xsl:template match="columns">
	<xsl:apply-templates select="column"/>
</xsl:template>

<xsl:template match="column">
	<xsl:choose>
		<xsl:when test="position()>1"><xsl:text>&#9;</xsl:text>,</xsl:when>
		<xsl:otherwise> </xsl:otherwise>	
	</xsl:choose>"<xsl:value-of select="@COLUMN_NAME"/>" <xsl:value-of select="@DATA_TYPE"/> 
	<xsl:choose>
  		<xsl:when test="@DATA_TYPE='VARCHAR2' or @DATA_TYPE='VARCHAR' or @DATA_TYPE='CHARACTER' or @DATA_TYPE='CLOB' or @DATA_TYPE='BLOB'">(<xsl:value-of select="@DATA_LENGTH"/>)</xsl:when>
  		<xsl:when test="@DATA_TYPE='DECIMAL' or @DATA_TYPE='NUMBER'">(<xsl:value-of select="@DATA_LENGTH"/><xsl:if test="@DATA_PRECISION != ''">,<xsl:value-of select="@DATA_PRECISION"/></xsl:if>)</xsl:when>
		<xsl:otherwise></xsl:otherwise>	
	</xsl:choose>
	<xsl:if test="not(@NULLABLE='Y')"> NOT NULL</xsl:if>
	<xsl:value-of select="$newLine"/>
</xsl:template>

<xsl:template match="primaryKey">
ALTER TABLE "<xsl:value-of select="../@OWNER"/>"."<xsl:value-of select="../@TABLE_NAME"/>"
  (ADD CONSTRAINT  "<xsl:value-of select="@PK_NAME"/>" PRIMARY KEY
  	(<xsl:apply-templates select="pkColumn"/>	)<xsl:value-of select="$newLine"/>
  )
<xsl:value-of select="$delimiter"/><xsl:value-of select="$newLine"/>
</xsl:template>

<xsl:template match="pkColumn">
	<xsl:choose>
		<xsl:when test="position()>1"><xsl:text>&#9;</xsl:text>,</xsl:when>
	</xsl:choose>"<xsl:value-of select="@COLNAME"/>"
</xsl:template>

<xsl:template match="foreignKeys">
	<xsl:apply-templates select="parent"/>
</xsl:template>

<xsl:template match="parent">
ALTER TABLE "<xsl:value-of select="../../@OWNER"/>"."<xsl:value-of select="../../@TABNAME"/>"
	ADD CONSTRAINT "<xsl:value-of select="@CONSTNAME"/>" FOREIGN KEY 
		(<xsl:value-of select="@FK_COLNAMES"/>	)
		REFERENCES "<xsl:value-of select="@REFOWNER"/>"."<xsl:value-of select="@REFTABNAME"/>" (<xsl:value-of select="@PK_COLNAMES"/>)
		ON DELETE <xsl:choose>
			<xsl:when test="@DELETERULE='A'">NO ACTION</xsl:when>
			<xsl:when test="@DELETERULE='C'">CASCADE</xsl:when>
			<xsl:when test="@DELETERULE='N'">SET NULL</xsl:when>
			<xsl:when test="@DELETERULE='R'">RESTRICT</xsl:when>
		</xsl:choose>
		ON UPDATE <xsl:choose>
			<xsl:when test="@UPDATERULE='A'">NO ACTION</xsl:when>
			<xsl:when test="@UPDATERULE='R'">RESTRICT</xsl:when>
		</xsl:choose><xsl:value-of select="$newLine"/>
<xsl:value-of select="$delimiter"/><xsl:value-of select="$newLine"/>
</xsl:template>

<xsl:template match="indices">
	<xsl:apply-templates select="index"/>
</xsl:template>

<xsl:template match="index">
CREATE <xsl:if test="not(@UNIQUERULE='D')">UNIQUE</xsl:if> INDEX "<xsl:value-of select="@INDSCHEMA"/>"."<xsl:value-of select="@INDNAME"/>"
  ON "<xsl:value-of select="../../@OWNER"/>"."<xsl:value-of select="../../@TABNAME"/>"
	(<xsl:apply-templates select="indexColumns"/>	)
 	<xsl:if test="@INDEXTYPE='CLUS'"><xsl:value-of select="$newLine"/>	CLUSTER</xsl:if>
 	<xsl:if test="@PCTFREE > -1"><xsl:value-of select="$newLine"/>	PCTFREE <xsl:value-of select="@PCTFREE"/></xsl:if>
 	<xsl:if test="@LEVEL2PCTFREE > -1"><xsl:value-of select="$newLine"/>	LEVEL2 PCTFREE <xsl:value-of select="@LEVEL2PCTFREE"/></xsl:if>
	<xsl:value-of select="$newLine"/>	MINPCTUSED <xsl:value-of select="@MINPCTUSED"/> 
	<xsl:value-of select="$newLine"/><xsl:text>	</xsl:text><xsl:if test="not (@REVERSE_SCANS='Y')">DIS</xsl:if>ALLOW REVERSE SCANS
	PAGE SPLIT <xsl:choose>
		<xsl:when test="@PAGESPLIT = 'S'">SYMMETRIC</xsl:when>
		<xsl:when test="@PAGESPLIT = 'H'">HIGH</xsl:when>
		<xsl:when test="@PAGESPLIT = 'L'">LOW</xsl:when>
		<xsl:otherwise>???@PAGESPLIT = "<xsl:value-of select="@PAGESPLIT"/>" ???</xsl:otherwise>
	</xsl:choose>
	<xsl:if test="@COMPRESS='Y'"><xsl:value-of select="$newLine"/>	COMPRESS YES</xsl:if><xsl:value-of select="$newLine"/>
<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template match="indexColumns">
	<xsl:apply-templates select="indexColumn"/>
</xsl:template>

<xsl:template match="indexColumn">
	<xsl:choose>
		<xsl:when test="position()>1"><xsl:text>&#9;</xsl:text>,</xsl:when>
		<xsl:otherwise> </xsl:otherwise>	
	</xsl:choose>"<xsl:value-of select="@COLNAME"/>" <xsl:choose>
  		<xsl:when test="@COLORDER='A'">ASC</xsl:when>
  		<xsl:when test="@COLORDER='D'">DESC</xsl:when>
	</xsl:choose>
	<xsl:value-of select="$newLine"/>
</xsl:template>

<xsl:template match="grants">
	<xsl:apply-templates select="grant"/>
</xsl:template>

<xsl:template match="grant">
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'SELECT'"/> <xsl:with-param name="level" select="@SELECTAUTH"/></xsl:call-template>
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'INSERT'"/> <xsl:with-param name="level" select="@INSERTAUTH"/></xsl:call-template>
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'UPDATE'"/> <xsl:with-param name="level" select="@UPDATEAUTH"/></xsl:call-template>
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'DELETE'"/> <xsl:with-param name="level" select="@DELETEAUTH"/></xsl:call-template>
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'ALTER'"/>  <xsl:with-param name="level" select="@ALTERAUTH"/></xsl:call-template>
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'CONTROL'"/><xsl:with-param name="level" select="@CONTROLAUTH"/></xsl:call-template>
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'INDEX'"/>  <xsl:with-param name="level" select="@INDEXAUTH"/></xsl:call-template>
	<xsl:call-template name="grantAuthType"><xsl:with-param name="auth" select="'REF'"/>    <xsl:with-param name="level" select="@REFAUTH"/></xsl:call-template>
</xsl:template>

<xsl:template name="grantAuthType">
	<xsl:param name="auth"/>
	<xsl:param name="level"/>
	<xsl:choose>
		<xsl:when test="$level = 'Y'">GRANT <xsl:value-of select="$auth"/>	on table "<xsl:value-of select="../../@OWNER"/>"."<xsl:value-of select="../../@TABNAME"/>" <xsl:call-template name="grantee"/> <xsl:value-of select="$delimiter"/><xsl:value-of select="$newLine"/></xsl:when>
		<xsl:when test="$level = 'G'">GRANT <xsl:value-of select="$auth"/>	on table "<xsl:value-of select="../../@OWNER"/>"."<xsl:value-of select="../../@TABNAME"/>" <xsl:call-template name="grantee"/> WITH GRANT OPTION <xsl:value-of select="$delimiter"/><xsl:value-of select="$newLine"/></xsl:when>
	</xsl:choose>
</xsl:template>

<xsl:template name="grantee">
	<xsl:choose>
		<xsl:when test="@GRANTEE = 'PUBLIC  '">PUBLIC</xsl:when>
		<xsl:when test="@GRANTEETYPE = 'G' and not(@GRANTEE = 'PUBLIC  ')">GROUP <xsl:value-of select="@GRANTEE"/></xsl:when>
		<xsl:when test="@GRANTEETYPE = 'R'">ROLE <xsl:value-of select="@GRANTEE"/></xsl:when>
		<xsl:when test="@GRANTEETYPE = 'U'">USER <xsl:value-of select="@GRANTEE"/></xsl:when>
	</xsl:choose>
</xsl:template>

</xsl:stylesheet>