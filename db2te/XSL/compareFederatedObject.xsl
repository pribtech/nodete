<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
<xsl:output method="text"/>
<!--
  Author: Peter Prib
  
  Copyright Frygma Pty Ltd (ABN 90 791 388 622 2009) 2010 All rights reserved.

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
<xsl:template match="/">
-- generated script
	<xsl:apply-templates select="differences"/>
-- end generated script
</xsl:template>
 
<xsl:template match="differences">
	<xsl:apply-templates select="row"/>
</xsl:template>

<xsl:template match="row">
<xsl:choose>
	<xsl:when test="@action = 'insert'">
		<xsl:call-template name="create"/>
  	</xsl:when>
	<xsl:when test="@action = 'delete'">
		<xsl:call-template name="drop"/>
	</xsl:when>
	<xsl:when test="@action = 'update'">
		<xsl:call-template name="drop"/>
		<xsl:call-template name="create"/>
  </xsl:when>
	<xsl:otherwise>
-- error <xsl:value-of select="@action"/> table <xsl:apply-templates select="key"/>
	</xsl:otherwise>
</xsl:choose>
</xsl:template>

<xsl:template match="key">
<xsl:value-of select="."/><xsl:if test="not(position()=last())"> , </xsl:if>
</xsl:template>

<xsl:template name="drop">
drop nickname "<xsl:value-of select="key[@name ='TABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TABNAME']/text()"/>"<xsl:value-of select="$delimiter"/>
</xsl:template>

<xsl:template name="create">
create nickname "<xsl:value-of select="key[@name ='TABSCHEMA']/text()"/>"."<xsl:value-of select="key[@name ='TABNAME']/text()"/>" FOR "<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'SERVERNAME'"/></xsl:call-template>"."<xsl:value-of select="data[@name ='REMOTE_SCHEMA']/new/text()"/>"."<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'REMOTE_TABLE'"/></xsl:call-template>"<xsl:value-of select="$delimiter"/>
CALL SYSPROC.NNSTAT('<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'SERVERNAME'"/></xsl:call-template>','<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'REMOTE_SCHEMA'"/></xsl:call-template>','<xsl:call-template name="dataNew"><xsl:with-param name="col" select="'REMOTE_TABLE'"/></xsl:call-template>',NULL,NULL,0,NULL,?!name=errors?)<xsl:value-of select="$delimiter"/>
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
